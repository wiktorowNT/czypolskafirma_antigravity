// tools/gen-display-name-sql.mjs
// Generuje docs/display-names.sql — UPDATE-y wypełniajace companies.display_name
// TYLKO dla marek, dla ktorych poprawna nazwa rozni sie od auto-generowanej ze sluga
// (polskie znaki, skroty, charakterystyczna pisownia). Reszta firm zostaje bez
// display_name — kod robi fallback na displayNameFromSlug(slug), co daje ten sam wynik.
//
// Slownik korekt jest recznie zweryfikowany. Klucz = slug w bazie (kolumna companies.slug).
// Uruchom: node tools/gen-display-name-sql.mjs
// Skrypt sprawdza tez, ktore klucze NIE wystepuja w CSV (literowka/nieaktualny slug).

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const CORRECTIONS = {
  // --- Polskie znaki / nazwy ---
  "zabka": "Żabka",
  "zywiec-zdroj": "Żywiec Zdrój",
  "grupa-zywiec": "Grupa Żywiec",
  "sniezka": "Śnieżka",
  "tubadzin": "Tubądzin",
  "sokolow": "Sokołów",
  "pszczolka": "Pszczółka",
  "mrowka": "Mrówka",
  "rylko": "Ryłko",
  "wolczanka": "Wólczanka",
  "wisniowski": "Wiśniowski",
  "tarczynski": "Tarczyński",
  "naleczowianka": "Nałęczowianka",
  "cisowianka-naleczow-zdroj": "Cisowianka Nałęczów Zdrój",
  "kopernik-torunskie-pierniki": "Kopernik Toruńskie Pierniki",
  "koleje-dolnoslaskie": "Koleje Dolnośląskie",
  "krajowa-grupa-spozywcza": "Krajowa Grupa Spożywcza",
  "jbb-baldyga": "JBB Bałdyga",
  "madej-wrobel": "Madej Wróbel",
  "meble-wojcik": "Meble Wójcik",
  "osm-lowicz": "OSM Łowicz",
  "osm-piatnica": "OSM Piątnica",
  "piatnica": "Piątnica",
  "osm-ryki": "OSM Ryki",
  "osm-krasnystaw": "OSM Krasnystaw",
  "osm-sierpc": "OSM Sierpc",
  "swiatlowod-inwestycje": "Światłowód Inwestycje",
  "tolpa": "Tołpa",
  "muller": "Müller",

  // --- Skroty / wielkie litery ---
  "bp": "BP",
  "kfc": "KFC",
  "lg": "LG",
  "abb": "ABB",
  "bmw": "BMW",
  "bsh": "BSH",
  "dhl": "DHL",
  "dpd": "DPD",
  "gsk": "GSK",
  "hp": "HP",
  "ibm": "IBM",
  "ing": "ING",
  "jsw": "JSW",
  "msd": "MSD",
  "pge": "PGE",
  "pgnig": "PGNiG",
  "pkp": "PKP",
  "pks": "PKS",
  "pko-bp": "PKO BP",
  "pzu": "PZU",
  "sap": "SAP",
  "sgb": "SGB",
  "tcl": "TCL",
  "tvn": "TVN",
  "ups": "UPS",
  "wp": "WP",
  "ccc": "CCC",
  "lot": "LOT",
  "blik": "BLIK",
  "olx": "OLX",
  "gls": "GLS",
  "ndi": "NDI",
  "cfe": "CFE",
  "dre": "DRE",
  "bps": "BPS",
  "bos": "BOŚ Bank",
  "inea": "INEA",
  "exatel": "EXATEL",
  "rtv-euro-agd": "RTV EURO AGD",
  "usp-zdrowie": "USP Zdrowie",
  "doz-dbam-o-zdrowie": "DOZ Dbam o Zdrowie",
  "tvp-telewizja-polska": "TVP – Telewizja Polska",
  "tui-poland": "TUI Poland",
  "dax-cosmetics": "DAX Cosmetics",
  "pz-cussons-luksja": "PZ Cussons Luksja",
  "jd-sports": "JD Sports",
  "fb-antczak": "FB Antczak",
  "stx-next": "STX Next",
  "dxc-technology": "DXC Technology",
  "epam-systems": "EPAM Systems",
  "bnp-paribas": "BNP Paribas",
  "rmf-fm": "RMF FM",
  "rmf-maxx": "RMF MAXX",
  "tok-fm": "TOK FM",
  "radio-zet": "Radio ZET",
  "h-m": "H&M",
  "c-a": "C&A",
  "s-c-johnson": "S.C. Johnson",
  "tk-maxx": "TK Maxx",
  "max-hbo": "HBO Max",
  "lux-med": "LUX MED",
  "man-man-truck-bus": "MAN Truck & Bus",

  // --- Charakterystyczna pisownia / interpunkcja ---
  "tiktok": "TikTok",
  "mbank": "mBank",
  "payu": "PayU",
  "paypo": "PayPo",
  "levi-s": "Levi's",
  "mcdonald-s": "McDonald's",
  "domino-s-pizza": "Domino's Pizza",
  "dr-oetker": "Dr. Oetker",
  "dr-max": "Dr. Max",
  "de-longhi": "De'Longhi",
  "loreal": "L'Oréal",
  "coca-cola": "Coca-Cola",
  "pull-bear": "Pull&Bear",
  "procter-gamble": "Procter & Gamble",
  "colgate-palmolive": "Colgate-Palmolive",
  "lindt-sprungli": "Lindt & Sprüngli",
  "estee-lauder": "Estée Lauder",
  "green-caffe-nero": "Green Caffè Nero",
  "nestle": "Nestlé",
  "pepsico": "PepsiCo",
  "mondelez": "Mondelēz",
  "astrazeneca": "AstraZeneca",
  "abbvie": "AbbVie",
  "t-mobile": "T-Mobile",
  "e-on": "E.ON",
  "canal": "Canal+",
  "e-wedel": "E. Wedel",
  "pyszne-pl": "Pyszne.pl",
  "frisco-pl": "Frisco.pl",
  "answear-com": "Answear.com",
  "bonito-pl": "Bonito.pl",
  "taniaksiazka-pl": "TaniaKsiazka.pl",
  "ebilet-pl": "eBilet.pl",
  "cda-pl": "CDA.pl",
  "wakacje-pl": "Wakacje.pl",
  "pracuj-pl-grupa-pracuj": "Pracuj.pl (Grupa Pracuj)",
  "eobuwie-pl": "eobuwie.pl",
  "morele": "Morele.net",
  "cd-projekt-red": "CD Projekt Red",
  "people-can-fly": "People Can Fly",
  "playway": "PlayWay",
  "getresponse": "GetResponse",
  "softserve": "SoftServe",
  "10clouds": "10Clouds",
  "11-bit-studios": "11 bit studios",
  "neonail": "NeoNail",
  "onlybio": "OnlyBio",
  "yope": "YOPE",
  "4f": "4F",
  "seat": "SEAT",
  "skoda": "Škoda",
  "citroen": "Citroën",
  "lego": "LEGO",
  "ikea-sklepy": "IKEA",
  "jysk": "JYSK",
  "obi": "OBI",
  "spar": "SPAR",
  "bricomarche": "Bricomarché",
  "leclerc": "E.Leclerc",
  "media-markt": "MediaMarkt",
  "neonet": "NEONET",
  "kik": "KiK",
  "tedi": "TEDi",
  "halfprice": "HalfPrice",
  "w-kruk": "W.KRUK",
  "yes": "YES",
  "meble-vox": "Meble VOX",
  "polomarket": "POLOmarket",
  "hasco-lek": "Hasco-Lek",
  "enel-med": "Enel-Med",
  "super-pharm": "Super-Pharm",
  "nationale-nederlanden": "Nationale-Nederlanden",
  "unicredit": "UniCredit",
  "uniqa": "UNIQA",
  "ergo-hestia": "ERGO Hestia",
  "bank-millennium": "Bank Millennium",
  "millennium": "Bank Millennium",
  "velobank": "VeloBank",
  "nju-mobile": "nju mobile",
  "lajt-mobile": "lajt.mobile",
  "ava-laboratorium": "AVA Laboratorium",
}

// ---- Generowanie SQL uruchamiamy TYLKO gdy plik jest wywolany bezposrednio
// (`node tools/gen-display-name-sql.mjs`). Przy imporcie eksportujemy sam CORRECTIONS.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

function parseCsvLine(line) {
  const out = []
  let cur = "", q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === ",") { out.push(cur); cur = "" }
      else cur += c
    }
  }
  out.push(cur)
  return out
}

// Zbior slugow z bazy (na podstawie CSV) do walidacji kluczy slownika.
// Eksportowane, bo korzysta z tego rowniez skrypt aplikujacy (apply-display-names.mjs).
export function loadDbSlugsFromCsv() {
  const csvPath = path.join(__dirname, "..", "docs", "display-names.csv")
  const dbSlugs = new Set()
  if (fs.existsSync(csvPath)) {
    const raw = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, "")
    const lines = raw.split(/\r?\n/).filter(Boolean).slice(1)
    for (const line of lines) {
      const cols = parseCsvLine(line)
      if (cols[1]) dbSlugs.add(cols[1]) // raw_slug = companies.slug
    }
  }
  return dbSlugs
}

if (isMain) {
  const outPath = path.join(__dirname, "..", "docs", "display-names.sql")
  const dbSlugs = loadDbSlugsFromCsv()
  if (!dbSlugs.size) {
    console.warn("⚠ Brak docs/display-names.csv — nie moge zweryfikowac slugow. Uruchom najpierw: node tools/fill-display-names.mjs")
  }

  const missing = []
  const valid = []
  for (const [slug, name] of Object.entries(CORRECTIONS)) {
    if (dbSlugs.size && !dbSlugs.has(slug)) missing.push(slug)
    else valid.push([slug, name])
  }

  if (missing.length) {
    console.warn(`⚠ ${missing.length} slugow ze slownika NIE ma w CSV (pomijam w SQL): ${missing.join(", ")}`)
  }

  const esc = (s) => s.replace(/'/g, "''")
  const valuesRows = valid.map(([slug, name]) => `  ('${esc(slug)}', '${esc(name)}')`).join(",\n")

  const sql = `-- docs/display-names.sql — WYGENEROWANE przez tools/gen-display-name-sql.mjs
-- Wykonaj w Supabase SQL Editor. Ustawia companies.display_name tylko dla marek,
-- ktorych poprawna nazwa rozni sie od auto-generowanej ze sluga (${valid.length} firm).
-- Bezpieczne: nie rusza pozostalych firm (fallback na slug daje ten sam wynik).
-- Idempotentne: mozna uruchomic ponownie.

UPDATE companies AS c
SET display_name = v.name
FROM (VALUES
${valuesRows}
) AS v(slug, name)
WHERE c.slug = v.slug;

-- Weryfikacja (opcjonalnie):
-- SELECT slug, display_name FROM companies WHERE display_name IS NOT NULL ORDER BY slug;
`

  fs.writeFileSync(outPath, sql, "utf8")
  console.log(`✔ Zapisano ${valid.length} korekt do: ${outPath}`)
  if (missing.length) console.log(`  (pominieto ${missing.length} nieistniejacych slugow — patrz ostrzezenie wyzej)`)
}
