// tools/normalizuj-slugi.mjs
// Jednorazowy skrypt: normalizuje kolumnę `slug` w tabeli `companies` (Supabase)
// do kanonicznej postaci URL — tej samej, którą generuje lib/slug-utils.ts.
//
// Przykłady: "50 Style" -> "50-style", "DM (Drogerie Markt)" -> "dm-drogerie-markt",
//            "Dr. Max" -> "dr-max", "Mrówka" -> "mrowka", "TaniaKsiazka.pl" -> "taniaksiazka-pl"
//
// Użycie:
//   node tools/normalizuj-slugi.mjs           # DRY-RUN: tylko pokazuje, co by się zmieniło
//   node tools/normalizuj-slugi.mjs --apply   # faktycznie zapisuje zmiany w bazie
//
// Bezpieczeństwo:
// - Domyślnie dry-run, nic nie zapisuje.
// - Wykrywa kolizje (dwie firmy dające ten sam slug) — takie rekordy pomija i raportuje.
// - Przed --apply zrób backup bazy (docs/BACKUP_STRATEGY.md).
//
// UWAGA: strona działa poprawnie także BEZ tej migracji (slugify liczony w locie),
// ale po niej baza i URL-e są spójne 1:1, a fallbackowe dopasowywanie slugów
// w app/firma/[slug]/page.tsx przestaje być potrzebne.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// ---------- slugify — MUSI być identyczne z lib/slug-utils.ts ----------

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
// Do UPDATE zwykle potrzebny jest service role key (anon key może być zablokowany przez RLS).
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub klucza (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY) w .env.local")
  process.exit(1)
}
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠ Używam anon key — jeśli UPDATE nie przejdzie (RLS), dodaj SUPABASE_SERVICE_ROLE_KEY do .env.local\n")
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
}

// ---------- Logika ----------

const APPLY = process.argv.includes("--apply")

async function fetchAllCompanies() {
  const all = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug&order=name`,
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

async function updateSlug(id, newSlug) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify({ slug: newSlug }),
  })
  if (!res.ok) {
    throw new Error(`UPDATE ${id} nie powiódł się: ${res.status} ${await res.text()}`)
  }
}

async function main() {
  console.log(`Tryb: ${APPLY ? "APPLY — zapisuję zmiany!" : "DRY-RUN (podgląd, bez zapisu)"}\n`)

  const companies = await fetchAllCompanies()
  console.log(`Pobrano ${companies.length} firm.\n`)

  // Mapa: kanoniczny slug -> lista firm, które na niego wypadają (wykrywanie kolizji)
  const bySlug = new Map()
  for (const c of companies) {
    const canonical = slugify(c.slug || c.name) || c.id
    if (!bySlug.has(canonical)) bySlug.set(canonical, [])
    bySlug.get(canonical).push(c)
  }

  const changes = []
  const collisions = []

  for (const [canonical, group] of bySlug) {
    if (group.length > 1) {
      collisions.push({ canonical, group })
      continue
    }
    const c = group[0]
    if (c.slug !== canonical) {
      changes.push({ id: c.id, name: c.name, old: c.slug, new: canonical })
    }
  }

  if (collisions.length > 0) {
    console.log(`⚠ KOLIZJE (${collisions.length}) — pominięte, wymagają ręcznej decyzji:`)
    for (const { canonical, group } of collisions) {
      console.log(`  "${canonical}" <- ${group.map((c) => `[${c.slug}] ${c.name}`).join("  |  ")}`)
    }
    console.log()
  }

  if (changes.length === 0) {
    console.log("✔ Wszystkie slugi są już kanoniczne — nic do zrobienia.")
    return
  }

  console.log(`Do zmiany: ${changes.length} firm:`)
  for (const ch of changes) {
    console.log(`  "${ch.old}" -> "${ch.new}"   (${ch.name})`)
  }
  console.log()

  if (!APPLY) {
    console.log("DRY-RUN zakończony. Uruchom z --apply, aby zapisać zmiany.")
    return
  }

  let done = 0
  for (const ch of changes) {
    await updateSlug(ch.id, ch.new)
    done++
    if (done % 25 === 0) console.log(`  ...zaktualizowano ${done}/${changes.length}`)
  }
  console.log(`\n✔ Zaktualizowano ${done} slugów.`)
  console.log("Pamiętaj: stare URL-e będą dalej działać dzięki redirectom 301/308 w app/firma/[slug]/page.tsx.")
}

main().catch((err) => {
  console.error("Błąd:", err.message)
  process.exit(1)
})
