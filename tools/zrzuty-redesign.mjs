// Zrzuty ekranu stron z serwera deweloperskiego (desktop 1280 i telefon 375, jasny
// i opcjonalnie ciemny motyw). Używane przy wdrażaniu systemu „Półka”.
// Użycie: node tools/zrzuty-redesign.mjs [baseUrl] [ścieżka ...] [--dark] [--out=katalog]
// Przykład: node tools/zrzuty-redesign.mjs http://localhost:3001 /firma/zabka / --dark
import puppeteer from "puppeteer"
import path from "path"
import fs from "fs"
import os from "os"

const args = process.argv.slice(2)
const dark = args.includes("--dark")
const outArg = args.find((a) => a.startsWith("--out="))
const rest = args.filter((a) => !a.startsWith("--"))
const base = rest[0] || "http://localhost:3001"
const paths = rest.slice(1).length ? rest.slice(1) : ["/"]
const out = outArg ? outArg.slice(6) : path.join(os.tmpdir(), "cpf-zrzuty")
fs.mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({ headless: true })
try {
  for (const p of paths) {
    const slug = p === "/" ? "home" : p.replace(/^\//, "").replace(/[\/?=&]/g, "_")
    const modes = dark ? ["light", "dark"] : ["light"]
    for (const mode of modes) {
      for (const [label, width] of [["desktop", 1280], ["mobile", 375]]) {
        const page = await browser.newPage()
        await page.setViewport({ width, height: 900, deviceScaleFactor: 1 })
        await page.goto(base + p, { waitUntil: "load", timeout: 180000 })
        if (mode === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"))
        // obrazki „lazy” ładuj od razu (zrzut całej strony), potem zamknij baner cookies
        await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager")))
        await new Promise((r) => setTimeout(r, 1500))
        await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => /Tylko niezbędne/i.test(x.textContent || ""))
          if (b) b.click()
        })
        await page.evaluate(() => document.fonts.ready)
        await new Promise((r) => setTimeout(r, 2500))
        const file = path.join(out, `${slug}-${label}${mode === "dark" ? "-dark" : ""}.png`)
        await page.screenshot({ path: file, fullPage: true })
        const info = await page.evaluate(() => ({
          h: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        }))
        console.log(`${slug} ${label}${mode === "dark" ? " dark" : ""}: ${width}x${info.h}${info.overflow ? "  !!! POZIOMY SCROLL" : ""} -> ${file}`)
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
}
