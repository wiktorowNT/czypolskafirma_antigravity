// tools/apply-display-names.mjs
// Wypelnia companies.display_name w Supabase wg slownika CORRECTIONS
// (tools/gen-display-name-sql.mjs). NIE wypisuje kluczy.
//
//   node tools/apply-display-names.mjs            # DRY-RUN (nic nie zapisuje)
//   node tools/apply-display-names.mjs --apply    # faktyczny zapis (PATCH per firma)
//
// Wymaga w .env.local: NEXT_PUBLIC_SUPABASE_URL oraz klucza.
// UPDATE zwykle wymaga SUPABASE_SERVICE_ROLE_KEY (anon key moze byc zablokowany przez RLS).

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { CORRECTIONS, loadDbSlugsFromCsv } from "./gen-display-name-sql.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local")
  const env = { ...process.env }
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const KEY = SERVICE_KEY || ANON_KEY

if (!SUPABASE_URL || !KEY) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub klucza w .env.local")
  process.exit(1)
}

const APPLY = process.argv.includes("--apply")
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
}

// Waliduj slugi wzgledem CSV (jesli dostepny) — pomijamy nieistniejace.
const dbSlugs = loadDbSlugsFromCsv()
const entries = Object.entries(CORRECTIONS).filter(([slug]) => !dbSlugs.size || dbSlugs.has(slug))
const skipped = Object.keys(CORRECTIONS).length - entries.length

async function patchOne(slug, name) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify({ display_name: name }),
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`)
  }
  const rows = await res.json()
  return Array.isArray(rows) ? rows.length : 0
}

async function main() {
  console.log(`Tryb: ${APPLY ? "APPLY — zapisuje zmiany" : "DRY-RUN (bez zapisu)"}`)
  console.log(`Klucz: ${SERVICE_KEY ? "service_role" : "anon (moze byc zablokowany przez RLS)"}`)
  console.log(`Do zaktualizowania: ${entries.length} firm${skipped ? ` (pominieto ${skipped} nieistniejacych)` : ""}\n`)

  if (!APPLY) {
    for (const [slug, name] of entries.slice(0, 10)) console.log(`  ${slug} -> ${name}`)
    console.log(`  ...(${entries.length} lacznie)`)
    console.log("\nDRY-RUN. Uruchom z --apply, aby zapisac.")
    return
  }

  let updated = 0
  const notFound = []
  const failed = []
  for (const [slug, name] of entries) {
    try {
      const n = await patchOne(slug, name)
      if (n > 0) updated += n
      else notFound.push(slug)
    } catch (err) {
      failed.push(`${slug}: ${err.message}`)
    }
  }

  console.log(`✔ Zaktualizowano wierszy: ${updated}`)
  if (notFound.length) console.log(`• Bez dopasowania (0 wierszy): ${notFound.join(", ")}`)
  if (failed.length) {
    console.log(`✗ Bledy (${failed.length}):`)
    for (const f of failed) console.log(`   ${f}`)
  }
}

main().catch((err) => {
  console.error("Blad:", err.message)
  process.exit(1)
})
