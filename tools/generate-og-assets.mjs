/**
 * Generator zasobów dla dynamicznych kart OG (opengraph-image).
 *
 * Karty OG renderuje Satori (next/og), które **nie potrafi zdekodować WebP**
 * i nie dostaje SVG z naszego katalogu logotypów. Bez tego skryptu ~30% profili
 * firm generowało kartę z pustym miejscem po logo.
 *
 * Skrypt przygotowuje trzy rzeczy:
 *   1. fonts  — podzbiór Inter (500 + 800) w formacie TTF → assets/og/
 *   2. flags  — flagi państw jako PNG → public/flags/ (bez fetchowania flagcdn
 *               przy każdym renderze karty)
 *   3. logos  — kopie PNG logotypów zapisanych jako .webp/.svg → public/logos-og/
 *               (oryginały w public/logos/ pozostają nietknięte)
 *
 * Użycie:
 *   node tools/generate-og-assets.mjs            # wszystko, pomija istniejące pliki
 *   node tools/generate-og-assets.mjs logos      # tylko wybrany krok
 *   node tools/generate-og-assets.mjs --force    # nadpisz istniejące pliki
 */

import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const ROOT = path.resolve(import.meta.dirname, "..")
const FONT_DIR = path.join(ROOT, "assets", "og")
const FLAG_DIR = path.join(ROOT, "public", "flags")
const LOGO_DIR = path.join(ROOT, "public", "logos")
const LOGO_OG_DIR = path.join(ROOT, "public", "logos-og")

const args = process.argv.slice(2)
const FORCE = args.includes("--force")
const steps = args.filter((a) => !a.startsWith("--"))
const shouldRun = (name) => steps.length === 0 || steps.includes(name)

// Stara przeglądarka w User-Agent — dzięki temu Google Fonts serwuje TTF
// (Satori nie obsługuje woff2, które dostaje nowoczesny UA).
const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27"

// Zakres znaków w podzbiorze fontu: ASCII + Latin-1 Supplement + Latin Extended-A.
// Pokrywa polskie znaki oraz diakrytykę nazw obcych marek (Nestlé, Müller, Škoda).
function buildCharset() {
  const ranges = [
    [0x20, 0x7e],
    [0xa0, 0xff],
    [0x100, 0x17f],
    [0x2013, 0x2014], // – —
    [0x2018, 0x201d], // ' ' " "
    [0x20ac, 0x20ac], // €
  ]
  let out = ""
  for (const [from, to] of ranges) {
    for (let cp = from; cp <= to; cp++) out += String.fromCodePoint(cp)
  }
  return out
}

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function generateFonts() {
  await fs.mkdir(FONT_DIR, { recursive: true })
  const charset = buildCharset()

  for (const weight of [500, 800]) {
    const target = path.join(FONT_DIR, `inter-${weight}.ttf`)
    if (!FORCE && (await exists(target))) {
      console.log(`  = inter-${weight}.ttf (istnieje)`)
      continue
    }

    const cssUrl =
      `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}` +
      `&text=${encodeURIComponent(charset)}`
    const cssRes = await fetch(cssUrl, { headers: { "User-Agent": LEGACY_UA } })
    if (!cssRes.ok) throw new Error(`Google Fonts CSS ${cssRes.status} dla wagi ${weight}`)
    const css = await cssRes.text()

    // Podzbiory Google Fonts serwuje spod /l/font?kit=… — bez rozszerzenia
    // w URL-u, więc format rozpoznajemy po deklaracji format('truetype').
    const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)\s*format\('truetype'\)/)
    if (!match) throw new Error(`Brak URL-a TTF w CSS dla wagi ${weight}`)

    const fontRes = await fetch(match[1])
    if (!fontRes.ok) throw new Error(`Pobranie TTF ${fontRes.status} dla wagi ${weight}`)
    const buf = Buffer.from(await fontRes.arrayBuffer())
    await fs.writeFile(target, buf)
    console.log(`  + inter-${weight}.ttf (${(buf.length / 1024).toFixed(1)} kB)`)
  }
}

// Kody państw czytamy z lib/countries.ts, żeby lista flag nie rozjechała się
// z mapą nazw używaną na stronie.
async function readCountryCodes() {
  const src = await fs.readFile(path.join(ROOT, "lib", "countries.ts"), "utf8")
  const block = src.match(/export const countryNames[^{]*\{([\s\S]*?)\n\}/)
  if (!block) throw new Error("Nie znaleziono countryNames w lib/countries.ts")
  return [...block[1].matchAll(/"([A-Z]{2})"\s*:/g)].map((m) => m[1])
}

async function generateFlags() {
  await fs.mkdir(FLAG_DIR, { recursive: true })
  const codes = await readCountryCodes()

  for (const code of codes) {
    const target = path.join(FLAG_DIR, `${code.toLowerCase()}.png`)
    if (!FORCE && (await exists(target))) continue

    // flagcdn używa gb zamiast uk
    const cdnCode = code.toLowerCase() === "uk" ? "gb" : code.toLowerCase()
    const res = await fetch(`https://flagcdn.com/w160/${cdnCode}.png`)
    if (!res.ok) {
      console.warn(`  ! flaga ${code}: HTTP ${res.status}`)
      continue
    }
    await fs.writeFile(target, Buffer.from(await res.arrayBuffer()))
    console.log(`  + ${code.toLowerCase()}.png`)
  }
  console.log(`  ${codes.length} kodów państw sprawdzonych`)
}

// Logotypy eksportowane z Illustratora niosą pseudo-przestrzenie nazw
// (xmlns:x="ns_extend;") i blok <metadata>, na których librsvg się wykłada.
// Czyścimy je w pamięci — plik źródłowy zostaje bez zmian.
async function sanitizeSvg(file) {
  const raw = await fs.readFile(file, "utf8")
  if (!raw.trimStart().startsWith("<")) throw new Error("plik nie jest SVG")
  const cleaned = raw
    .replace(/\sxmlns:[a-zA-Z0-9_-]+="ns_[^"]*"/g, "")
    .replace(/<metadata>[\s\S]*?<\/metadata>/gi, "")
  return Buffer.from(cleaned, "utf8")
}

async function generateLogos() {
  await fs.mkdir(LOGO_OG_DIR, { recursive: true })
  const files = await fs.readdir(LOGO_DIR)

  // Nazwa pliku to domena z rozszerzeniem (np. onet.pl.webp) — bazą jest
  // wszystko przed ostatnią kropką.
  const byDomain = new Map()
  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const domain = file.slice(0, -ext.length)
    if (!byDomain.has(domain)) byDomain.set(domain, [])
    byDomain.get(domain).push(ext)
  }

  const RASTER_OK = [".png", ".jpg", ".jpeg"]
  const CONVERTIBLE = [".webp", ".svg"]
  let converted = 0
  let skipped = 0
  let failed = 0

  for (const [domain, exts] of byDomain) {
    // Satori poradzi sobie z oryginałem — nie ma czego konwertować.
    if (exts.some((e) => RASTER_OK.includes(e))) {
      skipped++
      continue
    }
    const source = CONVERTIBLE.find((e) => exts.includes(e))
    if (!source) {
      skipped++
      continue
    }

    const target = path.join(LOGO_OG_DIR, `${domain}.png`)
    if (!FORCE && (await exists(target))) {
      converted++
      continue
    }

    try {
      const sourcePath = path.join(LOGO_DIR, `${domain}${source}`)
      const data = source === ".svg" ? await sanitizeSvg(sourcePath) : sourcePath

      // 400 px to dwukrotność kafelka na karcie (200 px) — zapas na retinę,
      // bez powiększania mniejszych źródeł. `fit: inside` zachowuje proporcje.
      const input = sharp(data, { density: 384 })
      await input
        .resize(400, 400, { fit: "inside", withoutEnlargement: source !== ".svg" })
        .png()
        .toFile(target)
      converted++
    } catch (err) {
      console.warn(`  ! ${domain}${source}: ${err.message}`)
      failed++
    }
  }

  console.log(`  ${converted} logotypów w public/logos-og/, ${skipped} bez zmian, ${failed} błędów`)
}

if (shouldRun("fonts")) {
  console.log("Fonty (Inter → assets/og/):")
  await generateFonts()
}
if (shouldRun("flags")) {
  console.log("Flagi (→ public/flags/):")
  await generateFlags()
}
if (shouldRun("logos")) {
  console.log("Logotypy webp/svg → PNG (→ public/logos-og/):")
  await generateLogos()
}
console.log("Gotowe.")
