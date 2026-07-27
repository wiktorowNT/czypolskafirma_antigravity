#!/usr/bin/env node
// Generuje okładkę wpisu blogowego (1200x630 PNG) z szablonu tools/okladka-szablon.html.
// Okładka trafia do public/images/blog/[slug].png i służy jako og:image, czyli obrazek
// widoczny przy udostępnianiu wpisu na Facebooku i X.
//
// Użycie:
//   node tools/okladka-wpisu.mjs dane.json
//   echo '{...}' | node tools/okladka-wpisu.mjs -
//
// Format danych:
// {
//   "slug": "kto-jest-wlascicielem-biedronki",
//   "tytul": "Kto jest właścicielem Biedronki",
//   "akcent": "Biedronki",              // opcjonalnie: fragment tytułu na czerwono
//   "podtytul": "Portugalski właściciel, polska sieć",
//   "staty": [                          // 2 albo 3 pozycje
//     { "wartosc": "25,3 mld €", "opis": "sprzedaż sieci w 2025" }
//   ]
// }

import fs from "fs"
import path from "path"
import puppeteer from "puppeteer"

const ROOT = process.cwd()
const SZABLON = path.join(ROOT, "tools", "okladka-szablon.html")
const KATALOG_WYJSCIA = path.join(ROOT, "public", "images", "blog")

function bladKrytyczny(komunikat) {
  console.error(`okladka-wpisu: ${komunikat}`)
  process.exit(1)
}

function wczytajDane() {
  const arg = process.argv[2]
  if (!arg) bladKrytyczny("podaj plik JSON z danymi okładki (albo „-” dla stdin).")
  const raw = arg === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(arg, "utf8")
  try {
    return JSON.parse(raw)
  } catch (err) {
    bladKrytyczny(`niepoprawny JSON: ${err.message}`)
  }
}

function escapeHtml(tekst) {
  return String(tekst)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Zaznacza fragment tytułu na czerwono. Dopasowanie dokładne, bez regexów po treści. */
function tytulZAkcentem(tytul, akcent) {
  const bezpiecznyTytul = escapeHtml(tytul)
  if (!akcent) return bezpiecznyTytul

  const bezpiecznyAkcent = escapeHtml(akcent)
  if (!bezpiecznyTytul.includes(bezpiecznyAkcent)) {
    console.warn(`okladka-wpisu: fragment „${akcent}” nie występuje w tytule, pomijam akcent.`)
    return bezpiecznyTytul
  }
  return bezpiecznyTytul.replace(bezpiecznyAkcent, `<span class="akcent">${bezpiecznyAkcent}</span>`)
}

function klasaDlugosci(tytul) {
  if (tytul.length > 62) return "bardzo-dlugi"
  if (tytul.length > 44) return "dlugi"
  return ""
}

function htmlStatystyk(staty) {
  if (!Array.isArray(staty) || staty.length === 0) return ""
  return staty
    .slice(0, 3)
    .map(
      (s) => `<div class="stat">
      <div class="stat-wartosc">${escapeHtml(s.wartosc)}</div>
      <div class="stat-opis">${escapeHtml(s.opis)}</div>
    </div>`,
    )
    .join("\n    ")
}

async function main() {
  const dane = wczytajDane()

  for (const pole of ["slug", "tytul", "podtytul"]) {
    if (!dane[pole]) bladKrytyczny(`brak wymaganego pola „${pole}”.`)
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dane.slug)) {
    bladKrytyczny(`slug „${dane.slug}” nie jest kanoniczny.`)
  }
  if (!fs.existsSync(SZABLON)) bladKrytyczny(`brak szablonu ${SZABLON}.`)

  const html = fs
    .readFileSync(SZABLON, "utf8")
    .replace("{{KLASA_DLUGOSCI}}", klasaDlugosci(dane.tytul))
    .replace("{{TYTUL}}", tytulZAkcentem(dane.tytul, dane.akcent))
    .replace("{{PODTYTUL}}", escapeHtml(dane.podtytul))
    .replace("{{STATY}}", htmlStatystyk(dane.staty))

  fs.mkdirSync(KATALOG_WYJSCIA, { recursive: true })
  const plikHtml = path.join(KATALOG_WYJSCIA, `.${dane.slug}.tmp.html`)
  const plikPng = path.join(KATALOG_WYJSCIA, `${dane.slug}.png`)
  fs.writeFileSync(plikHtml, html, "utf8")

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
    await page.goto("file://" + plikHtml.replace(/\\/g, "/"), { waitUntil: "networkidle0" })
    // Bez tego screenshot potrafi złapać moment przed podmianą fontu na Gelasio.
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: plikPng, type: "png" })
  } finally {
    await browser.close()
    fs.rmSync(plikHtml, { force: true })
  }

  const relatywna = `/images/blog/${dane.slug}.png`
  console.log(`okladka-wpisu: zapisano public${relatywna}`)
  console.log("Do frontmattera wpisu:")
  console.log(`image: "${relatywna}"`)
  console.log(`imageAlt: "${dane.tytul}"`)
}

main().catch((err) => bladKrytyczny(err.message))
