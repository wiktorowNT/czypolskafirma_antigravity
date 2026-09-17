// Renderuje makiety z docs/design/kierunki do PNG (desktop 1280 px i mobile 375 px, pełna
// wysokość). Wynik: docs/design/kierunki/zrzuty/<nazwa>-<desktop|mobile>.png
// Użycie z katalogu repo: node tools/render-makiety.mjs [nazwa-pliku-bez-html ...]
import puppeteer from "puppeteer"
import path from "path"
import fs from "fs"
import { pathToFileURL } from "url"

const dir = path.join(process.cwd(), "docs", "design", "kierunki")
const out = path.join(dir, "zrzuty")
fs.mkdirSync(out, { recursive: true })

const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(dir).filter((f) => f.endsWith(".html") && f !== "index.html").map((f) => f.replace(/\.html$/, ""))

const browser = await puppeteer.launch({ headless: true })
try {
  for (const name of names) {
    const url = pathToFileURL(path.join(dir, `${name}.html`)).href
    for (const [label, width, height] of [["desktop", 1280, 800], ["mobile", 375, 812]]) {
      const page = await browser.newPage()
      await page.setViewport({ width, height, deviceScaleFactor: 1 })
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 })
      await page.evaluate(() => document.fonts.ready)
      await new Promise((r) => setTimeout(r, 400))
      await page.screenshot({ path: path.join(out, `${name}-${label}.png`), fullPage: true })
      const h = await page.evaluate(() => document.documentElement.scrollHeight)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      console.log(`${name} ${label}: ${width}x${h}${overflow ? "  !!! POZIOMY SCROLL" : ""}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
}
