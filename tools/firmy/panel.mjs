#!/usr/bin/env node
// Panel firm: cały proces dodawania firm klikany w przeglądarce, bez wiersza poleceń.
// Uruchamia automat, pokazuje postęp, przystanek na NIP, przegląd, konsylium, import,
// logotypy i backup. Działa wyłącznie lokalnie (127.0.0.1), bo używa subskrypcji Claude
// na tym komputerze i klucza service_role z .env.local.
//
//   node tools/firmy/panel.mjs            (otworzy przeglądarkę na http://localhost:3010)
//   node tools/firmy/panel.mjs --port 3011 --bez-przegladarki
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATALOG_PARTII, KATALOG_REPO, dzisiaj, wczytajEnv } from "./lib/env.mjs";
import { sprawdzLogowanie } from "./lib/claude.mjs";
import { geminiZainstalowany, plikGemini, stanLogowaniaGemini } from "./lib/gemini.mjs";
import { kontekstImportu, wykonajPlan, zbudujPlan } from "./lib/import-lib.mjs";
import { obsluzApiPrzegladu, wczytajPartie, zapiszPartie } from "./lib/przeglad-api.mjs";
import { LIMIT_MF_NA_DOBE, mfLicznik } from "./lib/rejestry.mjs";
import { kategorie as pobierzKategorie, indeksFirm, kolumnaIstnieje } from "./lib/supabase.mjs";
import { normalizujNip } from "./lib/tekst.mjs";

const KATALOG = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d; };
const PORT = Number(opt("port", 3010));
const KATALOG_BACKUPU = path.join(KATALOG_REPO, "data", "robocze", "backup");
const DYSK_GOOGLE = "G:\\Mój dysk\\zapisy supabase czypolskafirma";

fs.mkdirSync(KATALOG_PARTII, { recursive: true });

// ---------- pamięć podręczna danych z bazy ----------
let kategorie = [];
let indeks = [];
let bazaBlad = null;

async function odswiezBaze() {
  try {
    [kategorie, indeks] = await Promise.all([pobierzKategorie(), indeksFirm()]);
    bazaBlad = null;
  } catch (e) {
    bazaBlad = e.message;
  }
}
await odswiezBaze();

// ---------- zadania w tle ----------
const zadania = new Map();
let licznikZadan = 0;

function nowezadanie(typ, opis, partia) {
  const id = `z${++licznikZadan}`;
  const z = { id, typ, opis, partia: partia || null, status: "pracuje", log: [], start: Date.now(), koniec: null, kod: null, proces: null };
  zadania.set(id, z);
  return z;
}

function dopisz(z, tekst) {
  for (const linia of String(tekst).split(/\r?\n/)) {
    if (!linia.trim()) continue;
    z.log.push(linia);
  }
  if (z.log.length > 500) z.log.splice(0, z.log.length - 500);
}

function zadanieProcesu({ typ, opis, plik, argumenty = [], partia = null }) {
  const z = nowezadanie(typ, opis, partia);
  const p = spawn(process.execPath, [plik, ...argumenty], { cwd: KATALOG_REPO, env: { ...process.env } });
  z.proces = p;
  z.pid = p.pid;
  p.stdout.on("data", (d) => dopisz(z, d.toString("utf8")));
  p.stderr.on("data", (d) => dopisz(z, d.toString("utf8")));
  p.on("close", (kod) => {
    z.kod = kod;
    z.status = z.status === "zatrzymane" ? "zatrzymane" : kod === 0 ? "gotowe" : "blad";
    z.koniec = Date.now();
    z.proces = null;
  });
  p.on("error", (e) => { dopisz(z, `Nie udało się uruchomić: ${e.message}`); z.status = "blad"; z.koniec = Date.now(); });
  return z;
}

function zatrzymaj(z) {
  if (!z?.proces) return false;
  z.status = "zatrzymane";
  // Na Windows automat uruchamia claude.exe jako proces potomny — trzeba ubić całe drzewo.
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(z.proces.pid), "/T", "/F"]);
  else z.proces.kill("SIGTERM");
  return true;
}

const zadaniePubliczne = (z) => ({ id: z.id, typ: z.typ, opis: z.opis, partia: z.partia, status: z.status, kod: z.kod, sekundy: Math.round(((z.koniec || Date.now()) - z.start) / 1000), log: z.log.slice(-200) });
const zadanieAutomatuTrwa = () => [...zadania.values()].some((z) => z.typ === "automat" && z.status === "pracuje");

// ---------- partie ----------
const plikPartii = (nazwa) => path.join(KATALOG_PARTII, `partia-${nazwa}.json`);

function listaPartii() {
  if (!fs.existsSync(KATALOG_PARTII)) return [];
  return fs.readdirSync(KATALOG_PARTII)
    .filter((p) => p.startsWith("partia-") && p.endsWith(".json"))
    .map((p) => {
      const pelna = path.join(KATALOG_PARTII, p);
      const nazwa = p.replace(/^partia-|\.json$/g, "");
      try {
        const partia = JSON.parse(fs.readFileSync(pelna, "utf8"));
        return { nazwa, ...podsumowaniePartii(partia), zmieniono: fs.statSync(pelna).mtimeMs };
      } catch (e) {
        return { nazwa, blad: e.message, zmieniono: fs.statSync(pelna).mtimeMs };
      }
    })
    .sort((a, b) => b.zmieniono - a.zmieniono);
}

function krokFirmy(f) {
  if (f.pomin) return { krok: 0, etap: "pominięta" };
  if (f.rekord) return { krok: 5, etap: "gotowe" };
  if (f.bledy?.length && !f.tozsamosc) return { krok: 1, etap: "błąd" };
  if (!f.tozsamosc) return { krok: 1, etap: "szukanie NIP-u" };
  if (!f.rejestr) return { krok: 2, etap: "pobieranie odpisu z KRS" };
  if (!f.sledztwo) return { krok: 3, etap: f.etapy?.sledztwo === "czeka na potwierdzenie NIP" ? "czeka na potwierdzenie NIP" : "śledztwo właścicielskie" };
  if (!f.kontrola) return { krok: 4, etap: "samokontrola" };
  if (!f.opisy) return { krok: 5, etap: "pisanie opisów" };
  return { krok: 5, etap: "kończenie" };
}

function podsumowaniePartii(partia) {
  const s = { firm: partia.firmy.length, WYSOKA: 0, SREDNIA: 0, KONFLIKT: 0, gotowe: 0, zatwierdzone: 0, zaimportowane: 0, pominiete: 0, bledy: 0, czekaNaNip: 0 };
  for (const f of partia.firmy) {
    if (f.pomin) { s.pominiete++; continue; }
    if (f.status) s[f.status]++;
    if (f.rekord) s.gotowe++;
    if (f.decyzja === "zatwierdzony") s.zatwierdzone++;
    if (f.decyzja === "zaimportowany") s.zaimportowane++;
    if (f.bledy?.length) s.bledy++;
    if (f.etapy?.sledztwo === "czeka na potwierdzenie NIP") s.czekaNaNip++;
  }
  return { ...s, tryb: partia.tryb || "nowe", utworzono: partia.utworzono || null, przystanekNip: !!partia.przystanekNip, konsylia: partia.konsylia || [] };
}

const pustePodsumowanie = { firm: 0, WYSOKA: 0, SREDNIA: 0, KONFLIKT: 0, gotowe: 0, zatwierdzone: 0, zaimportowane: 0, pominiete: 0, bledy: 0, czekaNaNip: 0, tryb: "nowe", konsylia: [] };
const zadanieDlaPartii = (nazwa) => [...zadania.values()].filter((z) => z.partia === nazwa && z.status === "pracuje").map((z) => z.id)[0] || null;

function postepPartii(nazwa) {
  if (!nazwa) return { blad: "Nie wybrano partii." };
  // Świeżo uruchomiona partia: automat startuje bazę i pierwszy krok, pliku jeszcze nie ma.
  if (!fs.existsSync(plikPartii(nazwa))) {
    const zadanie = zadanieDlaPartii(nazwa);
    if (zadanie) return { nazwa, przygotowanie: true, ...pustePodsumowanie, firmy: [], minutyDoKonca: null, zadanie };
    return { blad: `Nie ma partii „${nazwa}".` };
  }
  const partia = wczytajPartie(plikPartii(nazwa));
  const firmy = partia.firmy.map((f) => ({
    nazwa: f.nazwa,
    ...krokFirmy(f),
    status: f.status || null,
    kraj: f.rekord?.country_code || null,
    wlasciciel: f.rekord?.owner_name || null,
    nip: f.tozsamosc?.nip || f.nipPodany || null,
    bledy: f.bledy || [],
  }));
  const pod = podsumowaniePartii(partia);
  const zostalo = firmy.filter((f) => f.etap !== "gotowe" && f.etap !== "pominięta" && f.etap !== "czeka na potwierdzenie NIP").length;
  // Do przystanku na NIP idzie tylko krok 1 i 2 (ok. 1,5 min na firmę); pełny przebieg to ok. 3,5 min.
  const minutNaFirme = partia.przystanekNip ? 1.5 : 3.5;
  const s = partia.statystyki || {};
  const tokenow = (s.tokenyWe || 0) + (s.tokenyCache || 0) + (s.tokenyWy || 0);
  return {
    nazwa,
    ...pod,
    firmy,
    doPrzystanku: !!partia.przystanekNip,
    minutyDoKonca: Math.ceil((zostalo * minutNaFirme) / 2),
    zadanie: zadanieDlaPartii(nazwa),
    zuzycie: { wywolan: s.wywolan || 0, tokenow, naFirme: pod.firm ? Math.round(tokenow / pod.firm) : 0, minutModelu: Math.round((s.sekundy || 0) / 60) },
    nipModel: partia.nipModel || "claude",
    zuzycieGemini: partia.statystykiGemini
      ? { wywolan: partia.statystykiGemini.wywolan, tokenow: partia.statystykiGemini.tokenyWe + partia.statystykiGemini.tokenyCache + partia.statystykiGemini.tokenyWy }
      : null,
  };
}

// Błędy z wywołań modelu po ludzku (surowy tekst zostaje w logu technicznym).
function opiszBlad(tekst) {
  const t = String(tekst || "");
  if (/spend limit|usage limit|hit your|rate limit|limit/i.test(t)) return "Zabrakło limitu Claude. Spróbuj ponownie, gdy limit się odnowi, albo wpisz NIP ręcznie.";
  if (/timeout/i.test(t)) return "Model nie zdążył w limicie czasu. Spróbuj ponownie.";
  if (/nie udało się uruchomić claude|ENOENT/i.test(t)) return "Nie udało się uruchomić Claude na tym komputerze.";
  return t.replace(/^tożsamość:\s*/, "").slice(0, 200);
}

// Tabela przystanku na NIP: co model znalazł i co mówią rejestry.
function tabelaNip(nazwa) {
  if (!nazwa) return { blad: "Nie wybrano partii." };
  if (!fs.existsSync(plikPartii(nazwa))) {
    return zadanieDlaPartii(nazwa) ? { nazwa, przygotowanie: true, firmy: [] } : { blad: `Nie ma partii „${nazwa}".` };
  }
  const partia = wczytajPartie(plikPartii(nazwa));
  // Jedna spółka potrafi prowadzić kilka marek z listy (np. Sweet Gallery: Lodolandia,
  // Bafra Kebab, Kołacz na Okrągło). Pokazujemy to jako informację, nie jako błąd.
  const wgNipu = new Map();
  for (const f of partia.firmy) {
    const nip = f.tozsamosc?.nip || f.nipPodany;
    if (nip) wgNipu.set(nip, [...(wgNipu.get(nip) || []), f.nazwa]);
  }
  return {
    nazwa,
    firmy: partia.firmy.map((f) => {
      const t = f.tozsamosc || {};
      const problem = t.status === "KONFLIKT" ? t.powod : null;
      const uwaga = f.uwagiTozsamosci || (t.status !== "KONFLIKT" && t.mf?.nazwa && t.nazwa_spolki && !problem ? null : null);
      return {
        nazwa: f.nazwa,
        nip: t.nip || f.nipPodany || "",
        krs: t.krs || null,
        spolka: t.mf?.nazwa || t.nazwa_spolki || null,
        adres: t.mf?.adres || null,
        podanyPrzezCiebie: !!f.nipPodany,
        wynik: !t.nip ? "brak" : problem ? "zle" : uwaga || f.uwagiTozsamosci ? "uwaga" : "ok",
        powod: problem || f.uwagiTozsamosci || null,
        wBazie: t.istniejeWBazie ? { slug: t.istniejeWBazie.slug, kraj: t.istniejeWBazie.country_code, wlasciciel: t.istniejeWBazie.owner_name } : null,
        tenSamNipCo: (wgNipu.get(t.nip || f.nipPodany) || []).filter((n) => n !== f.nazwa),
        blad: !f.tozsamosc && f.bledy?.length ? opiszBlad(f.bledy[0]) : null,
        pomin: !!f.pomin,
        gotowa: !!f.rekord,
      };
    }),
  };
}

// ---------- logotypy ----------
function domenaZUrl(url) {
  try {
    return new URL(String(url).startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function stanLogotypow() {
  const katalog = path.join(KATALOG_REPO, "public", "logos");
  const pliki = fs.existsSync(katalog) ? fs.readdirSync(katalog) : [];
  const brakujace = [];
  for (const f of indeks) {
    const d = domenaZUrl(f.website_url);
    if (!d) continue;
    if (!pliki.some((p) => p.startsWith(d + "."))) brakujace.push({ slug: f.slug, nazwa: f.name, domena: d });
  }
  return { plikow: pliki.length, brakujacych: brakujace.length, brakujace: brakujace.slice(0, 40), bezUrl: indeks.filter((f) => !domenaZUrl(f.website_url)).length };
}

function git(...argumenty) {
  const r = spawnSync("git", argumenty, { cwd: KATALOG_REPO, encoding: "utf8" });
  return { kod: r.status, wyjscie: `${r.stdout || ""}${r.stderr || ""}`.trim() };
}

function stanGitLogotypow() {
  const galaz = git("rev-parse", "--abbrev-ref", "HEAD").wyjscie;
  const zmiany = git("status", "--porcelain", "--", "public/logos", "public/logos-og").wyjscie;
  const linie = zmiany ? zmiany.split(/\r?\n/).filter(Boolean) : [];
  return {
    galaz,
    naDevelop: galaz === "develop",
    plikow: linie.length,
    przyklady: linie.slice(0, 10).map((l) => l.slice(3)),
    ostatniCommit: git("log", "-1", "--format=%ad · %s", "--date=format:%d.%m.%Y %H:%M", "--", "public/logos").wyjscie || null,
  };
}

// ---------- backup ----------
function stanBackupu() {
  const zKatalogu = (katalog, skad) => {
    if (!fs.existsSync(katalog)) return [];
    return fs.readdirSync(katalog)
      .filter((p) => p.startsWith("companies-") && p.endsWith(".json"))
      .map((p) => {
        const st = fs.statSync(path.join(katalog, p));
        let firm = null;
        try { firm = JSON.parse(fs.readFileSync(path.join(katalog, p), "utf8")).liczbaFirm; } catch {}
        return { plik: p, skad, kiedy: st.mtimeMs, kb: Math.round(st.size / 1024), firm };
      });
  };
  const wszystkie = [...zKatalogu(DYSK_GOOGLE, "Dysk Google"), ...zKatalogu(KATALOG_BACKUPU, "dysk lokalny")].sort((a, b) => b.kiedy - a.kiedy);
  return { dysk: fs.existsSync(DYSK_GOOGLE), katalogDysku: DYSK_GOOGLE, backupy: wszystkie.slice(0, 12) };
}

// ---------- gotowość ----------
async function gotowosc() {
  const env = wczytajEnv();
  const lg = await sprawdzLogowanie().catch((e) => ({ zalogowany: false, powod: e.message }));
  let kolumny = { sources: null, confidence: null };
  if (!bazaBlad) {
    try {
      kolumny = { sources: await kolumnaIstnieje("companies", "sources"), confidence: await kolumnaIstnieje("companies", "confidence") };
    } catch {}
  }
  const mf = mfLicznik();
  const backupy = stanBackupu().backupy;
  const gm = stanLogowaniaGemini();
  return {
    claude: { ok: !!lg.zalogowany, metoda: lg.metoda || null, powod: lg.powod || null },
    gemini: { ok: gm.zalogowany, zainstalowany: geminiZainstalowany(), metoda: gm.metoda || null, powod: gm.powod || null },
    baza: { ok: !bazaBlad, firm: indeks.length, kategorii: kategorie.length, blad: bazaBlad },
    zapis: { ok: !!env.SUPABASE_SERVICE_ROLE_KEY },
    kolumny,
    mf: { ...mf, limit: LIMIT_MF_NA_DOBE },
    backup: backupy[0] ? { kiedy: backupy[0].kiedy, skad: backupy[0].skad, firm: backupy[0].firm } : null,
    partie: listaPartii().slice(0, 3),
    automatPracuje: zadanieAutomatuTrwa(),
  };
}

// ---------- serwer ----------
function json(res, dane, kod = 200) {
  res.writeHead(kod, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(dane));
}

function plikStatyczny(res, nazwa, typ) {
  const tresc = fs.readFileSync(path.join(KATALOG, nazwa), "utf8");
  res.writeHead(200, { "Content-Type": `${typ}; charset=utf-8`, "Cache-Control": "no-store" });
  res.end(tresc);
}

// Strona przeglądu (przeglad.html) w ramce panelu: dopisujemy do jej zapytań wybraną partię,
// żeby ten sam plik działał i samodzielnie, i w panelu.
function stronaPrzegladu(res, nazwaPartii) {
  const html = fs.readFileSync(path.join(KATALOG, "przeglad.html"), "utf8");
  const wstawka = `<script>
    (function () {
      const PARTIA = ${JSON.stringify(nazwaPartii)};
      const oryginalny = window.fetch;
      window.fetch = (u, o) => oryginalny(typeof u === "string" && u.startsWith("/api/") ? u + (u.includes("?") ? "&" : "?") + "partia=" + encodeURIComponent(PARTIA) : u, o);
    })();
  </script>`;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(html.replace("</head>", `${wstawka}\n</head>`));
}

const serwer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  // Ciało zbieramy w buforach i dopiero na końcu dekodujemy jako UTF-8 (polskie znaki
  // potrafią wypaść na granicy pakietów).
  const cialo = () => new Promise((r) => { const cz = []; req.on("data", (d) => cz.push(d)); req.on("end", () => { const t = Buffer.concat(cz).toString("utf8"); r(t ? JSON.parse(t) : {}); }); });
  const p = url.pathname;
  try {
    if (req.method === "GET" && (p === "/" || p === "/index.html")) return plikStatyczny(res, "panel.html", "text/html");
    if (req.method === "GET" && p === "/favicon.ico") {
      // Biało-czerwony znacznik zamiast pustej ikony karty (i bez 404 w konsoli).
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="8" fill="#fff"/><rect y="8" width="16" height="8" fill="#8f1d1d"/></svg>`;
      res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "max-age=86400" });
      return res.end(svg);
    }
    if (req.method === "GET" && p === "/przeglad") return stronaPrzegladu(res, url.searchParams.get("partia"));

    // --- API przeglądu (wspólne z przeglad.mjs), partia z zapytania ---
    if (p.startsWith("/api/") && !p.startsWith("/api/panel/")) {
      const nazwa = url.searchParams.get("partia");
      if (await obsluzApiPrzegladu(req, res, url, { plik: () => plikPartii(nazwa), kategorie })) return;
    }

    // --- API panelu ---
    if (req.method === "GET" && p === "/api/panel/gotowosc") return json(res, await gotowosc());
    if (req.method === "GET" && p === "/api/panel/kategorie") return json(res, { kategorie });
    if (req.method === "GET" && p === "/api/panel/partie") return json(res, { partie: listaPartii(), automatPracuje: zadanieAutomatuTrwa() });
    if (req.method === "GET" && p === "/api/panel/postep") return json(res, postepPartii(url.searchParams.get("partia")));
    if (req.method === "GET" && p === "/api/panel/nip") return json(res, tabelaNip(url.searchParams.get("partia")));
    if (req.method === "GET" && p === "/api/panel/zadanie") {
      const z = zadania.get(url.searchParams.get("id"));
      return z ? json(res, zadaniePubliczne(z)) : json(res, { blad: "nie ma takiego zadania" }, 404);
    }
    if (req.method === "GET" && p === "/api/panel/zadania") return json(res, { zadania: [...zadania.values()].map(zadaniePubliczne) });

    if (req.method === "POST" && p === "/api/panel/uruchom") {
      const dane = await cialo();
      if (zadanieAutomatuTrwa()) return json(res, { blad: "Automat już pracuje. Poczekaj albo zatrzymaj poprzednią partię." }, 409);
      const nazwa = String(dane.partia || dzisiaj()).trim().replace(/[^\w\-.]/g, "-");
      const argumenty = [path.join(KATALOG, "automat.mjs"), "--partia", nazwa];
      if (dane.kategoria) argumenty.push("--kategoria", String(dane.kategoria), "--seed", String(Number(dane.seed) || 40));
      const firmy = (dane.firmy || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (firmy.length) {
        // Lista firm idzie przez plik, żeby uniknąć limitów długości polecenia i zachować "Nazwa | NIP".
        const plikListy = path.join(KATALOG_PARTII, `lista-${nazwa}.txt`);
        fs.writeFileSync(plikListy, firmy.join("\n"), "utf8");
        argumenty.push("--plik", plikListy);
      }
      if (!firmy.length && !dane.kategoria && !fs.existsSync(plikPartii(nazwa))) return json(res, { blad: "Podaj nazwy firm albo wybierz kategorię." }, 400);
      if (dane.reweryfikacja) argumenty.push("--reweryfikacja");
      if (dane.crbr) argumenty.push("--crbr");
      if (dane.bezGieldy) argumenty.push("--bez-gieldy");
      if (dane.dokladnaKontrola) argumenty.push("--model-kontrola", "opus");
      if (dane.przystanekNip !== false) argumenty.push("--stop-po-nip");
      if (dane.rownolegle) argumenty.push("--rownolegle", String(Number(dane.rownolegle) || 2));
      if (dane.nipModel === "gemini" || dane.nipModel === "claude") argumenty.push("--nip-model", dane.nipModel);
      const z = zadanieProcesu({ typ: "automat", opis: `Partia ${nazwa}`, plik: argumenty[0], argumenty: argumenty.slice(1), partia: nazwa });
      return json(res, { ok: true, partia: nazwa, zadanie: z.id });
    }

    if (req.method === "POST" && p === "/api/panel/dalej") {
      const dane = await cialo();
      if (zadanieAutomatuTrwa()) return json(res, { blad: "Automat już pracuje." }, 409);
      const nazwa = String(dane.partia || "");
      if (!fs.existsSync(plikPartii(nazwa))) return json(res, { blad: "Nie ma takiej partii." }, 404);
      const argumenty = ["--partia", nazwa];
      if (dane.tylkoNip) argumenty.push("--stop-po-nip");
      if (dane.nipModel === "gemini" || dane.nipModel === "claude") argumenty.push("--nip-model", dane.nipModel);
      if (dane.crbr) argumenty.push("--crbr");
      if (dane.dokladnaKontrola) argumenty.push("--model-kontrola", "opus");
      const z = zadanieProcesu({ typ: "automat", opis: dane.tylkoNip ? `Sprawdzenie NIP-ów (${nazwa})` : `Partia ${nazwa} — dalszy ciąg`, plik: path.join(KATALOG, "automat.mjs"), argumenty, partia: nazwa });
      return json(res, { ok: true, partia: nazwa, zadanie: z.id });
    }

    if (req.method === "POST" && p === "/api/panel/zatrzymaj") {
      const { id } = await cialo();
      const z = zadania.get(id);
      return json(res, { ok: zatrzymaj(z) });
    }

    // Decyzje z przystanku. Każda firma dostaje jedno z trzech: "dalej" (akceptuję numer),
    // "szukaj" (szukaj numeru jeszcze raz) albo "pomin". Wpisany ręcznie NIP ma pierwszeństwo
    // i sprawdzają go same rejestry. Bez `ponow` tylko liczymy, co wymaga sprawdzenia.
    if (req.method === "POST" && p === "/api/panel/nip") {
      const { partia: nazwa, zmiany, ponow } = await cialo();
      const sciezka = plikPartii(nazwa);
      const partia = wczytajPartie(sciezka);
      const doSprawdzeniaNazwy = [];
      const wyczyscTozsamosc = (f) => {
        delete f.tozsamosc;
        delete f.rejestr;
        delete f.historiaKrs;
        delete f.crbr;
        f.etapy = {};
        f.bledy = [];
      };
      for (const zm of zmiany || []) {
        const f = partia.firmy.find((x) => x.nazwa === zm.nazwa);
        if (!f) continue;
        const decyzja = zm.decyzja || (zm.pomin ? "pomin" : "dalej");
        f.pomin = decyzja === "pomin";
        if (f.pomin) continue;
        const nowy = normalizujNip(zm.nip || "");
        const stary = normalizujNip(f.tozsamosc?.nip || f.nipPodany || "");
        if (nowy && nowy !== stary) {
          doSprawdzeniaNazwy.push(f.nazwa);
          if (ponow) {
            wyczyscTozsamosc(f);
            f.nipPodany = nowy;
            delete f.szukajDokladnie;
          }
        } else if (decyzja === "szukaj" || !f.tozsamosc) {
          doSprawdzeniaNazwy.push(f.nazwa);
          if (ponow) {
            // Była już próba i rejestry jej nie potwierdziły: szukamy dokładniej (mocniejszy
            // model, z pobieraniem stron). Firma bez żadnej próby (np. limit) idzie tanią drogą.
            const bylaProba = !!f.tozsamosc;
            wyczyscTozsamosc(f);
            delete f.nipPodany;
            if (bylaProba) f.szukajDokladnie = true;
          }
        }
      }
      zapiszPartie(sciezka, partia);
      return json(res, { ok: true, doSprawdzenia: doSprawdzeniaNazwy.length, nazwy: doSprawdzeniaNazwy });
    }

    if (req.method === "GET" && p === "/api/panel/import-plan") {
      const nazwa = url.searchParams.get("partia");
      const partia = wczytajPartie(plikPartii(nazwa));
      const ctx = await kontekstImportu();
      const plan = zbudujPlan(partia, ctx);
      return json(res, {
        partia: nazwa,
        brakKolumn: [!ctx.maSources && "sources", !ctx.maConfidence && "confidence"].filter(Boolean),
        plan: plan.map((x) => ({
          nazwa: x.nazwa,
          akcja: x.akcja,
          kategoria: x.kategoria,
          kraj: x.wiersz.country_code,
          wlasciciel: x.wiersz.owner_name,
          nip: x.wiersz.nip || null,
          slugWBazie: x.slugWBazie,
          bylo: x.bylo,
          bledy: x.bledy,
          ostrzezenia: x.ostrzezenia,
        })),
      });
    }

    if (req.method === "POST" && p === "/api/panel/import") {
      const { partia: nazwa, bezBackupu } = await cialo();
      const sciezka = plikPartii(nazwa);
      const z = nowezadanie("import", `Import partii ${nazwa}`, nazwa);
      json(res, { ok: true, zadanie: z.id });
      (async () => {
        try {
          if (!bezBackupu) {
            dopisz(z, "Backup bazy przed zapisem...");
            const cel = fs.existsSync(DYSK_GOOGLE) ? DYSK_GOOGLE : KATALOG_BACKUPU;
            const b = spawnSync(process.execPath, [path.join(KATALOG, "backup.mjs"), "--do", cel], { cwd: KATALOG_REPO, encoding: "utf8" });
            dopisz(z, `${b.stdout || ""}${b.stderr || ""}`);
            if (b.status !== 0) throw new Error("Backup się nie powiódł, import przerwany.");
          }
          const partia = wczytajPartie(sciezka);
          const ctx = await kontekstImportu();
          const plan = zbudujPlan(partia, ctx);
          dopisz(z, `Do zapisu: ${plan.filter((x) => !x.bledy.length).length} rekordów.`);
          const { ok, zle } = await wykonajPlan(plan, partia, sciezka, {
            naWpis: (w) => dopisz(z, w.blad ? `BŁĄD ${w.nazwa}: ${w.blad}` : `zapisano ${w.nazwa} (${w.akcja})`),
          });
          dopisz(z, `Gotowe: zapisano ${ok}, błędów ${zle}.`);
          await odswiezBaze();
          z.status = zle ? "blad" : "gotowe";
        } catch (e) {
          dopisz(z, `BŁĄD: ${e.message}`);
          z.status = "blad";
        }
        z.koniec = Date.now();
      })();
      return;
    }

    if (req.method === "GET" && p === "/api/panel/logo-stan") return json(res, { ...stanLogotypow(), git: stanGitLogotypow() });
    if (req.method === "POST" && p === "/api/panel/logo-pobierz") {
      const z = zadanieProcesu({ typ: "logo", opis: "Pobieranie logotypów", plik: path.join(KATALOG_REPO, "tools", "fetch-logos.mjs") });
      return json(res, { ok: true, zadanie: z.id });
    }
    if (req.method === "POST" && p === "/api/panel/logo-og") {
      const z = zadanieProcesu({ typ: "logo", opis: "Obrazki do udostępniania", plik: path.join(KATALOG_REPO, "tools", "generate-og-assets.mjs"), argumenty: ["logos"] });
      return json(res, { ok: true, zadanie: z.id });
    }
    if (req.method === "POST" && p === "/api/panel/logo-wyslij") {
      const stan = stanGitLogotypow();
      if (!stan.naDevelop) return json(res, { blad: `Jesteś na gałęzi "${stan.galaz}". Wysyłka działa tylko z gałęzi develop.` }, 400);
      if (!stan.plikow) return json(res, { blad: "Nie ma nowych plików do wysłania." }, 400);
      const z = nowezadanie("git", "Wysyłka logotypów na podgląd", null);
      json(res, { ok: true, zadanie: z.id });
      const kroki = [
        ["add", "--", "public/logos", "public/logos-og"],
        ["commit", "-m", `Logotypy: ${stan.plikow} plikow (panel firm)`],
        ["push", "origin", "develop"],
      ];
      for (const k of kroki) {
        const r = git(...k);
        dopisz(z, `git ${k[0]}: ${r.wyjscie || "ok"}`);
        if (r.kod !== 0) { z.status = "blad"; z.koniec = Date.now(); return; }
      }
      dopisz(z, "Gotowe. Podgląd odświeży się na Vercelu w ciągu 1-2 minut.");
      z.status = "gotowe";
      z.koniec = Date.now();
      return;
    }

    if (req.method === "GET" && p === "/api/panel/backup-stan") return json(res, stanBackupu());
    if (req.method === "POST" && p === "/api/panel/backup") {
      const cel = fs.existsSync(DYSK_GOOGLE) ? DYSK_GOOGLE : KATALOG_BACKUPU;
      const z = zadanieProcesu({ typ: "backup", opis: `Backup bazy → ${cel}`, plik: path.join(KATALOG, "backup.mjs"), argumenty: ["--do", cel] });
      return json(res, { ok: true, zadanie: z.id });
    }

    // Logowanie Gemini jest interaktywne (wybór konta Google w przeglądarce), więc otwieramy
    // zwykłe okno z Gemini CLI. Użytkownik wybiera "Sign in with Google", potem zamyka okno.
    if (req.method === "POST" && p === "/api/panel/zaloguj-gemini") {
      if (!geminiZainstalowany()) return json(res, { blad: "Gemini CLI nie jest zainstalowany." }, 400);
      const katalog = path.join(KATALOG_PARTII, "gemini-cwd");
      fs.mkdirSync(katalog, { recursive: true });
      if (process.platform === "win32") {
        spawn("cmd", ["/c", "start", "Logowanie Gemini", "/D", katalog, "cmd", "/k", plikGemini()], { detached: true, stdio: "ignore", windowsHide: false }).unref();
      }
      return json(res, { ok: true });
    }

    if (req.method === "POST" && p === "/api/panel/odswiez-baze") {
      await odswiezBaze();
      return json(res, { ok: !bazaBlad, firm: indeks.length, blad: bazaBlad });
    }

    if (req.method === "POST" && p === "/api/panel/zamknij") {
      json(res, { ok: true });
      // Bez tego automat zostałby w tle jako proces bez nadzoru (strona ostrzega o przerwaniu).
      for (const z of zadania.values()) if (z.status === "pracuje") zatrzymaj(z);
      setTimeout(() => process.exit(0), 300);
      return;
    }

    json(res, { blad: "nieznana ścieżka" }, 404);
  } catch (e) {
    json(res, { blad: e.message }, 500);
  }
});

const ADRES = `http://localhost:${PORT}/`;

function otworzPrzegladarke() {
  if (args.includes("--bez-przegladarki")) return;
  if (process.platform === "win32") spawn("cmd", ["/c", "start", "", ADRES], { detached: true, stdio: "ignore" }).unref();
  else spawn(process.platform === "darwin" ? "open" : "xdg-open", [ADRES], { detached: true, stdio: "ignore" }).unref();
}

// Drugie kliknięcie ikony na pulpicie nie ma uruchamiać drugiego panelu — otwiera ten działający.
serwer.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log(`Panel już działa: ${ADRES} — otwieram go w przeglądarce.`);
    otworzPrzegladarke();
    setTimeout(() => process.exit(0), 500);
    return;
  }
  console.error(`Nie udało się uruchomić panelu: ${e.message}`);
  process.exit(1);
});

serwer.listen(PORT, "127.0.0.1", () => {
  console.log(`Panel firm: ${ADRES}  (Ctrl+C kończy)`);
  console.log(`Partie: ${KATALOG_PARTII}`);
  if (bazaBlad) console.log(`Uwaga: baza nie odpowiada (${bazaBlad}).`);
  otworzPrzegladarke();
});
