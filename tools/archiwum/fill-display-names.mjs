// tools/fill-display-names.mjs
// Read-only: generuje CSV (slug -> proponowana nazwa marki) do RĘCZNEJ weryfikacji
// najbardziej znanych marek, zanim wypełnisz kolumnę `display_name` w Supabase.
//
// NIC nie zapisuje do bazy — tylko czyta `companies` i produkuje plik CSV.
//
// Użycie:
//   node tools/fill-display-names.mjs                       # zapis do docs/display-names.csv
//   node tools/fill-display-names.mjs --out=sciezka.csv     # własna ścieżka wyjścia
//   node tools/fill-display-names.mjs --only-empty          # tylko firmy bez display_name
//
// Kolumny CSV:
//   slug                — kanoniczny slug URL (ten sam, którego używa strona)
//   raw_slug            — surowy slug z bazy
//   nazwa_z_bazy        — kolumna companies.name
//   obecny_display_name — aktualna wartość companies.display_name (może być pusta)
//   proponowana_nazwa   — punkt startu: obecny display_name lub displayNameFromSlug(slug)
//
// Proces: otwórz CSV, popraw ręcznie kolumnę `proponowana_nazwa` dla znanych marek
// (np. Zabka -> Żabka, Pko Bp -> PKO BP, Rtv Euro Agd -> RTV EURO AGD), a potem
// przenieś zweryfikowane wartości do kolumny display_name w Supabase.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// ---------- slugify / displayNameFromSlug — MUSI być spójne z lib/slug-utils.ts ----------

const POLISH_MAP = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n", Ó: "o", Ś: "s", Ź: "z", Ż: "z",
}

function slugify(name) {
  if (!name) return ""
  return name
    .trim()
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => POLISH_MAP[ch] || ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function displayNameFromSlug(rawSlug) {
  if (!rawSlug) return ""
  const raw = rawSlug.trim()
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw)) {
    return raw
  }
  return raw
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// ---------- Wczytanie env z .env.local (bez zależności od dotenv) ----------

function loadEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const envPath = path.join(__dirname, "..", ".env.local")
  const env = { ...process.env }
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in env)) {
        env[m[1]] = m[2].replace(/^["']|["']$/g, "")
      }
    }
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub klucza (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY) w .env.local")
  process.exit(1)
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
}

// ---------- Argumenty ----------

const ONLY_EMPTY = process.argv.includes("--only-empty")
const outArg = process.argv.find((a) => a.startsWith("--out="))
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = outArg
  ? path.resolve(outArg.slice("--out=".length))
  : path.join(__dirname, "..", "docs", "display-names.csv")

// ---------- Pobranie firm (z obsługą braku kolumny display_name) ----------

async function fetchCompanies(select) {
  const all = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=${select}&order=name`,
      { headers: { ...HEADERS, Range: `${offset}-${offset + pageSize - 1}` } }
    )
    if (!res.ok) {
      throw new Error(`Błąd pobierania firm: ${res.status} ${await res.text()}`)
    }
    const page = await res.json()
    all.push(...page)
    if (page.length < pageSize) break
  }
  return all
}

// ---------- CSV ----------

function csvCell(value) {
  const s = value == null ? "" : String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCsvRow(cells) {
  return cells.map(csvCell).join(",")
}

async function main() {
  let companies
  let hasDisplayNameColumn = true
  try {
    companies = await fetchCompanies("id,name,slug,display_name")
  } catch (err) {
    // Kolumna display_name może jeszcze nie istnieć w bazie — działamy bez niej.
    console.warn("⚠ Nie udało się pobrać display_name (kolumna jeszcze nie istnieje?). Generuję CSV bez niej.\n")
    hasDisplayNameColumn = false
    companies = await fetchCompanies("id,name,slug")
  }

  const header = ["slug", "raw_slug", "nazwa_z_bazy", "obecny_display_name", "proponowana_nazwa"]
  const rows = [toCsvRow(header)]

  let count = 0
  for (const c of companies) {
    const rawSlug = c.slug || ""
    const current = hasDisplayNameColumn ? (c.display_name || "") : ""
    if (ONLY_EMPTY && current.trim()) continue

    const canonicalSlug = rawSlug ? slugify(rawSlug) || c.id : c.id
    const proposed = current.trim() || (rawSlug ? displayNameFromSlug(rawSlug) : c.name || "")

    rows.push(toCsvRow([canonicalSlug, rawSlug, c.name || "", current, proposed]))
    count++
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  // BOM, aby Excel poprawnie odczytał polskie znaki (UTF-8).
  fs.writeFileSync(OUT_PATH, "﻿" + rows.join("\r\n") + "\r\n", "utf8")

  console.log(`✔ Zapisano ${count} wierszy do: ${OUT_PATH}`)
  console.log("Popraw kolumnę 'proponowana_nazwa' dla znanych marek, a potem przenieś")
  console.log("zweryfikowane wartości do kolumny display_name w Supabase.")
}

main().catch((err) => {
  console.error("Błąd:", err.message)
  process.exit(1)
})
