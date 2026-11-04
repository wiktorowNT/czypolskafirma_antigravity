#!/usr/bin/env node
// Audyt jakości danych firm na podstawie ŻYWEJ strony czypolskafirma.pl (bez kluczy do bazy).
//
// Źródła: /sitemap-firmy.xml, HTML profili /firma/<slug> (payload RSC + JSON-LD),
// /api/companies, /api/stats, /companies/lista.json (gdy wdrożone).
// Pobieranie: maks. 3 zapytania naraz, pauza 250 ms, User-Agent z nazwą skryptu,
// cache w .tmp/audyt-danych/ (poza gitem). Drugie uruchomienie korzysta z cache.
//
// Użycie (z katalogu repo):
//   node tools/audyt-danych/audyt-danych.mjs              # pobierz brakujące + analiza
//   node tools/audyt-danych/audyt-danych.mjs --odswiez    # pobierz wszystko od nowa
//   node tools/audyt-danych/audyt-danych.mjs --bez-sieci  # tylko analiza z cache
//
// Wynik:
//   .tmp/audyt-danych/firmy.json     # sparsowane profile (surowe dane)
//   .tmp/audyt-danych/wyniki.json    # wszystkie znaleziska (pełne listy)
//   .tmp/audyt-danych/raport.md      # tabele do wklejenia w docs/AUDYT_DANYCH_*.md
//   .tmp/audyt-danych/poprawki-wlasciciele.sql  # wygenerowane propozycje UPDATE
// Skrypt niczego nie zapisuje do bazy.

import fs from "fs"
import path from "path"
import { BAZA, pobierz, pobierzDoCache, pula, wpisySitemapy } from "./lib/pobieranie.mjs"
import { parsujProfil } from "./lib/profil.mjs"
import { analizuj, czyOgolny } from "./lib/analiza.mjs"
import { zapiszRaport, zapiszSql } from "./lib/raport.mjs"

const ROOT = process.cwd()
const TMP = path.join(ROOT, ".tmp", "audyt-danych")
const HTML_DIR = path.join(TMP, "html")
const args = new Set(process.argv.slice(2))
const ODSWIEZ = args.has("--odswiez")
const BEZ_SIECI = args.has("--bez-sieci")

const plikSlugu = (slug) => path.join(HTML_DIR, encodeURIComponent(slug) + ".html")

async function pobierzJson(sciezka, plik) {
  const r = BEZ_SIECI
    ? fs.existsSync(plik) ? { status: 200, tekst: fs.readFileSync(plik, "utf8") } : { status: 0, tekst: "" }
    : await pobierzDoCache(BAZA + sciezka, plik, { odswiez: ODSWIEZ })
  try {
    return { status: r.status, dane: JSON.parse(r.tekst) }
  } catch {
    if (fs.existsSync(plik) && !r.tekst.trim().startsWith("[") && !r.tekst.trim().startsWith("{")) fs.rmSync(plik)
    return { status: r.status, dane: null }
  }
}

async function main() {
  fs.mkdirSync(HTML_DIR, { recursive: true })

  // 1. Sitemap
  const sitemap = await pobierzDoCache(BAZA + "/sitemap-firmy.xml", path.join(TMP, "sitemap-firmy.xml"), {
    odswiez: ODSWIEZ && !BEZ_SIECI,
  })
  const lastmody = wpisySitemapy(sitemap.tekst)
  const slugi = [...new Set(lastmody.map((w) => w.slug))]
  console.log(`sitemap: ${slugi.length} profili`)

  // 2. Publiczne API
  const api = await pobierzJson("/api/companies", path.join(TMP, "api-companies.json"))
  const stats = await pobierzJson("/api/stats", path.join(TMP, "api-stats.json"))
  const lista = await pobierzJson("/companies/lista.json", path.join(TMP, "lista.json"))
  console.log(
    `api/companies: ${Array.isArray(api.dane) ? api.dane.length : "brak"}, api/stats total: ${stats.dane?.total ?? "brak"}, lista.json: ${lista.dane ? "jest" : "brak (nie wdrożone)"}`,
  )

  // 3. Profile
  let pobrane = 0
  const wynikiProfili = await pula(
    slugi,
    async (slug) => {
      const plik = plikSlugu(slug)
      if (BEZ_SIECI || (!ODSWIEZ && fs.existsSync(plik))) {
        if (!fs.existsSync(plik)) return { slug, blad: "brak w cache" }
        return { slug, zCache: true, ...parsujProfil(fs.readFileSync(plik, "utf8")) }
      }
      const r = await pobierz(`${BAZA}/firma/${encodeURIComponent(slug)}`)
      pobrane++
      if (r.status !== 200) return { slug, blad: `HTTP ${r.status}` }
      fs.writeFileSync(plik, r.tekst)
      return { slug, ...parsujProfil(r.tekst) }
    },
    {
      rownolegle: 3,
      postep: (n, z) => console.log(`  profile: ${n}/${z} (pobrane z sieci: ${pobrane})`),
    },
  )
  for (const p of wynikiProfili) if (p) delete p.zCache
  const firmy = wynikiProfili.filter((p) => p && p.firma)
  const bledy = wynikiProfili.filter((p) => !p || !p.firma)
  console.log(`profile sparsowane: ${firmy.length}, błędy: ${bledy.length}`)
  fs.writeFileSync(path.join(TMP, "firmy.json"), JSON.stringify(firmy, null, 1))

  // 4. Logo: sprawdzamy na żywej stronie tylko te pliki, których nie ma lokalnie w public/logos.
  const logaLokalne = new Set(fs.existsSync(path.join(ROOT, "public/logos")) ? fs.readdirSync(path.join(ROOT, "public/logos")) : [])
  const cacheLogo = path.join(TMP, "logo-status.json")
  const statusLogo = fs.existsSync(cacheLogo) && !ODSWIEZ ? JSON.parse(fs.readFileSync(cacheLogo, "utf8")) : {}
  const doSprawdzenia = []
  for (const f of firmy) {
    const kandydaci = kandydaciLogo(f)
    const lokalny = kandydaci.find((k) => logaLokalne.has(k.replace(/^\/logos\//, "")))
    if (lokalny) {
      statusLogo[lokalny] = 200
      continue
    }
    // Brak w repo (np. logo wgrane tylko na produkcję): pytamy żywą stronę o wszystkie kandydaty.
    if (kandydaci.some((k) => statusLogo[k] === 200)) continue
    for (const k of kandydaci) if (!(k in statusLogo)) doSprawdzenia.push(k)
  }
  const unikalne = [...new Set(doSprawdzenia)]
  if (!BEZ_SIECI && unikalne.length) {
    console.log(`logo: sprawdzam na stronie ${unikalne.length} plików spoza repo`)
    const st = await pula(unikalne, async (k) => (await pobierz(BAZA + encodeURI(k), { metoda: "HEAD" })).status)
    unikalne.forEach((k, i) => (statusLogo[k] = typeof st[i] === "number" ? st[i] : 0))
    fs.writeFileSync(cacheLogo, JSON.stringify(statusLogo, null, 1))
  }

  // 5. Analiza i raport
  const wyniki = analizuj({ firmy, bledy, api: api.dane, stats: stats.dane, lista: lista.dane, slugi, lastmody, statusLogo, kandydaciLogo })
  fs.writeFileSync(path.join(TMP, "wyniki.json"), JSON.stringify(wyniki, null, 1))
  zapiszRaport(wyniki, path.join(TMP, "raport.md"))
  zapiszSql(wyniki, path.join(TMP, "poprawki-wlasciciele.sql"), { czyOgolny })
  console.log("gotowe:", path.relative(ROOT, TMP))
  for (const [k, v] of Object.entries(wyniki.podsumowanie)) console.log(`  ${k}: ${v}`)
}

/** Te same kandydaty co components/company-logo.tsx (bez Brandfetch). */
export function kandydaciLogo(f) {
  const lista = []
  const rozszerzenia = ["png", "svg", "jpg", "jpeg", "webp"]
  if (f.logoSrc && f.logoSrc.startsWith("/logos/")) {
    lista.push(f.logoSrc)
    // SSR pokazuje pierwszego kandydata (.png); komponent próbuje potem kolejnych rozszerzeń tej samej domeny.
    const m = /^\/logos\/(.+)\.(png|svg|jpe?g|webp)$/.exec(f.logoSrc)
    if (m && !m[1].includes("~")) for (const ext of rozszerzenia) lista.push(`/logos/${m[1]}.${ext}`)
  }
  const domena = domenaZUrl(f.firma?.website_url)
  if (domena) for (const ext of rozszerzenia) lista.push(`/logos/${domena}.${ext}`)
  return [...new Set(lista)]
}

export function domenaZUrl(url) {
  if (!url) return null
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
