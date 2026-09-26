#!/usr/bin/env node
// Panel firm: cały proces dodawania firm klikany w przeglądarce, bez wiersza poleceń.
// Uruchamia automat, pokazuje postęp, przystanek na NIP, przegląd, konsylium, import,
// logotypy i backup. Działa wyłącznie lokalnie (127.0.0.1), bo używa subskrypcji Claude
// na tym komputerze i klucza service_role z .env.local.
//
//   node tools/firmy/panel.mjs            (otworzy przeglądarkę na http://localhost:3010)
//   node tools/firmy/panel.mjs --port 3011 --bez-przegladarki
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATALOG_PARTII, KATALOG_REPO, dzisiaj, wczytajEnv } from "./lib/env.mjs";
import { sprawdzLogowanie } from "./lib/claude.mjs";
import { stanLogowaniaGemini, wybierzModelGemini } from "./lib/gemini.mjs";
import { kontekstImportu, wykonajPlan, zbudujPlan } from "./lib/import-lib.mjs";
import { obsluzApiPrzegladu, wczytajPartie, zapiszPartie } from "./lib/przeglad-api.mjs";
import { LIMIT_MF_NA_DOBE, mfLicznik } from "./lib/rejestry.mjs";
import { kategorie as pobierzKategorie, indeksFirm, kolumnaIstnieje } from "./lib/supabase.mjs";
import { ROZSTRZYGNIECIE, czekaNaCzaty, dopasuj, parsujOdpowiedz, cofnijWersje, czesciRozstrzygniecia, firmyDoRozstrzygniecia, instrukcjaRozstrzygniecia, porownanie, promptZbiorczy, przyjmijWersje, zapiszOdpowiedz } from "./lib/sledztwo-reczne.mjs";
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
  if (!f.sledztwo) {
    if (f.etapy?.sledztwo === "czeka na potwierdzenie NIP") return { krok: 3, etap: "czeka na potwierdzenie NIP" };
    if (/czeka na czaty|--tylko-rejestry/.test(f.etapy?.sledztwo || "")) return { krok: 3, etap: "śledztwo w czatach" };
    return { krok: 3, etap: "śledztwo właścicielskie" };
  }
  if (!f.kontrola) return { krok: 4, etap: "samokontrola" };
  if (!f.opisy) return { krok: 5, etap: "pisanie opisów" };
  return { krok: 5, etap: "kończenie" };
}

function podsumowaniePartii(partia) {
  const s = { firm: partia.firmy.length, WYSOKA: 0, SREDNIA: 0, KONFLIKT: 0, gotowe: 0, zatwierdzone: 0, zaimportowane: 0, pominiete: 0, bledy: 0, czekaNaNip: 0, czekaNaCzaty: 0 };
  for (const f of partia.firmy) {
    if (f.pomin) { s.pominiete++; continue; }
    if (f.status) s[f.status]++;
    if (f.rekord) s.gotowe++;
    if (f.decyzja === "zatwierdzony") s.zatwierdzone++;
    if (f.decyzja === "zaimportowany") s.zaimportowane++;
    if (f.bledy?.length) s.bledy++;
    if (f.etapy?.sledztwo === "czeka na potwierdzenie NIP" || (partia.sciezka === "reczna" && !partia.nipPotwierdzone && !f.tozsamosc)) s.czekaNaNip++;
    if (partia.sciezka === "reczna" && czekaNaCzaty(f)) s.czekaNaCzaty++;
  }
  return { ...s, sciezka: partia.sciezka || "automat", tryb: partia.tryb || "nowe", utworzono: partia.utworzono || null, przystanekNip: !!partia.przystanekNip, konsylia: partia.konsylia || [] };
}

const pustePodsumowanie = { firm: 0, WYSOKA: 0, SREDNIA: 0, KONFLIKT: 0, gotowe: 0, zatwierdzone: 0, zaimportowane: 0, pominiete: 0, bledy: 0, czekaNaNip: 0, czekaNaCzaty: 0, tryb: "nowe", konsylia: [] };
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
  const reczna = partia.sciezka === "reczna";
  const firmy = partia.firmy.map((f) => ({
    nazwa: f.nazwa,
    ...(reczna && !f.pomin && !f.tozsamosc && !f.nipPodany ? { krok: 1, etap: "brak numeru NIP" } : reczna && !f.pomin && !f.tozsamosc ? { krok: 1, etap: "sprawdzanie NIP-u w Białej Liście" } : krokFirmy(f)),
    status: f.status || null,
    kraj: f.rekord?.country_code || null,
    wlasciciel: f.rekord?.owner_name || null,
    nip: f.tozsamosc?.nip || f.nipPodany || null,
    bledy: f.bledy || [],
  }));
  const pod = podsumowaniePartii(partia);
  const zostalo = firmy.filter((f) => f.etap !== "gotowe" && f.etap !== "pominięta" && f.etap !== "czeka na potwierdzenie NIP" && f.etap !== "śledztwo w czatach" && f.etap !== "brak numeru NIP").length;
  // Do przystanku na NIP idzie tylko krok 1 i 2 (ok. 1,5 min na firmę); pełny przebieg to ok. 3,5 min.
  const minutNaFirme = reczna ? 0.2 : partia.przystanekNip ? 1.5 : 3.5;
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

// ---------- ścieżka pracy nad partią (pasek kroków na górze panelu) ----------
// Stan każdego kroku liczymy z samej partii: nic dodatkowego nie jest zapisywane.
const KROKI = [
  { id: "lista", nazwa: "Lista firm i NIP-y", ekran: "nowa" },
  { id: "nip", nazwa: "Sprawdzenie NIP-ów", ekran: "nip" },
  { id: "rejestry", nazwa: "Rejestry", ekran: "praca" },
  { id: "czaty", nazwa: "Śledztwo w czatach", ekran: "czaty" },
  { id: "porownanie", nazwa: "Rozstrzygnięcie", ekran: "rozstrzygniecie" },
  { id: "przeglad", nazwa: "Przegląd", ekran: "przeglad" },
  { id: "import", nazwa: "Import", ekran: "import" },
  { id: "logo", nazwa: "Logotypy", ekran: "logo" },
];

function sciezkaPartii(nazwa) {
  if (!nazwa || !fs.existsSync(plikPartii(nazwa))) return { blad: "Nie wybrano partii." };
  const partia = wczytajPartie(plikPartii(nazwa));
  const akt = partia.firmy.filter((f) => !f.pomin);
  const n = akt.length;
  const ile = (war) => akt.filter(war).length;
  const trwa = !!zadanieDlaPartii(nazwa);
  const nipOk = ile((f) => f.tozsamosc && f.etapy?.sledztwo !== "czeka na potwierdzenie NIP");
  const rejOk = ile((f) => f.rejestr || f.sledztwo);
  const zOdp = ile((f) => f.sledztwo || Object.keys(f.sledztwaReczne || {}).length);
  const przyjete = ile((f) => f.sledztwo);
  const zRekordem = akt.filter((f) => f.rekord);
  const bezDecyzji = zRekordem.filter((f) => !f.decyzja).length;
  const zatw = zRekordem.filter((f) => f.decyzja === "zatwierdzony").length;
  const zaimp = zRekordem.filter((f) => f.decyzja === "zaimportowany").length;
  const stany = {
    lista: { gotowe: partia.firmy.length > 0, info: `${partia.firmy.length} firm${partia.firmy.length - n ? `, ${partia.firmy.length - n} pominiętych` : ""}`, teraz: "Dodaj firmy do partii." },
    nip: { gotowe: n > 0 && nipOk === n, info: `${nipOk} z ${n}`, teraz: trwa ? "Program sprawdza numery w Białej Liście MF i KRS. Poczekaj chwilę." : "Przy każdej firmie potwierdź numer, wymień go albo pomiń firmę. Potem „Numery potwierdzone: dalej do czatów”." },
    rejestry: { gotowe: n > 0 && rejOk === n && !trwa, info: trwa ? "trwa" : `${rejOk} z ${n}`, teraz: trwa ? "Program pobiera dane z KRS i CRBR. Poczekaj, aż skończy (bez modeli, za darmo)." : "Wróć do kroku 2 i kliknij „Numery potwierdzone: dalej do czatów”: program pobierze brakujące dane z rejestrów." },
    czaty: { gotowe: n > 0 && zOdp === n, info: `${zOdp} z ${n} z odpowiedzią`, teraz: "Skopiuj prompt zbiorczy, wklej go do kilku czatów (np. Gemini, ChatGPT, Grok, Perplexity) i wklej każdą odpowiedź z powrotem." },
    porownanie: { gotowe: n > 0 && przyjete === n, info: `${przyjete} z ${n} przyjętych`, teraz: "Utwórz pliki do rozstrzygnięcia, daj je Claude'owi (Claude Code albo Claude.ai) i wczytaj jego wyniki." },
    przeglad: { gotowe: zRekordem.length > 0 && bezDecyzji === 0, info: `${zRekordem.length - bezDecyzji} z ${zRekordem.length} z decyzją`, teraz: "Obejrzyj rekordy i zatwierdź albo odrzuć każdą firmę." },
    import: { gotowe: zaimp > 0 && zatw === 0, info: `${zaimp} w bazie${zatw ? `, ${zatw} czeka` : ""}`, teraz: "Pokaż plan importu, sprawdź go i zapisz zatwierdzone firmy do bazy." },
    logo: { gotowe: false, info: "", teraz: "Pobierz logotypy nowych firm i wyślij je na stronę." },
  };
  const kroki = KROKI.map((k) => ({ ...k, ...stany[k.id] }));
  const biezacy = kroki.find((k) => !k.gotowe) || kroki[kroki.length - 1];
  return { nazwa, sciezka: partia.sciezka || "automat", kroki, biezacy: biezacy.id };
}

// Przejście na ścieżkę ręczną: stare błędy limitu i "czeka na potwierdzenie NIP" znikają,
// firmy czekają na odpowiedzi z czatów. Kopia pliku przed pierwszą zmianą (poza listą partii).
function przejdzNaReczna(sciezka, partia) {
  const kopia = path.join(KATALOG_PARTII, `kopia-przed-czatami-${path.basename(sciezka)}`);
  if (!fs.existsSync(kopia)) fs.copyFileSync(sciezka, kopia);
  partia.sciezka = "reczna";
  partia.nipPotwierdzone = true;
  partia.przystanekNip = false;
  let wyczyszczone = 0;
  for (const f of partia.firmy) {
    const przed = (f.bledy || []).length;
    f.bledy = (f.bledy || []).filter((b) => !/spend limit|usage limit|monthly|hit your|^śledztwo:|^kontrola:|^opisy:/i.test(b));
    wyczyszczone += przed - f.bledy.length;
    if (f.pomin || f.sledztwo) continue;
    f.etapy = f.etapy || {};
    if (!f.etapy.sledztwo || /^błąd|czeka na potwierdzenie NIP|^czeka$/.test(f.etapy.sledztwo)) f.etapy.sledztwo = "czeka na czaty";
  }
  return wyczyszczone;
}

// ---------- rozstrzygnięcie w Claude: folder z plikami ----------
const folderRozstrzygniecia = (nazwa) => path.join(KATALOG_REPO, "data", "robocze", "rozstrzygniecie", String(nazwa).replace(/[^\w\-.]/g, "-"));

function stanRozstrzygniecia(nazwa, partia) {
  const folder = folderRozstrzygniecia(nazwa);
  const pliki = fs.existsSync(folder) ? fs.readdirSync(folder) : [];
  const czesci = pliki.filter((x) => /^czesc-\d+\.md$/i.test(x)).sort().map((x) => {
    const nr = x.match(/\d+/)[0];
    const wynik = pliki.find((y) => new RegExp(`^wynik-${nr}\\.(json|md|txt)$`, "i").test(y));
    const tekst = fs.readFileSync(path.join(folder, x), "utf8");
    return { plik: x, nr, znakow: tekst.length, firm: (tekst.match(/^## \d+\. /gm) || []).length, wynik: wynik || null };
  });
  const aktywne = partia.firmy.filter((f) => !f.pomin && f.tozsamosc);
  const modele = {};
  for (const f of aktywne) for (const m of Object.keys(f.sledztwaReczne || {})) if (m !== ROZSTRZYGNIECIE) modele[m] = (modele[m] || 0) + 1;
  return {
    nazwa,
    folder,
    folderIstnieje: fs.existsSync(folder),
    czesci,
    modele,
    firm: aktywne.length,
    zOdpowiedzia: firmyDoRozstrzygniecia(partia, "wszystkie").length,
    doRozstrzygniecia: firmyDoRozstrzygniecia(partia, "nierozstrzygniete").length,
    rozstrzygniete: aktywne.filter((f) => f.sledztwaReczne?.[ROZSTRZYGNIECIE]).length,
    przyjete: aktywne.filter((f) => f.sledztwo).length,
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
        spolkaPodana: f.spolkaPodana || t.spolkaPodana || null,
        vat: t.mf?.statusVat || null,
        // "czeka": numer wpisany ręcznie albo wczytany z Gemini, jeszcze niesprawdzony w rejestrach
        wynik: !f.tozsamosc && f.nipPodany ? "czeka" : !t.nip ? "brak" : problem ? "zle" : uwaga || f.uwagiTozsamosci ? "uwaga" : "ok",
        powod: problem || f.uwagiTozsamosci || null,
        wBazie: t.istniejeWBazie ? { slug: t.istniejeWBazie.slug, kraj: t.istniejeWBazie.country_code, wlasciciel: t.istniejeWBazie.owner_name } : null,
        tenSamNipCo: (wgNipu.get(t.nip || f.nipPodany) || []).filter((n) => n !== f.nazwa),
        blad: f.pomin || f.tozsamosc || !f.bledy?.length ? null
          : /claude|gemini|authenticat|limit|model|OAuth|tożsamość:/i.test(f.bledy[0]) ? "wcześniejsze szukanie numeru automatem nie powiodło się; wklej numer z czatu"
          : opiszBlad(f.bledy[0]),
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

// ---------- logotypy: format po bajtach, podgląd, podmiana ----------
const KATALOG_LOGO = path.join(KATALOG_REPO, "public", "logos");
function formatPliku(b) {
  if (!b || b.length < 12) return "inny";
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return "png";
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return "ico";
  const t = b.toString("utf8", 0, Math.min(b.length, 8192));
  return /<svg/i.test(t) && !/^\s*(<!doctype html|<html)/i.test(t) ? "svg" : "inny";
}
function naglowekPliku(sciezka, ile = 8192) {
  const fd = fs.openSync(sciezka, "r");
  try { const b = Buffer.alloc(ile); return b.subarray(0, fs.readSync(fd, b, 0, ile, 0)); } finally { fs.closeSync(fd); }
}
let sharpModul;
async function wymiary(sciezka, format, bufor) {
  if (format === "ico") return { szer: bufor[6] || 256, wys: bufor[7] || 256 };
  try {
    sharpModul = sharpModul || createRequire(path.join(KATALOG_REPO, "package.json"))("sharp");
    const m = await sharpModul(sciezka).metadata();
    return { szer: m.width || null, wys: m.height || null };
  } catch { return { szer: null, wys: null }; }
}
async function opisLogo(domena) {
  const pliki = fs.existsSync(KATALOG_LOGO) ? fs.readdirSync(KATALOG_LOGO).filter((x) => x.toLowerCase().startsWith(domena + ".") && /\.(png|jpe?g|webp|svg|ico)$/i.test(x) && x.slice(domena.length + 1).split(".").length === 1) : [];
  if (!pliki.length) return { plik: null, rodzaj: "brak" };
  const plik = pliki[0], sciezka = path.join(KATALOG_LOGO, plik);
  const b = naglowekPliku(sciezka), format = formatPliku(b), roz = path.extname(plik).slice(1).toLowerCase().replace("jpeg", "jpg");
  const { szer, wys } = await wymiary(sciezka, format, b);
  const rodzaj = format === "ico" || format === "inny" ? "ikonka" : format !== roz ? "rozszerzenie" : szer && Math.max(szer, wys || 0) < 100 && format !== "svg" ? "male" : "ok";
  return { plik, format, szer, wys, bajtow: fs.statSync(sciezka).size, rodzaj, zmieniono: fs.statSync(sciezka).mtimeMs };
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
  // Podejrzane: plik nie jest tym, na co wskazuje rozszerzenie (np. ikonka .ico zapisana jako .png
  // albo strona błędu HTML). Takie "logo" wygląda na stronie źle i trzeba je podmienić.
  const podejrzane = [];
  for (const p of pliki) {
    const roz = path.extname(p).slice(1).toLowerCase().replace("jpeg", "jpg");
    let format;
    try { format = formatPliku(naglowekPliku(path.join(katalog, p))); } catch { continue; }
    // ico = ikonka strony zamiast logo (słaba jakość, do wymiany); inny = nie obrazek;
    // jpg/webp z końcówką .png wyświetla się dobrze, tylko nazwa pliku się nie zgadza
    if (format !== roz) podejrzane.push({ plik: p, format, rodzaj: format === "ico" ? "ikonka" : format === "inny" ? "nie-obrazek" : "rozszerzenie" });
  }
  return { plikow: pliki.length, brakujacych: brakujace.length, brakujace: brakujace.slice(0, 40), bezUrl: indeks.filter((f) => !domenaZUrl(f.website_url)).length, podejrzane };
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
// ---------- wersja kodu (pasek "jest nowsza wersja panelu") ----------
// Serwer wczytuje panel.mjs i lib/*.mjs tylko przy starcie: po ich zmianie trzeba go uruchomić
// ponownie. Strony (panel.html, przeglad.html) czytane są z dysku przy każdym wejściu: wystarczy F5.
function podpisPlikow(pliki) {
  let max = 0;
  for (const x of pliki) { try { max = Math.max(max, fs.statSync(x).mtimeMs); } catch { /* brak pliku */ } }
  return Math.round(max);
}
const plikiSerwera = () => [path.join(KATALOG, "panel.mjs"), ...fs.readdirSync(path.join(KATALOG, "lib")).filter((x) => x.endsWith(".mjs")).map((x) => path.join(KATALOG, "lib", x))];
const plikiStron = () => [path.join(KATALOG, "panel.html"), path.join(KATALOG, "przeglad.html")];
const SERWER_START = podpisPlikow(plikiSerwera());

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
  // Lista modeli Gemini nic nie kosztuje; przy okazji sprawdza, czy klucz w ogóle działa.
  const gm = stanLogowaniaGemini();
  let gModel = null;
  if (gm.zalogowany) {
    try {
      gModel = await wybierzModelGemini();
    } catch (e) {
      gm.zalogowany = false;
      gm.powod = e.message;
    }
  }
  return {
    claude: { ok: !!lg.zalogowany, metoda: lg.metoda || null, powod: lg.powod || null },
    gemini: { ok: gm.zalogowany, model: gModel, metoda: gm.metoda || null, powod: gm.powod || null, maKlucz: !!wczytajEnv().GEMINI_API_KEY },
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
      if (dane.reczna && dane.kategoria) return json(res, { blad: "Propozycje firm z kategorii robi model. W ścieżce bez modeli wpisz listę firm." }, 400);
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
      // Ścieżka ręczna (domyślna): numery z czatu sprawdzają tylko rejestry (MF, KRS, CRBR), zero modeli.
      if (dane.reczna) {
        argumenty.push("--tylko-rejestry", "--crbr", "--sciezka", "reczna");
        const z = zadanieProcesu({ typ: "automat", opis: `Sprawdzenie NIP-ów (${nazwa})`, plik: argumenty[0], argumenty: argumenty.slice(1), partia: nazwa });
        return json(res, { ok: true, partia: nazwa, zadanie: z.id });
      }
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
      if (dane.tylkoRejestry) {
        // "Sprawdź ponownie" na przystanku: wpisane numery sprawdzają MF i KRS, bez modelu.
        const z = zadanieProcesu({ typ: "automat", opis: `Sprawdzenie NIP-ów (${nazwa})`, plik: path.join(KATALOG, "automat.mjs"), argumenty: [...argumenty, "--tylko-rejestry", "--crbr"], partia: nazwa });
        return json(res, { ok: true, partia: nazwa, zadanie: z.id });
      }
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
      const { partia: nazwa, zmiany, ponow, zapiszNumery, reczna } = await cialo();
      const sciezka = plikPartii(nazwa);
      const partia = wczytajPartie(sciezka);
      const doSprawdzeniaNazwy = [];
      const czekaNaNumer = [];
      const wyczyscTozsamosc = (f) => {
        delete f.tozsamosc;
        delete f.rejestr;
        delete f.historiaKrs;
        delete f.crbr;
        f.etapy = {};
        f.bledy = [];
      };

      // Numery wczytane z Gemini zapisujemy od razu do partii, żeby odświeżenie tabeli ich nie
      // zgubiło. Sprawdzą je rejestry przy "Sprawdź ponownie". Ten sam numer, który rejestry już
      // odrzuciły (np. spółka wykreślona), odsyłamy z powrotem jako ostrzeżenie.
      if (zapiszNumery) {
        const zapisane = [];
        const takieSame = [];
        for (const zm of zmiany || []) {
          const f = partia.firmy.find((x) => x.nazwa === zm.nazwa);
          const nowy = normalizujNip(zm.nip || "");
          if (!f || nowy.length !== 10) continue;
          const stary = normalizujNip(f.tozsamosc?.nip || f.nipPodany || "");
          if (nowy === stary) {
            if (f.tozsamosc?.status === "KONFLIKT") takieSame.push({ nazwa: f.nazwa, powod: f.tozsamosc.powod });
            continue;
          }
          wyczyscTozsamosc(f);
          f.nipPodany = nowy;
          if (zm.spolka) f.spolkaPodana = String(zm.spolka).trim(); else delete f.spolkaPodana;
          f.pomin = false;
          delete f.szukajDokladnie;
          zapisane.push(f.nazwa);
        }
        zapiszPartie(sciezka, partia);
        return json(res, { ok: true, zapisane, takieSame });
      }

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
            delete f.spolkaPodana; // spółka z czatu dotyczyła poprzedniego numeru
            delete f.szukajDokladnie;
          }
        } else if (!f.tozsamosc && f.nipPodany && decyzja !== "szukaj") {
          // numer już zapisany (ręcznie albo z Gemini), czeka tylko na sprawdzenie w rejestrach
          doSprawdzeniaNazwy.push(f.nazwa);
        } else if (reczna && (decyzja === "szukaj" || !f.tozsamosc)) {
          // Ścieżka ręczna: numer do wymiany albo brak numeru. Nikt go nie szuka automatem,
          // czeka na numer z czatu (blok Gemini) albo na "Pomiń firmę".
          czekaNaNumer.push(f.nazwa);
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
      return json(res, { ok: true, doSprawdzenia: doSprawdzeniaNazwy.length, nazwy: doSprawdzeniaNazwy, czekaNaNumer });
    }

    // ---------- ścieżka ręczna: śledztwo w czatach ----------
    if (req.method === "GET" && p === "/api/panel/sciezka") return json(res, sciezkaPartii(url.searchParams.get("partia")));

    // "Sprawdzaj dalej" z przystanku: porządki w partii i same rejestry (KRS, historia, CRBR, giełda).
    // Żadnego modelu: automat z --tylko-rejestry nie wymaga logowania Claude.
    if (req.method === "POST" && p === "/api/panel/reczna") {
      const { partia: nazwa } = await cialo();
      if (zadanieAutomatuTrwa()) return json(res, { blad: "Automat już pracuje." }, 409);
      const sciezka = plikPartii(nazwa);
      if (!fs.existsSync(sciezka)) return json(res, { blad: "Nie ma takiej partii." }, 404);
      const partia = wczytajPartie(sciezka);
      const wyczyszczone = przejdzNaReczna(sciezka, partia);
      zapiszPartie(sciezka, partia);
      const potrzebaRejestrow = partia.firmy.some((f) => !f.pomin && f.tozsamosc && !f.sledztwo && (!f.rejestr || !f.crbr));
      if (!potrzebaRejestrow) return json(res, { ok: true, wyczyszczone, zadanie: null });
      const z = zadanieProcesu({ typ: "automat", opis: `Rejestry (${nazwa})`, plik: path.join(KATALOG, "automat.mjs"), argumenty: ["--partia", nazwa, "--tylko-rejestry", "--crbr"], partia: nazwa });
      return json(res, { ok: true, wyczyszczone, zadanie: z.id });
    }

    if (req.method === "GET" && p === "/api/panel/czaty") {
      const nazwa = url.searchParams.get("partia");
      if (!nazwa || !fs.existsSync(plikPartii(nazwa))) return json(res, { blad: "Nie wybrano partii." });
      const partia = wczytajPartie(plikPartii(nazwa));
      const firmy = partia.firmy.filter((f) => !f.pomin && f.tozsamosc).map((f) => {
        const por = porownanie(f);
        return {
          nazwa: f.nazwa,
          nip: f.tozsamosc?.nip || null,
          spolka: (f.rejestr && !f.rejestr.blad && f.rejestr.nazwa) || f.tozsamosc?.mf?.nazwa || f.tozsamosc?.nazwa_spolki || null,
          krs: f.tozsamosc?.krs || null,
          maRejestr: !!(f.rejestr && !f.rejestr.blad),
          uwagiTozsamosci: f.uwagiTozsamosci || null,
          wBazie: f.tozsamosc?.istniejeWBazie ? { slug: f.tozsamosc.istniejeWBazie.slug, kraj: f.tozsamosc.istniejeWBazie.country_code, wlasciciel: f.tozsamosc.istniejeWBazie.owner_name } : null,
          odpowiedzi: por.modele.map((m) => ({ model: m.model, kiedy: m.kiedy, sledztwo: m.sledztwo, opisy: m.opisy, zgodneZ: por.wiersze.find((w) => w.model === m.model)?.zgodneZ || [] })),
          stan: por.stan,
          przyjeta: f.przyjetaWersja?.model || (f.sledztwo ? "automat" : null),
          status: f.status || null,
          konflikty: f.konflikty || [],
          decyzja: f.decyzja || null,
        };
      });
      const bezNip = partia.firmy.filter((f) => !f.pomin && !f.tozsamosc).map((f) => f.nazwa);
      return json(res, { nazwa, sciezka: partia.sciezka || "automat", firmy, bezNip });
    }

    // Prompt zbiorczy: wybrane firmy (lista nazw z panelu) w jednej paczce; bez limitu liczby.
    if (req.method === "POST" && p === "/api/panel/prompt-zbiorczy") {
      const { partia: nazwa, nazwy } = await cialo();
      const partia = wczytajPartie(plikPartii(nazwa));
      const firmy = (nazwy || []).map((n) => partia.firmy.find((f) => f.nazwa === n)).filter((f) => f && f.tozsamosc);
      if (!firmy.length) return json(res, { blad: "Brak firm do promptu." }, 400);
      return json(res, { tekst: promptZbiorczy(firmy, { kategorie, dzisiaj: dzisiaj() }), firm: firmy.length });
    }

    if (req.method === "POST" && p === "/api/panel/czaty-wklej") {
      const { partia: nazwa, model, tekst, nadpisz } = await cialo();
      const m = String(model || "").trim();
      if (!m) return json(res, { blad: "Wybierz, który to model." }, 400);
      if (!String(tekst || "").trim()) return json(res, { blad: "Najpierw wklej odpowiedź." }, 400);
      const sciezka = plikPartii(nazwa);
      const partia = wczytajPartie(sciezka);
      // Ochrona przed wklejeniem pod złą nazwą czatu: gdy ten czat ma już odpowiedź dla którejś
      // z tych firm, najpierw pytamy (kontynuacja uciętej odpowiedzi dotyczy innych firm, więc nie pyta).
      if (!nadpisz) {
        const { wynik } = dopasuj(parsujOdpowiedz(tekst), partia.firmy.filter((f) => !f.pomin && f.tozsamosc));
        const juzSa = wynik.filter(({ firma }) => firma.sledztwaReczne?.[m]).map(({ firma }) => firma.nazwa);
        if (juzSa.length) return json(res, { potwierdz: true, juzSa });
      }
      const w = zapiszOdpowiedz(partia, m, tekst);
      if (!w.obiektow) return json(res, { blad: "Nie znalazłem w odpowiedzi żadnego obiektu JSON. Poproś model: „Podaj wynik jako jeden blok ```json z tablicą”." }, 400);
      zapiszPartie(sciezka, partia);
      return json(res, { ok: true, ...w });
    }

    if (req.method === "POST" && p === "/api/panel/czaty-usun") {
      const { partia: nazwa, model, firma } = await cialo();
      const sciezka = plikPartii(nazwa);
      const partia = wczytajPartie(sciezka);
      let n = 0;
      for (const f of partia.firmy) {
        if (firma && f.nazwa !== firma) continue;
        if (f.sledztwaReczne?.[model]) { delete f.sledztwaReczne[model]; n++; }
      }
      zapiszPartie(sciezka, partia);
      return json(res, { ok: true, usuniete: n });
    }

    // Przyjęcie wersji: jedna firma ({firma, model}) albo wszystkie zgodne naraz ({zgodne: true, model}).
    if (req.method === "POST" && p === "/api/panel/przyjmij") {
      const { partia: nazwa, firma, model, zgodne } = await cialo();
      const sciezka = plikPartii(nazwa);
      const partia = wczytajPartie(sciezka);
      const przyjete = [], bledy = [];
      const cele = zgodne
        ? partia.firmy.filter((f) => !f.pomin && !f.sledztwo && porownanie(f).stan === "zgodne")
        : partia.firmy.filter((f) => f.nazwa === firma);
      for (const f of cele) {
        const wersje = Object.keys(f.sledztwaReczne || {});
        const m = wersje.includes(model) ? model : zgodne ? wersje[0] : null;
        if (!m) { bledy.push(`${f.nazwa}: brak odpowiedzi modelu ${model}`); continue; }
        try { przyjmijWersje(f, m, { kategorie, dzisiaj: dzisiaj() }); przyjete.push(f.nazwa); } catch (e) { bledy.push(`${f.nazwa}: ${e.message}`); }
      }
      zapiszPartie(sciezka, partia);
      return json(res, { ok: true, przyjete, bledy });
    }

    if (req.method === "POST" && p === "/api/panel/cofnij-wersje") {
      const { partia: nazwa, firma } = await cialo();
      const sciezka = plikPartii(nazwa);
      const partia = wczytajPartie(sciezka);
      const f = partia.firmy.find((x) => x.nazwa === firma);
      if (!f) return json(res, { blad: "Nie ma takiej firmy." }, 404);
      if (f.decyzja === "zaimportowany") return json(res, { blad: "Firma jest już w bazie. Popraw ją w przeglądzie." }, 400);
      cofnijWersje(f);
      zapiszPartie(sciezka, partia);
      return json(res, { ok: true });
    }

    // ---------- rozstrzygnięcie w Claude: pliki na dysku ----------
    if (req.method === "GET" && p === "/api/panel/rozstrzygniecie") {
      const nazwa = url.searchParams.get("partia");
      if (!nazwa || !fs.existsSync(plikPartii(nazwa))) return json(res, { blad: "Nie wybrano partii." });
      return json(res, stanRozstrzygniecia(nazwa, wczytajPartie(plikPartii(nazwa))));
    }

    if (req.method === "POST" && p === "/api/panel/rozstrzygniecie-pliki") {
      const { partia: nazwa, rozmiar, zakres } = await cialo();
      const partia = wczytajPartie(plikPartii(nazwa));
      const czesci = czesciRozstrzygniecia(partia, { rozmiar, zakres });
      if (!czesci.length) return json(res, { blad: "Brak firm do rozstrzygnięcia w tym zakresie. Najpierw wklej odpowiedzi czatów w kroku 4." }, 400);
      const folder = folderRozstrzygniecia(nazwa);
      fs.mkdirSync(folder, { recursive: true });
      // Stare części usuwamy (numeracja mogła się zmienić). Wyniki zostają w podfolderze "stare",
      // żeby nie wczytać ich omyłkowo do nowego podziału.
      const stare = fs.readdirSync(folder).filter((x) => /^(czesc|wynik)-\d+\.(md|json|txt)$/i.test(x));
      if (stare.some((x) => x.startsWith("wynik"))) fs.mkdirSync(path.join(folder, "stare"), { recursive: true });
      for (const x of stare) {
        if (x.startsWith("wynik")) fs.renameSync(path.join(folder, x), path.join(folder, "stare", `${Date.now()}-${x}`));
        else fs.unlinkSync(path.join(folder, x));
      }
      fs.writeFileSync(path.join(folder, "00-instrukcja.md"), instrukcjaRozstrzygniecia({ kategorie, dzisiaj: dzisiaj(), nazwaPartii: nazwa, czesci, folder }), "utf8");
      for (const c of czesci) fs.writeFileSync(path.join(folder, c.plik), c.tekst, "utf8");
      return json(res, { ok: true, ...stanRozstrzygniecia(nazwa, partia) });
    }

    if (req.method === "POST" && p === "/api/panel/otworz-folder") {
      const { partia: nazwa } = await cialo();
      const folder = folderRozstrzygniecia(nazwa);
      if (!fs.existsSync(folder)) return json(res, { blad: "Folder jeszcze nie istnieje. Najpierw utwórz pliki." }, 404);
      if (process.platform === "win32") spawn("explorer.exe", [folder], { detached: true, stdio: "ignore" }).unref();
      return json(res, { ok: true, folder });
    }

    // Wyniki: z plików wynik-*.json w folderze albo z wklejonego tekstu. Każdy dopasowany wynik
    // jest zapisywany jako wersja "Rozstrzygnięcie" i od razu przyjmowany (rekord do przeglądu).
    if (req.method === "POST" && p === "/api/panel/rozstrzygniecie-wczytaj") {
      const { partia: nazwa, tekst } = await cialo();
      const sciezka = plikPartii(nazwa);
      const partia = wczytajPartie(sciezka);
      const zrodla = [];
      if (String(tekst || "").trim()) zrodla.push({ plik: "wklejony tekst", tekst });
      else {
        const folder = folderRozstrzygniecia(nazwa);
        const pliki = fs.existsSync(folder) ? fs.readdirSync(folder).filter((x) => /^wynik-\d+\.(json|md|txt)$/i.test(x)).sort() : [];
        for (const x of pliki) zrodla.push({ plik: x, tekst: fs.readFileSync(path.join(folder, x), "utf8") });
      }
      if (!zrodla.length) return json(res, { blad: "Nie ma jeszcze żadnego pliku wynik-NN.json w folderze." }, 400);
      const pliki = [], przyjete = new Set(), bledy = [];
      for (const z of zrodla) {
        const w = zapiszOdpowiedz(partia, ROZSTRZYGNIECIE, z.tekst);
        pliki.push({ plik: z.plik, obiektow: w.obiektow, dopasowane: w.dopasowane.length, niedopasowane: w.niedopasowane });
        for (const n of w.dopasowane) {
          const f = partia.firmy.find((x) => x.nazwa === n);
          if (f.decyzja === "zaimportowany") { bledy.push(`${n}: już w bazie, rozstrzygnięcie zapisane, ale nie przyjęte (popraw w przeglądzie)`); continue; }
          try { przyjmijWersje(f, ROZSTRZYGNIECIE, { kategorie, dzisiaj: dzisiaj() }); przyjete.add(n); } catch (e) { bledy.push(`${n}: ${e.message}`); }
        }
      }
      zapiszPartie(sciezka, partia);
      return json(res, { ok: true, pliki, przyjete: [...przyjete], bledy });
    }

    if (req.method === "GET" && p === "/api/panel/import-plan") {
      const nazwa = url.searchParams.get("partia");
      const partia = wczytajPartie(plikPartii(nazwa));
      const ctx = await kontekstImportu();
      const plan = zbudujPlan(partia, ctx);
      return json(res, {
        partia: nazwa,
        brakKolumn: [!ctx.maSources && "sources", !ctx.maConfidence && "confidence"].filter(Boolean),
        // firmy z rekordem bez decyzji w przeglądzie: import ich nie weźmie, dopóki nie zatwierdzisz
        czekaWPrzegladzie: partia.firmy.filter((f) => !f.pomin && f.rekord && !f.decyzja).map((f) => f.nazwa),
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
    // Podgląd logotypów: firmy z partii (albo podejrzane pliki z całej bazy) z opisem pliku.
    if (req.method === "GET" && p === "/api/panel/logo-podglad") {
      const zakres = url.searchParams.get("zakres") || "partia";
      let pozycje = [];
      if (zakres === "podejrzane") {
        for (const x of stanLogotypow().podejrzane) {
          const domena = x.plik.replace(/\.[a-z]+$/i, "");
          const f = indeks.find((r) => domenaZUrl(r.website_url) === domena);
          pozycje.push({ nazwa: f?.display_name || f?.name || domena, slug: f?.slug || null, domena, www: f?.website_url || `https://${domena}` });
        }
      } else {
        const nazwa = url.searchParams.get("partia");
        if (!nazwa || !fs.existsSync(plikPartii(nazwa))) return json(res, { blad: "Nie wybrano partii." });
        const partia = wczytajPartie(plikPartii(nazwa));
        for (const f of partia.firmy.filter((x) => !x.pomin && x.rekord)) {
          const domena = domenaZUrl(f.rekord.website_url);
          pozycje.push({ nazwa: f.rekord.display_name || f.nazwa, slug: f.rekord.slug, domena, www: f.rekord.website_url, wBazie: f.decyzja === "zaimportowany" });
        }
      }
      for (const x of pozycje) Object.assign(x, x.domena ? await opisLogo(x.domena) : { plik: null, rodzaj: "bez-strony" });
      return json(res, { pozycje });
    }

    // Plik logo do podglądu (tylko z public/logos, bez wychodzenia poza folder).
    if (req.method === "GET" && p.startsWith("/logo-plik/")) {
      const nazwaPliku = decodeURIComponent(p.slice("/logo-plik/".length));
      if (!/^[\w.-]+$/.test(nazwaPliku)) { res.writeHead(400); return res.end(); }
      const sciezka = path.join(KATALOG_LOGO, nazwaPliku);
      if (!fs.existsSync(sciezka)) { res.writeHead(404); return res.end(); }
      const typ = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml", ico: "image/x-icon" }[formatPliku(naglowekPliku(sciezka))] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": typ, "Cache-Control": "no-store" });
      return res.end(fs.readFileSync(sciezka));
    }

    // Podmiana logo z podglądu: plik z komputera (base64). Format sprawdzany po bajtach,
    // ikonki .ico i SVG ze skryptami odrzucane, stare pliki tej domeny usuwane.
    if (req.method === "POST" && p === "/api/panel/logo-podmien") {
      const { domena, dane } = await cialo();
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(String(domena || ""))) return json(res, { blad: "Zła domena." }, 400);
      const bufor = Buffer.from(String(dane || ""), "base64");
      if (bufor.length > 5 * 1024 * 1024) return json(res, { blad: "Plik większy niż 5 MB." }, 400);
      const format = formatPliku(bufor);
      if (format === "ico") return json(res, { blad: "To ikonka strony (.ico), a nie logo. Wybierz plik PNG, JPG, WebP albo SVG." }, 400);
      if (!["png", "jpg", "webp", "svg"].includes(format)) return json(res, { blad: "To nie jest obrazek PNG, JPG, WebP ani SVG." }, 400);
      if (format === "svg" && /<script|\bon[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object/i.test(bufor.toString("utf8"))) return json(res, { blad: "SVG zawiera skrypty lub aktywne elementy." }, 400);
      for (const x of fs.readdirSync(KATALOG_LOGO)) if (x.toLowerCase().startsWith(domena.toLowerCase() + ".") && x.slice(domena.length + 1).split(".").length === 1) fs.unlinkSync(path.join(KATALOG_LOGO, x));
      fs.writeFileSync(path.join(KATALOG_LOGO, `${domena.toLowerCase()}.${format}`), bufor);
      return json(res, { ok: true, ...(await opisLogo(domena.toLowerCase())) });
    }

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

    // Logowanie Claude (automatu) jest interaktywne: otwieramy okno z "claude auth login",
    // które samo otwiera przeglądarkę. Użytkownik klika zgodę na swoim koncie.
    if (req.method === "POST" && p === "/api/panel/zaloguj-claude") {
      const cmdClaude = process.env.APPDATA && fs.existsSync(path.join(process.env.APPDATA, "npm", "claude.cmd")) ? path.join(process.env.APPDATA, "npm", "claude.cmd") : "claude";
      if (process.platform === "win32") {
        spawn("cmd", ["/c", "start", "Logowanie Claude", "cmd", "/k", cmdClaude, "auth", "login"], { detached: true, stdio: "ignore", windowsHide: false }).unref();
      }
      return json(res, { ok: true });
    }

    if (req.method === "POST" && p === "/api/panel/odswiez-baze") {
      await odswiezBaze();
      return json(res, { ok: !bazaBlad, firm: indeks.length, blad: bazaBlad });
    }

    if (req.method === "GET" && p === "/api/panel/wersja") {
      return json(res, { serwerStart: SERWER_START, serwerTeraz: podpisPlikow(plikiSerwera()), strony: podpisPlikow(plikiStron()) });
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
