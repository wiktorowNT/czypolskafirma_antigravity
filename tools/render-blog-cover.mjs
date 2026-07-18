// Renderuje plik HTML (1200x630) do PNG — cover / og:image dla wpisu blogowego.
// Użycie: node tools/render-blog-cover.mjs <plik.html> <wyjście.png>
import puppeteer from "puppeteer"
import path from "path"

const [htmlPath, outPath] = process.argv.slice(2)
if (!htmlPath || !outPath) {
  console.error("Użycie: node tools/render-blog-cover.mjs <plik.html> <wyjście.png>")
  process.exit(1)
}

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.goto("file://" + path.resolve(htmlPath).replace(/\\/g, "/"))
await page.screenshot({ path: outPath, type: "png" })
await browser.close()
console.log("Zapisano:", outPath)
