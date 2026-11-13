// Build strony pod Cloudflare Workers (darmowy plan: 10 ms procesora na żądanie).
//
// Wszystko, co kosztuje procesor, powstaje tutaj, a nie na żądanie:
//   1. vite build z PRERENDER_FIRMY=1 — profile firm i strony kategorii jako gotowe pliki,
//   2. lokalny podgląd zbudowanego Workera (vite preview),
//   3. z podglądu pobieramy karty OG (ok. 0,3–0,5 s procesora każda), sitemapy i HTML
//      ciężkich stron (/companies),
//      i zapisujemy je do katalogu plików statycznych pod TYMI SAMYMI adresami.
//      cloudflare.config.ts (runWorkerFirst) sprawia, że te adresy omijają Workera.
//
// Użycie:  node tools/cloudflare/build.mjs            (sam build)
//          node tools/cloudflare/build.mjs --deploy   (build + wdrożenie)
// Wymaga Node 22.18+.

import { spawn } from "node:child_process"
import { mkdir, writeFile, appendFile, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const ASSETS = path.join(ROOT, ".cloudflare", "output", "v0", "workers", "default", "assets")
const PORT = 4179
const LOCAL = `http://localhost:${PORT}`
const CONCURRENCY = 12
const SITEMAPS = ["sitemap.xml", "sitemap-strony.xml", "sitemap-firmy.xml", "sitemap-kategorie.xml", "sitemap-blog.xml"]

// CF_BEZ_PLIKOW_Z_BUILDA: na czas builda karty OG i sitemapy liczy Worker (cloudflare.config.ts);
// po zapisaniu plików dopisujemy reguły omijania Workera do gotowej konfiguracji.
// NEXT_PUBLIC_OG_BASE_URL: karty OG pobierają logotypy z lokalnego podglądu (lib/og-assets.ts).
const env = { ...process.env, PRERENDER_FIRMY: "1", CF_BEZ_PLIKOW_Z_BUILDA: "1", NEXT_PUBLIC_OG_BASE_URL: LOCAL }
const WORKER_CONFIG = path.join(ROOT, ".cloudflare", "output", "v0", "workers", "default", "worker.config.json")
const GENEROWANE_PRZY_BUILDZIE = ["!/opengraph-image", "!/firma/*/opengraph-image", "!/sitemap.xml", "!/sitemap-*.xml", "!/robots.txt"]

function run(args, { background = false } = {}) {
  const child = spawn(process.execPath, args, { cwd: ROOT, env, stdio: background ? "ignore" : "inherit" })
  if (background) return child
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${args.join(" ")} — kod ${code}`))))
  })
}

async function waitForServer() {
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(`${LOCAL}/`)
      if (res.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error("Podgląd Workera nie wystartował w 90 s")
}

async function save(urlPath, expectedType, target = urlPath) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${LOCAL}${urlPath}`)
      const type = res.headers.get("content-type") || ""
      if (!res.ok || !type.includes(expectedType)) throw new Error(`HTTP ${res.status} (${type})`)
      const file = path.join(ASSETS, ...target.split("/").filter(Boolean))
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, Buffer.from(await res.arrayBuffer()))
      return true
    } catch (err) {
      if (attempt === 3) {
        console.error(`  ✗ ${urlPath}: ${err.message}`)
        return false
      }
    }
  }
}

async function pool(items, worker) {
  let next = 0
  let failed = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const item = items[next++]
        if (!(await worker(item))) failed++
        if (next % 200 === 0) console.log(`  ${next} / ${items.length}`)
      }
    }),
  )
  return failed
}

console.log("▸ 1/3 Build (vite build, profile firm i kategorie jako gotowe pliki)")
await run([path.join(ROOT, "node_modules", "vite", "bin", "vite.js"), "build"])

console.log("▸ 2/3 Karty OG i sitemapy z lokalnego podglądu")
const preview = run(
  [path.join(ROOT, "node_modules", "vite", "bin", "vite.js"), "preview", "--port", String(PORT), "--strictPort"],
  { background: true },
)
let failed = 0
try {
  await waitForServer()

  for (const name of SITEMAPS) if (!(await save(`/${name}`, "xml"))) failed++
  if (!(await save("/robots.txt", "text/plain"))) failed++

  const firmy = await (await fetch(`${LOCAL}/sitemap-firmy.xml`)).text()
  const slugs = [...firmy.matchAll(/\/firma\/([^<]+)<\/loc>/g)].map((m) => m[1])
  if (slugs.length === 0) throw new Error("Sitemapa firm jest pusta — przerywam, żeby nie wdrożyć strony bez firm")
  console.log(`  ${slugs.length} kart OG firm`)

  if (!(await save("/opengraph-image", "image/png"))) failed++

  // Strony za ciężkie na limit procesora: gotowy HTML, który worker/index.ts oddaje
  // bez renderowania (STRONY_Z_BUILDA).
  if (!(await save("/companies", "text/html", "/_statyczne/companies.html"))) failed++
  failed += await pool(slugs, (slug) => save(`/firma/${slug}/opengraph-image`, "image/png"))
} finally {
  preview.kill()
}

// Karty OG nie mają rozszerzenia w adresie, więc typ pliku podajemy wprost.
await appendFile(
  path.join(ASSETS, "_headers"),
  [
    "",
    "# Karty OG i sitemapy wygenerowane przy buildzie (tools/cloudflare/build.mjs)",
    "/opengraph-image",
    "  Content-Type: image/png",
    "  Cache-Control: public, max-age=3600",
    "/firma/*/opengraph-image",
    "  Content-Type: image/png",
    "  Cache-Control: public, max-age=3600",
    "/sitemap*.xml",
    "  Content-Type: application/xml; charset=utf-8",
    "  Cache-Control: public, max-age=3600",
    "",
  ].join("\n"),
)

if (failed > 0) {
  console.error(`✗ Nie udało się zapisać ${failed} plików — przerywam.`)
  process.exit(1)
}

const workerConfig = JSON.parse(await readFile(WORKER_CONFIG, "utf8"))
workerConfig.assets.runWorkerFirst = [
  ...workerConfig.assets.runWorkerFirst.filter((rule) => !GENEROWANE_PRZY_BUILDZIE.includes(rule)),
  ...GENEROWANE_PRZY_BUILDZIE,
]
await writeFile(WORKER_CONFIG, JSON.stringify(workerConfig))

if (process.argv.includes("--deploy")) {
  console.log("▸ 3/3 Wdrożenie na Cloudflare")
  await run([path.join(ROOT, "node_modules", "@vinext", "cloudflare", "dist", "cli.js"), "deploy", "--skip-build"])
} else {
  console.log("▸ 3/3 Pominięte (bez --deploy). Wdrożenie: node tools/cloudflare/build.mjs --deploy")
}
