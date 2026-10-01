// Centrum projektu: ekran startowy panelu. Rytm (co i kiedy zrobić), stan projektu liczony
// z gita, GitHuba (gh), bloga, kolejki GSC i backupu oraz karty procesów z docs/PROCESY.md.
// Definicje: data/panel/rytm.json (w gicie). Odhaczenia: data/panel/stan.json (lokalne).
import { execFile, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { KATALOG_REPO } from "./env.mjs";

const KATALOG_PANELU = path.join(KATALOG_REPO, "data", "panel");
const PLIK_RYTMU = path.join(KATALOG_PANELU, "rytm.json");
const PLIK_STANU = path.join(KATALOG_PANELU, "stan.json");
const PLIK_PROCESOW = path.join(KATALOG_REPO, "docs", "PROCESY.md");
const PLIK_SEO = path.join(KATALOG_REPO, "docs", "seo-kolejka-indeksacji.md");
const PLIK_DZIENNIKA = path.join(KATALOG_PANELU, "dziennik.json");
const PLIK_METRYK = path.join(KATALOG_PANELU, "metryki.json");
const KATALOG_BLOGA = path.join(KATALOG_REPO, "content", "blog");
const WORKFLOW_TRESCI = "codzienna-tresc.yml";

// ---------- daty (czas lokalny komputera, czyli polski) ----------
const dwa = (n) => String(n).padStart(2, "0");
export const dzienLokalny = (d = new Date()) => `${d.getFullYear()}-${dwa(d.getMonth() + 1)}-${dwa(d.getDate())}`;
const naDate = (s) => new Date(`${s}T12:00:00`);
const dodajDni = (s, n) => { const d = naDate(s); d.setDate(d.getDate() + n); return dzienLokalny(d); };
const roznicaDni = (a, b) => Math.round((naDate(a) - naDate(b)) / 86400000);
const maks = (...daty) => daty.filter(Boolean).sort().at(-1) || null;
// Odmiana po polsku: 1 paczka, 2-4 paczki, 5+ paczek (12-14 też "paczek").
export const odmiana = (n, [jeden, kilka, wiele]) => (n === 1 ? jeden : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? kilka : wiele);

// ---------- pliki ----------
function czytajJson(plik, domyslnie) {
  try { return JSON.parse(fs.readFileSync(plik, "utf8")); } catch { return domyslnie; }
}
const wczytajRytm = () => czytajJson(PLIK_RYTMU, { cykliczne: [], przypomnienia: [] });
function wczytajStan() {
  const s = czytajJson(PLIK_STANU, {});
  return { odhaczone: s.odhaczone || {}, zrobione: s.zrobione || {}, odlozone: s.odlozone || {} };
}
function zapiszStan(s) {
  fs.mkdirSync(KATALOG_PANELU, { recursive: true });
  fs.writeFileSync(PLIK_STANU, JSON.stringify(s, null, 2) + "\n", "utf8");
}

// ---------- git i GitHub ----------
function git(...a) {
  const r = spawnSync("git", a, { cwd: KATALOG_REPO, encoding: "utf8" });
  return r.status === 0 ? (r.stdout || "").trim() : null;
}
const uruchom = (plik, a, timeout = 20000) => new Promise((ok) => {
  execFile(plik, a, { cwd: KATALOG_REPO, encoding: "utf8", timeout, windowsHide: true }, (blad, stdout, stderr) =>
    ok(blad ? { blad: (stderr || blad.message || "").trim().split(/\r?\n/)[0] || "błąd" } : { wyjscie: stdout.trim() }));
});

function adresRepo() {
  const url = git("remote", "get-url", "origin") || "";
  const m = url.match(/github\.com[:/](.+?)(\.git)?$/);
  return m ? `https://github.com/${m[1]}` : null;
}

// Wyniki z GitHuba trzymamy kilka minut: gh to zapytanie przez sieć, a ekran odświeża się często.
let github = { kiedy: 0, dane: null, trwa: null };
async function pobierzGithub() {
  const [pr, run, fetch] = await Promise.all([
    uruchom("gh", ["pr", "list", "--state", "open", "--limit", "30", "--json", "number,title,url,createdAt,headRefName,isDraft"]),
    uruchom("gh", ["run", "list", "--workflow", WORKFLOW_TRESCI, "--limit", "1", "--json", "conclusion,status,createdAt,url"]),
    uruchom("git", ["fetch", "--quiet", "origin"], 30000),
  ]);
  const parsuj = (r) => { try { return r.wyjscie ? JSON.parse(r.wyjscie) : null; } catch { return null; } };
  github = {
    kiedy: Date.now(),
    trwa: null,
    dane: {
      pr: pr.blad ? null : parsuj(pr) || [],
      ostatniPrzebieg: run.blad ? null : (parsuj(run) || [])[0] || null,
      blad: pr.blad || run.blad || null,
      fetchBlad: fetch.blad || null,
    },
  };
  return github.dane;
}
export function odswiezGithub() {
  if (!github.trwa) github.trwa = pobierzGithub().catch((e) => { github.trwa = null; github.dane = { pr: null, ostatniPrzebieg: null, blad: e.message }; });
  return github.trwa;
}
async function daneGithub() {
  if (!github.dane) await odswiezGithub();
  else if (Date.now() - github.kiedy > 5 * 60000) odswiezGithub(); // w tle, ekran dostaje poprzednie dane
  return github.dane;
}

// ---------- stan: produkcja i komputer ----------
function stanGita() {
  const galaz = git("rev-parse", "--abbrev-ref", "HEAD");
  const zmiany = (git("status", "--porcelain") || "").split(/\r?\n/).filter(Boolean);
  const czekaNaMain = (git("log", "--format=%h|%ad|%s", "--date=short", "origin/main..origin/develop") || "").split(/\r?\n/).filter(Boolean)
    .map((l) => { const [hash, data, ...t] = l.split("|"); return { hash, data, tytul: t.join("|") }; });
  const niewypchniete = Number(git("rev-list", "--count", "origin/develop..develop") || 0);
  const ostatniMain = git("log", "-1", "--format=%cI", "origin/main");
  return {
    galaz,
    naDevelop: galaz === "develop",
    zmienionychPlikow: zmiany.length,
    czekaNaMain,
    niewypchniete,
    ostatniaPublikacja: ostatniMain ? dzienLokalny(new Date(ostatniMain)) : null,
  };
}

// ---------- blog ----------
function stanBloga(dzis) {
  if (!fs.existsSync(KATALOG_BLOGA)) return null;
  const naMain = new Set((git("ls-tree", "--name-only", "origin/main", "content/blog/") || "").split(/\r?\n/).map((p) => path.basename(p)));
  const wpisy = fs.readdirSync(KATALOG_BLOGA).filter((p) => p.endsWith(".md")).map((p) => {
    const tresc = fs.readFileSync(path.join(KATALOG_BLOGA, p), "utf8");
    const data = tresc.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1] || null;
    const tytul = tresc.match(/^title:\s*["']?(.*?)["']?\s*$/m)?.[1] || p;
    return { plik: p, data, tytul, naMain: naMain.has(p) };
  });
  const zaplanowane = wpisy.filter((w) => w.data && w.data > dzis).sort((a, b) => a.data.localeCompare(b.data));
  const opublikowane = wpisy.filter((w) => w.naMain && w.data && w.data <= dzis).sort((a, b) => b.data.localeCompare(a.data));
  return {
    wszystkich: wpisy.length,
    zaplanowane: zaplanowane.map(({ data, tytul, naMain: m }) => ({ data, tytul, naMain: m })),
    buforDo: zaplanowane.at(-1)?.data || null,
    ostatniNaProdukcji: opublikowane[0] ? { data: opublikowane[0].data, tytul: opublikowane[0].tytul } : null,
    tylkoNaDevelop: wpisy.filter((w) => !w.naMain).length,
  };
}

// ---------- kolejka GSC ----------
function stanSeo() {
  if (!fs.existsSync(PLIK_SEO)) return null;
  const t = fs.readFileSync(PLIK_SEO, "utf8");
  const zgloszone = (t.match(/^- \[x\]/gim) || []).length;
  const zostalo = (t.match(/^- \[ \]/gm) || []).length;
  const daty = [...t.matchAll(/zgłoszone (\d{4}-\d{2}-\d{2})/g), ...t.matchAll(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|/gm)].map((m) => m[1]);
  return { zgloszone, zostalo, ostatnio: maks(...daty) };
}

// ---------- rytm ----------
// Kiedy czynność była ostatnio zrobiona według danych (bez ręcznego odhaczania).
function autoOstatnio(zrodlo, k) {
  const { dzis, git: g, gh, seo, backup, partie } = k;
  switch (zrodlo) {
    case "pr-tresci": {
      if (!gh?.pr) return { ostatnio: null, info: "Nie udało się sprawdzić GitHuba." };
      const paczki = gh.pr.filter((p) => /^tresc\//.test(p.headRefName) || /^Paczka na/.test(p.title));
      if (!paczki.length) return { ostatnio: dzis, info: "Brak paczek do przejrzenia." };
      return { ostatnio: null, info: `${odmiana(paczki.length, ["Czeka", "Czekają", "Czeka"])} ${paczki.length} ${odmiana(paczki.length, ["paczka", "paczki", "paczek"])}: ${paczki.map((p) => `#${p.number}`).join(", ")}.`, link: paczki[0].url };
    }
    case "seo":
      if (!seo) return { ostatnio: null };
      if (!seo.zostalo) return { ostatnio: dzis, koniec: true, info: "Kolejka wyczerpana, resztę robi sitemapa." };
      return { ostatnio: seo.ostatnio, info: `Zostało ${seo.zostalo} firm w kolejce, zgłoszono ${seo.zgloszone}.` };
    case "partia": {
      const ost = maks(...partie.map((p) => p.utworzono && dzienLokalny(new Date(p.utworzono))));
      return { ostatnio: ost, info: ost ? `Ostatnia partia utworzona ${ost}.` : "Nie ma jeszcze żadnej partii." };
    }
    case "publikacja":
      if (!g.czekaNaMain.length) return { ostatnio: dzis, info: "Produkcja jest aktualna, nic nie czeka." };
      return { ostatnio: g.ostatniaPublikacja, info: `${g.czekaNaMain.length} ${odmiana(g.czekaNaMain.length, ["zmiana czeka", "zmiany czekają", "zmian czeka"])} na merge do main.` };
    case "metryki": {
      const ost = maks(...wczytajMetryki().miesiace.map((m) => m.zapisano));
      return { ostatnio: ost, info: ost ? `Ostatnio zapisane ${ost}.` : "Nie ma jeszcze zapisanych metryk." };
    }
    case "backup": {
      if (!backup) return { ostatnio: null, info: "Nie znaleziono żadnego backupu." };
      const d = dzienLokalny(new Date(backup.kiedy));
      return { ostatnio: d, info: `Ostatni backup ${d} (${backup.skad}${backup.firm ? `, ${backup.firm} firm` : ""}).` };
    }
    default:
      return { ostatnio: null };
  }
}

function pozycjaRytmu(r, stan, kontekst) {
  const { dzis } = kontekst;
  const auto = r.auto ? autoOstatnio(r.auto, kontekst) : { ostatnio: null };
  const reczne = stan.odhaczone[r.id] || null;
  const ostatnio = maks(auto.ostatnio, reczne);
  let termin;
  if (Number.isInteger(r.dzienTygodnia)) {
    // Ostatni taki dzień tygodnia (dziś włącznie); zrobione, jeśli po nim było zrobione.
    const cofnij = (naDate(dzis).getDay() - r.dzienTygodnia + 7) % 7;
    const ostatniDzien = dodajDni(dzis, -cofnij);
    termin = ostatnio && ostatnio >= ostatniDzien ? dodajDni(ostatniDzien, 7) : ostatniDzien;
  } else {
    termin = ostatnio ? dodajDni(ostatnio, r.coIleDni || 1) : dzis;
  }
  const odlozoneDo = stan.odlozone[r.id] && stan.odlozone[r.id] > dzis ? stan.odlozone[r.id] : null;
  const opoznienie = roznicaDni(dzis, termin);
  const status = auto.koniec ? "koniec" : opoznienie < 0 ? "zrobione" : odlozoneDo ? "odlozone" : opoznienie === 0 ? "dzis" : "zalegle";
  return {
    id: r.id, typ: "cykliczne", nazwa: r.nazwa, proces: r.proces || null, auto: !!r.auto,
    co: Number.isInteger(r.dzienTygodnia) ? `co tydzień (${["nd", "pon", "wt", "śr", "czw", "pt", "sob"][r.dzienTygodnia]})` : r.coIleDni === 1 ? "codziennie" : r.coIleDni === 7 ? "co tydzień" : r.coIleDni === 30 ? "co miesiąc" : `co ${r.coIleDni} dni`,
    ostatnio, termin, opoznienie: Math.max(0, opoznienie), status, odlozoneDo,
    info: auto.info || null, link: auto.link || null, odhaczoneDzis: reczne === dzis,
  };
}

function pozycjaPrzypomnienia(p, stan, dzis) {
  const zrobione = stan.zrobione[p.id] || null;
  const odlozoneDo = stan.odlozone[p.id] && stan.odlozone[p.id] > dzis ? stan.odlozone[p.id] : null;
  const status = zrobione ? "zrobione" : p.od > dzis ? "wkrotce" : odlozoneDo ? "odlozone" : roznicaDni(dzis, p.od) > 0 ? "zalegle" : "dzis";
  return { id: p.id, typ: "przypomnienie", nazwa: p.nazwa, proces: p.proces || null, info: p.opis || null, termin: p.od, opoznienie: Math.max(0, roznicaDni(dzis, p.od)), status, zrobione, odlozoneDo };
}

// ---------- całość ----------
export async function stanCentrum({ partie = [], partieWToku = [], backup = null }) {
  const dzis = dzienLokalny();
  const gh = await daneGithub();
  const g = stanGita();
  const seo = stanSeo();
  const rytm = wczytajRytm();
  const stan = wczytajStan();
  const kontekst = { dzis, git: g, gh, seo, backup, partie };
  const cykliczne = rytm.cykliczne.map((r) => pozycjaRytmu(r, stan, kontekst)).filter((r) => r.status !== "koniec");
  const przypomnienia = (rytm.przypomnienia || []).map((p) => pozycjaPrzypomnienia(p, stan, dzis));

  const przebieg = gh?.ostatniPrzebieg;
  const przebiegDzis = przebieg && dzienLokalny(new Date(przebieg.createdAt)) === dzis;
  const repo = adresRepo();
  return {
    dzis,
    rytm: [...cykliczne, ...przypomnienia],
    git: g,
    github: {
      blad: gh?.blad || null,
      fetchBlad: gh?.fetchBlad || null,
      sprawdzono: github.kiedy || null,
      pr: gh?.pr || null,
      automatTresci: przebieg ? { ...przebieg, dzis: przebiegDzis } : null,
    },
    blog: stanBloga(dzis),
    seo,
    backup,
    partieWToku,
    linki: {
      produkcja: "https://czypolskafirma.pl",
      podglad: "https://czypolskafirmalive-git-develop-wiktorow123-3833s-projects.vercel.app/",
      repo,
      pr: repo && `${repo}/pulls`,
      actions: repo && `${repo}/actions/workflows/${WORKFLOW_TRESCI}`,
      porownanie: repo && `${repo}/compare/main...develop`,
      gsc: "https://search.google.com/search-console?resource_id=sc-domain%3Aczypolskafirma.pl",
      supabase: "https://supabase.com/dashboard/projects",
      vercel: "https://vercel.com/dashboard",
    },
  };
}

export function odhacz({ id, typ, cofnij }) {
  const rytm = wczytajRytm();
  const lista = typ === "przypomnienie" ? rytm.przypomnienia : rytm.cykliczne;
  if (!lista?.some((r) => r.id === id)) throw new Error(`Nie ma pozycji „${id}".`);
  const stan = wczytajStan();
  const klucz = typ === "przypomnienie" ? "zrobione" : "odhaczone";
  if (cofnij) delete stan[klucz][id];
  else stan[klucz][id] = dzienLokalny();
  delete stan.odlozone[id];
  zapiszStan(stan);
}

export function odloz({ id, dni = 1 }) {
  const stan = wczytajStan();
  stan.odlozone[id] = dodajDni(dzienLokalny(), Math.max(1, Math.min(30, Number(dni) || 1)));
  zapiszStan(stan);
}

// ---------- procesy (docs/PROCESY.md) ----------
const POLA_META = { Kiedy: "kiedy", Gdzie: "gdzie", "Pełny opis": "opis", Obszar: "obszar", "Prowadzi do": "dalej" };

export function procesy() {
  if (!fs.existsSync(PLIK_PROCESOW)) return { procesy: [], blad: "Brak pliku docs/PROCESY.md." };
  const t = fs.readFileSync(PLIK_PROCESOW, "utf8").replace(/\r\n/g, "\n");
  const rytm = wczytajRytm();
  const notatki = wczytajDziennik().notatki.sort((a, b) => b.data.localeCompare(a.data));
  const wynik = [];
  for (const blok of t.split(/^## /m).slice(1)) {
    const [naglowek, ...linie] = blok.split("\n");
    const m = naglowek.match(/^(.*?)\s*\{#([\w-]+)\}\s*$/);
    if (!m) continue;
    const meta = {};
    const tresc = [];
    for (const l of linie) {
      const mm = l.match(/^- \*\*(Kiedy|Gdzie|Pełny opis|Obszar|Prowadzi do):\*\*\s*(.*)$/);
      if (mm && !tresc.some((x) => x.trim())) meta[POLA_META[mm[1]]] = mm[2];
      else tresc.push(l);
    }
    // „Prowadzi do: publikacja (merge PR-a); firmy (kandydaci do bazy)” → strzałki na mapie procesów.
    const dalej = (meta.dalej || "").split(";").map((x) => x.trim().match(/^([\w-]+)\s*(?:\((.*)\))?$/)).filter(Boolean).map((x) => ({ id: x[1], etykieta: x[2] || "" }));
    wynik.push({
      id: m[2], nazwa: m[1], ...meta, dalej, tresc: tresc.join("\n").trim(),
      rytm: [...rytm.cykliczne, ...(rytm.przypomnienia || [])].filter((r) => r.proces === m[2]).map((r) => r.nazwa),
      zmiany: notatki.filter((n) => n.proces === m[2]).slice(0, 5),
    });
  }
  return { procesy: wynik };
}

// Pełny dokument do podglądu w panelu: tylko pliki .md z docs/ i tools/skills/.
export function dokument(sciezka) {
  const wzgledna = String(sciezka || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!/^(docs|tools\/skills)\/[\w\-./ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+\.md$/.test(wzgledna) || wzgledna.includes("..")) throw new Error("Tego pliku nie da się otworzyć w panelu.");
  const pelna = path.join(KATALOG_REPO, wzgledna);
  if (!fs.existsSync(pelna)) throw new Error(`Nie ma pliku ${wzgledna}.`);
  return { sciezka: wzgledna, tresc: fs.readFileSync(pelna, "utf8") };
}

// ---------- dziennik zmian ----------
// Commity z develop (bez merge'y) plus notatki właściciela i Claude'a z data/panel/dziennik.json.
// Rodzaj commita liczymy z plików: procesy > narzędzia > strona > logotypy > treści > SEO > inne.
const RODZAJE = [
  ["procesy", "zmiana procesu", /^(docs\/(PROCESY|SOP_|AUTOMATYZACJA_TRESCI|DEVELOPMENT_WORKFLOW|METODOLOGIA|BACKUP_STRATEGY)[^/]*\.md|\.github\/(workflows|prompts)\/|tools\/skills\/|data\/panel\/rytm\.json|CLAUDE\.md)/],
  ["narzedzia", "narzędzia", /^tools\//],
  ["strona", "strona", /^(app|components|lib|public\/(?!logos))\//],
  ["logotypy", "logotypy", /^public\/logos/],
  ["tresci", "treści", /^(content\/blog|docs\/social|public\/images\/blog)\//],
  ["seo", "SEO", /^docs\/seo-/],
];

const wczytajDziennik = () => { const d = czytajJson(PLIK_DZIENNIKA, {}); return { notatki: Array.isArray(d.notatki) ? d.notatki : [] }; };
function zapiszDziennik(d) {
  fs.mkdirSync(KATALOG_PANELU, { recursive: true });
  d.notatki.sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
  fs.writeFileSync(PLIK_DZIENNIKA, JSON.stringify(d, null, 2) + "\n", "utf8");
}

export function dziennik({ dni = 30 } = {}) {
  const galaz = git("rev-parse", "--verify", "--quiet", "develop") ? "develop" : "HEAD";
  const surowe = git("log", galaz, "--no-merges", `--since=${dni}.days`, "--date=iso-strict", "--name-only", "--format=%x1e%H%x1f%h%x1f%aI%x1f%an%x1f%s") || "";
  const naMain = new Set((git("rev-list", "origin/main", `--since=${dni + 10}.days`) || "").split(/\r?\n/).filter(Boolean));
  const repo = adresRepo();
  const commity = surowe.split("\x1e").filter((x) => x.trim()).map((blok) => {
    const [naglowek, ...pliki] = blok.split(/\r?\n/);
    const [hash, krotki, kiedy, autor, tytul] = naglowek.split("\x1f");
    const lista = pliki.map((p) => p.trim()).filter(Boolean);
    const rodzaj = RODZAJE.find(([, , wzor]) => lista.some((p) => wzor.test(p)));
    return {
      typ: "commit", hash: krotki, data: dzienLokalny(new Date(kiedy)), godzina: kiedy, autor, tytul,
      rodzaj: rodzaj ? rodzaj[0] : "inne", rodzajNazwa: rodzaj ? rodzaj[1] : "inne",
      plikow: lista.length, przyklady: lista.slice(0, 6),
      naProdukcji: naMain.has(hash), link: repo ? `${repo}/commit/${hash}` : null,
    };
  });
  const od = dodajDni(dzienLokalny(), -dni);
  const notatki = wczytajDziennik().notatki.filter((n) => n.data >= od).map((n) => ({ typ: "notatka", ...n }));
  return { od, wpisy: [...notatki, ...commity].sort((a, b) => b.data.localeCompare(a.data) || (a.typ === "notatka" ? -1 : 1)) };
}

export function dodajNotatke({ tekst, proces = null, data = null, autor = "Wiktor" }) {
  const t = String(tekst || "").trim();
  if (!t) throw new Error("Notatka jest pusta.");
  if (t.length > 1000) throw new Error("Notatka jest za długa (maks. 1000 znaków).");
  const d = wczytajDziennik();
  const dzien = /^\d{4}-\d{2}-\d{2}$/.test(data || "") ? data : dzienLokalny();
  d.notatki.push({ id: `${dzien}-${Date.now().toString(36)}`, data: dzien, tekst: t, proces: proces || null, autor: autor === "Claude" ? "Claude" : "Wiktor" });
  zapiszDziennik(d);
}

export function usunNotatke({ id }) {
  const d = wczytajDziennik();
  const przed = d.notatki.length;
  d.notatki = d.notatki.filter((n) => n.id !== id);
  if (d.notatki.length === przed) throw new Error("Nie ma takiej notatki.");
  zapiszDziennik(d);
}

// ---------- metryki miesięczne ----------
export const POLA_METRYK = [
  { id: "odwiedzajacy", nazwa: "Odwiedzający", zrodlo: "Vercel Analytics", liczba: true },
  { id: "gscKlikniecia", nazwa: "Kliknięcia z Google", zrodlo: "Search Console", liczba: true },
  { id: "gscWyswietlenia", nazwa: "Wyświetlenia w Google", zrodlo: "Search Console", liczba: true },
  { id: "obserwujacyX", nazwa: "Obserwujący na X", zrodlo: "X", liczba: true },
  { id: "obserwujacyFb", nazwa: "Obserwujący na FB", zrodlo: "Facebook", liczba: true },
  { id: "najlepszyPost", nazwa: "Najlepszy post", zrodlo: "X / Facebook" },
  { id: "najlepszyPostLink", nazwa: "Link do najlepszego posta", zrodlo: "X / Facebook" },
  { id: "notatka", nazwa: "Co zadziałało", zrodlo: "" },
];

const wczytajMetryki = () => { const d = czytajJson(PLIK_METRYK, {}); return { miesiace: Array.isArray(d.miesiace) ? d.miesiace : [] }; };

export function metryki() {
  return { pola: POLA_METRYK, miesiace: wczytajMetryki().miesiace.sort((a, b) => a.miesiac.localeCompare(b.miesiac)) };
}

export function zapiszMetryki(dane) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(dane.miesiac || "")) throw new Error("Wybierz miesiąc.");
  const wpis = { miesiac: dane.miesiac };
  for (const p of POLA_METRYK) {
    const v = dane[p.id];
    if (p.liczba) {
      if (v === "" || v === null || v === undefined) continue;
      const n = Number(String(v).replace(/[\s ]/g, "").replace(",", "."));
      if (!Number.isFinite(n) || n < 0) throw new Error(`„${p.nazwa}” musi być liczbą.`);
      wpis[p.id] = Math.round(n);
    } else if (String(v || "").trim()) wpis[p.id] = String(v).trim().slice(0, 1000);
  }
  wpis.zapisano = dzienLokalny();
  const d = wczytajMetryki();
  d.miesiace = [...d.miesiace.filter((m) => m.miesiac !== wpis.miesiac), wpis].sort((a, b) => a.miesiac.localeCompare(b.miesiac));
  fs.mkdirSync(KATALOG_PANELU, { recursive: true });
  fs.writeFileSync(PLIK_METRYK, JSON.stringify(d, null, 2) + "\n", "utf8");
}

export function usunMetryki({ miesiac }) {
  const d = wczytajMetryki();
  d.miesiace = d.miesiace.filter((m) => m.miesiac !== miesiac);
  fs.writeFileSync(PLIK_METRYK, JSON.stringify(d, null, 2) + "\n", "utf8");
}
