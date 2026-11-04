// Grzeczne pobieranie danych z żywej strony czypolskafirma.pl.
// Maks. 3 równoległe zapytania, krótka pauza między zapytaniami, własny User-Agent,
// cache na dysku w .tmp/audyt-danych/ (powtórne uruchomienie nie pobiera drugi raz).

import fs from "fs"
import path from "path"

export const BAZA = process.env.AUDYT_BAZA_URL || "https://czypolskafirma.pl"
export const USER_AGENT = "audyt-danych.mjs (czypolskafirma.pl, audyt jakosci danych; tools/audyt-danych)"
const ROWNOLEGLE = 3
const PAUZA_MS = 250
const PROBY = 3

const spij = (ms) => new Promise((r) => setTimeout(r, ms))

export async function pobierz(url, { metoda = "GET" } = {}) {
  let ostatniBlad
  for (let proba = 1; proba <= PROBY; proba++) {
    try {
      const res = await fetch(url, {
        method: metoda,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
        redirect: "follow",
      })
      if (res.status === 429 || res.status >= 500) {
        ostatniBlad = new Error(`HTTP ${res.status}`)
        await spij(2000 * proba)
        continue
      }
      const tekst = metoda === "HEAD" ? "" : await res.text()
      return { status: res.status, tekst, typ: res.headers.get("content-type") || "", url: res.url }
    } catch (e) {
      ostatniBlad = e
      await spij(1000 * proba)
    }
  }
  throw ostatniBlad
}

/** Pula zadań z limitem równoległości i pauzą po każdym zapytaniu. */
export async function pula(elementy, zadanie, { rownolegle = ROWNOLEGLE, postep } = {}) {
  const wyniki = new Array(elementy.length)
  let nastepny = 0
  let gotowe = 0
  async function pracownik() {
    while (nastepny < elementy.length) {
      const i = nastepny++
      try {
        wyniki[i] = await zadanie(elementy[i], i)
      } catch (e) {
        wyniki[i] = { blad: String(e?.message || e) }
      }
      gotowe++
      if (postep && gotowe % 50 === 0) postep(gotowe, elementy.length)
      // Pauza tylko po prawdziwym zapytaniu; odczyt z cache jej nie potrzebuje.
      if (!wyniki[i]?.zCache) await spij(PAUZA_MS)
    }
  }
  await Promise.all(Array.from({ length: Math.min(rownolegle, elementy.length) }, pracownik))
  return wyniki
}

/** Pobiera URL do pliku cache, chyba że plik już jest (i nie wymuszono odświeżenia). */
export async function pobierzDoCache(url, plik, { odswiez = false } = {}) {
  if (!odswiez && fs.existsSync(plik)) return { status: 200, tekst: fs.readFileSync(plik, "utf8"), zCache: true }
  const r = await pobierz(url)
  if (r.status === 200) {
    fs.mkdirSync(path.dirname(plik), { recursive: true })
    fs.writeFileSync(plik, r.tekst)
  }
  return r
}

/** Wpisy sitemapy: [{ slug, lastmod }]. */
export function wpisySitemapy(xml) {
  const wpisy = []
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(m[1])?.[1]?.trim() || ""
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(m[1])?.[1]?.trim() || ""
    const i = loc.indexOf("/firma/")
    if (i >= 0) wpisy.push({ slug: decodeURIComponent(loc.slice(i + 7).replace(/\/$/, "")), lastmod })
  }
  return wpisy
}
