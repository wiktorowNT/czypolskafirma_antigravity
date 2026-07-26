#!/usr/bin/env node
// Lint treści przed publikacją: sprawdza wpisy blogowe (content/blog/*.md) oraz
// pliki newsowe z wersjami na X i Facebooka (docs/social/newsy/news-*.md).
//
// Wyłapuje rzeczy, które da się sprawdzić deterministycznie: em-dashe, zwroty
// zdradzające AI, "my" i odwołania do metodologii we wpisie blogowym, zły
// frontmatter, duplikaty slugów, brak sekcji Źródła, złe długości, brak UTM-ów.
// Nie ocenia jakości merytorycznej — od tego jest człowiek i sekcja Weryfikacja.
//
// Użycie:
//   node tools/lint-tresci.mjs                 # pliki zmienione względem HEAD
//   node tools/lint-tresci.mjs plik1.md ...    # konkretne pliki
//
// Kod wyjścia: 1 gdy jest choć jeden BŁĄD, 0 gdy są tylko ostrzeżenia.

import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const ROOT = process.cwd()

// ---------------------------------------------------------------- reguły ---

/** Znaki, których nie chcemy w treści do publikacji (najsilniejszy sygnał AI). */
const ZAKAZANE_ZNAKI = [
  { znak: "—", nazwa: "em-dash („—”)" },
  { znak: "–", nazwa: "en-dash („–”)" },
]

/** Zwroty-wypełniacze, po których widać generatywny tekst. */
const ZAKAZANE_FRAZY = [
  "co ciekawe",
  "warto wiedzieć",
  "warto zauważyć",
  "warto podkreślić",
  "warto dodać",
  "należy pamiętać",
  "nie od dziś wiadomo",
  "w dzisiejszych czasach",
  "w dobie",
  "niezwykle istotne",
  "kluczowe znaczenie ma",
  "jak grzyby po deszczu",
  "reasumując",
  "w niniejszym",
  "a jednak",
]

/** Wpis blogowy mówi faktami: bez „my” i bez cytowania własnej metodologii. */
const ZAKAZANE_NA_BLOGU = [
  "naszej metodologi",
  "nasza metodologi",
  "naszą metodologi",
  "naszej bazie",
  "naszej stronie",
  "naszym serwisie",
  "nasz serwis",
  "u nas w bazie",
  "według naszej",
  "zgodnie z zasadą",
  "zasadą ostatecznego",
  "zasadą efektywnej",
  "zasadą złotej",
  "zasada ostatecznego",
  "zasada efektywnej",
  "zasada złotej",
  "opisujemy",
  "klasyfikujemy",
  "stosujemy zasadę",
]

const BLOG_MIN_SLOW = 450
const BLOG_MAX_SLOW = 1100
const X_MIN_ZNAKOW = 800
const X_MAX_ZNAKOW = 2500
const FB_MIN_ZNAKOW = 400
const FB_MAX_ZNAKOW = 1600
const X_HOOK_MAX_ZNAKOW = 300 // pierwszy akapit musi zadziałać przed „Pokaż więcej”

// ------------------------------------------------------------- narzędzia ---

const problemy = []

function bland(plik, linia, komunikat) {
  problemy.push({ waga: "BŁĄD", plik, linia, komunikat })
}

function ostrzezenie(plik, linia, komunikat) {
  problemy.push({ waga: "OSTRZEŻENIE", plik, linia, komunikat })
}

/** Numer linii (1-indeksowany) dla pozycji znakowej w tekście. */
function liniaDla(tekst, offset) {
  return tekst.slice(0, offset).split("\n").length
}

/** Prosty parser frontmattera YAML — obsługuje pary klucz: wartość i listy „- ”. */
function parsujFrontmatter(raw) {
  const dopasowanie = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!dopasowanie) return { dane: null, tresc: raw, dlugoscNaglowka: 0 }

  const dane = {}
  let ostatniKluczListy = null

  for (const linia of dopasowanie[1].split(/\r?\n/)) {
    if (!linia.trim() || linia.trim().startsWith("#")) continue

    const pozycjaListy = linia.match(/^\s*-\s+(.*)$/)
    if (pozycjaListy && ostatniKluczListy) {
      dane[ostatniKluczListy].push(oczyscWartosc(pozycjaListy[1]))
      continue
    }

    const para = linia.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!para) continue

    const [, klucz, wartosc] = para
    if (wartosc.trim() === "") {
      dane[klucz] = []
      ostatniKluczListy = klucz
    } else {
      dane[klucz] = oczyscWartosc(wartosc)
      ostatniKluczListy = null
    }
  }

  return {
    dane,
    tresc: raw.slice(dopasowanie[0].length),
    dlugoscNaglowka: dopasowanie[0].split("\n").length,
  }
}

function oczyscWartosc(wartosc) {
  return wartosc.trim().replace(/^["']|["']$/g, "")
}

/** Wycina sekcję pliku newsowego po nagłówku ## (do kolejnego ##). */
function sekcja(tekst, naglowek) {
  const start = tekst.search(new RegExp(`^##\\s+${naglowek}`, "im"))
  if (start === -1) return null
  const reszta = tekst.slice(start)
  const koniec = reszta.slice(1).search(/^##\s+/m)
  const body = koniec === -1 ? reszta : reszta.slice(0, koniec + 1)
  return { tekst: body.replace(/^##.*\r?\n/, ""), offset: start }
}

/** Sprawdza zakazane znaki i frazy w podanym fragmencie. */
function sprawdzStyl(plik, pelnyTekst, fragment, offsetFragmentu, etykieta, listaFraz) {
  for (const { znak, nazwa } of ZAKAZANE_ZNAKI) {
    let idx = fragment.indexOf(znak)
    while (idx !== -1) {
      const linia = liniaDla(pelnyTekst, offsetFragmentu + idx)
      bland(plik, linia, `${etykieta}: ${nazwa} w treści do publikacji. Użyj kropki, przecinka lub dwukropka.`)
      idx = fragment.indexOf(znak, idx + 1)
    }
  }

  const male = fragment.toLowerCase()
  for (const fraza of listaFraz) {
    let idx = male.indexOf(fraza)
    while (idx !== -1) {
      const linia = liniaDla(pelnyTekst, offsetFragmentu + idx)
      bland(plik, linia, `${etykieta}: zakazany zwrot „${fraza}”.`)
      idx = male.indexOf(fraza, idx + 1)
    }
  }
}

function liczHashtagi(tekst) {
  return (tekst.match(/(^|\s)#[\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+/g) || []).length
}

// -------------------------------------------------------- lint: wpis blog ---

function lintBloga(plik) {
  const raw = fs.readFileSync(path.join(ROOT, plik), "utf8")
  const { dane, tresc, dlugoscNaglowka } = parsujFrontmatter(raw)
  const nazwaPliku = path.basename(plik, ".md")

  if (!dane) {
    bland(plik, 1, "Brak frontmattera (--- na początku pliku).")
    return
  }

  for (const klucz of ["title", "slug", "date", "description"]) {
    if (!dane[klucz]) bland(plik, 1, `Frontmatter: brak pola „${klucz}”.`)
  }

  if (dane.slug) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dane.slug)) {
      bland(plik, 1, `Frontmatter: slug „${dane.slug}” nie jest kanoniczny (małe litery, cyfry, myślniki, bez polskich znaków).`)
    }
    if (dane.slug !== nazwaPliku) {
      bland(plik, 1, `Frontmatter: slug „${dane.slug}” nie zgadza się z nazwą pliku „${nazwaPliku}”.`)
    }
    sprawdzDuplikatSluga(plik, dane.slug)
  }

  if (dane.title) {
    const dl = dane.title.length
    if (dl < 20 || dl > 100) bland(plik, 1, `Frontmatter: tytuł ma ${dl} znaków, powinien mieć 20-100.`)
    else if (dl > 75) ostrzezenie(plik, 1, `Frontmatter: tytuł ma ${dl} znaków, Google ucina wynik ok. 65-70 znaków.`)
    for (const { znak, nazwa } of ZAKAZANE_ZNAKI) {
      if (dane.title.includes(znak)) bland(plik, 1, `Frontmatter: ${nazwa} w tytule.`)
    }
  }

  if (dane.description) {
    const dl = dane.description.length
    if (dl > 160) bland(plik, 1, `Frontmatter: description ma ${dl} znaków, limit to 160 (meta description).`)
    if (dl < 50) ostrzezenie(plik, 1, `Frontmatter: description ma tylko ${dl} znaków, warto rozwinąć do ~120-155.`)
  }

  if (dane.date && !/^\d{4}-\d{2}-\d{2}$/.test(String(dane.date))) {
    bland(plik, 1, `Frontmatter: data „${dane.date}” nie jest w formacie RRRR-MM-DD.`)
  }

  if (dane.image) {
    if (!dane.image.startsWith("/images/blog/")) {
      bland(plik, 1, `Frontmatter: image „${dane.image}” powinien wskazywać na /images/blog/...`)
    } else if (!fs.existsSync(path.join(ROOT, "public", dane.image))) {
      bland(plik, 1, `Frontmatter: plik grafiki „public${dane.image}” nie istnieje.`)
    }
    if (!dane.imageAlt) ostrzezenie(plik, 1, "Frontmatter: jest image, brakuje imageAlt (SEO i czytniki ekranu).")
  }

  const offsetTresci = raw.length - tresc.length
  sprawdzStyl(plik, raw, tresc, offsetTresci, "Blog", [...ZAKAZANE_FRAZY, ...ZAKAZANE_NA_BLOGU])

  const slowa = tresc.replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length
  if (slowa < BLOG_MIN_SLOW || slowa > BLOG_MAX_SLOW) {
    bland(plik, dlugoscNaglowka + 1, `Wpis ma ${slowa} słów, powinien mieć ${BLOG_MIN_SLOW}-${BLOG_MAX_SLOW}.`)
  }

  const naglowki = (tresc.match(/^##\s+/gm) || []).length
  if (naglowki < 2) bland(plik, dlugoscNaglowka + 1, `Wpis ma ${naglowki} śródtytułów H2, powinny być minimum 2 (docelowo 3-4).`)

  if (!/(^|\n)[*#\s]*(\*\*)?Źródła/i.test(tresc)) {
    bland(plik, dlugoscNaglowka + 1, "Brak sekcji „Źródła” na końcu wpisu.")
  } else {
    const linki = new Set(tresc.match(/https?:\/\/[^\s)"']+/g) || [])
    if (linki.size < 2) bland(plik, dlugoscNaglowka + 1, `Sekcja Źródła ma ${linki.size} unikalnych linków, wymagane minimum 2 niezależne.`)
  }

  const akapity = tresc.split(/\n\s*\n/).filter((a) => a.trim() && !a.trim().startsWith("#") && !a.trim().startsWith("-"))
  for (const akapit of akapity) {
    const zdania = akapit.split(/(?<=[.!?])\s+/).filter(Boolean).length
    if (zdania > 6) {
      ostrzezenie(plik, liniaDla(raw, offsetTresci + tresc.indexOf(akapit)), `Akapit ma ${zdania} zdań, docelowo 2-4.`)
    }
  }
}

const slugiWBlogu = new Map()

function sprawdzDuplikatSluga(plik, slug) {
  if (slugiWBlogu.size === 0) {
    const katalog = path.join(ROOT, "content", "blog")
    if (!fs.existsSync(katalog)) return
    for (const nazwa of fs.readdirSync(katalog)) {
      if (!nazwa.endsWith(".md") || nazwa.startsWith("_")) continue
      const sciezka = `content/blog/${nazwa}`
      const { dane } = parsujFrontmatter(fs.readFileSync(path.join(katalog, nazwa), "utf8"))
      const s = dane?.slug || path.basename(nazwa, ".md")
      if (!slugiWBlogu.has(s)) slugiWBlogu.set(s, [])
      slugiWBlogu.get(s).push(sciezka)
    }
  }
  const pliki = slugiWBlogu.get(slug) || []
  if (pliki.length > 1) {
    bland(plik, 1, `Slug „${slug}” występuje w kilku plikach: ${pliki.join(", ")}.`)
  }
}

// -------------------------------------------------------- lint: plik news ---

function lintNewsa(plik) {
  const raw = fs.readFileSync(path.join(ROOT, plik), "utf8")

  const wpisX = sekcja(raw, "Długi wpis X.*")
  const wpisFB = sekcja(raw, "Wersja FB.*")
  const weryfikacja = sekcja(raw, "Weryfikacja.*")

  if (!wpisX) bland(plik, 1, "Brak sekcji „## Długi wpis X”.")
  if (!wpisFB) bland(plik, 1, "Brak sekcji „## Wersja FB”.")
  if (!weryfikacja) bland(plik, 1, "Brak sekcji „## Weryfikacja”.")

  if (wpisX) {
    // Pierwszy komentarz pod wpisem jest osobnym tekstem, nie liczy się do limitu.
    const podzial = wpisX.tekst.split(/^###\s+/m)
    const trescX = podzial[0].trim()
    const linia = liniaDla(raw, wpisX.offset)

    sprawdzStyl(plik, raw, trescX, wpisX.offset, "Wpis X", ZAKAZANE_FRAZY)

    if (trescX.length < X_MIN_ZNAKOW || trescX.length > X_MAX_ZNAKOW) {
      bland(plik, linia, `Wpis X ma ${trescX.length} znaków, powinien mieć ${X_MIN_ZNAKOW}-${X_MAX_ZNAKOW}.`)
    }

    const hook = trescX.split(/\n\s*\n/)[0] || ""
    if (hook.length > X_HOOK_MAX_ZNAKOW) {
      ostrzezenie(plik, linia, `Pierwszy akapit X ma ${hook.length} znaków; przed „Pokaż więcej” widać ~280, skróć hook.`)
    }

    if (liczHashtagi(trescX) > 1) bland(plik, linia, "Wpis X: więcej niż jeden hashtag.")
    sprawdzUtm(plik, wpisX.tekst, wpisX.offset, raw, "x")
  }

  if (wpisFB) {
    const trescFB = wpisFB.tekst.trim()
    const linia = liniaDla(raw, wpisFB.offset)

    sprawdzStyl(plik, raw, trescFB, wpisFB.offset, "Wpis FB", ZAKAZANE_FRAZY)

    if (trescFB.length < FB_MIN_ZNAKOW || trescFB.length > FB_MAX_ZNAKOW) {
      bland(plik, linia, `Wpis FB ma ${trescFB.length} znaków, powinien mieć ${FB_MIN_ZNAKOW}-${FB_MAX_ZNAKOW}.`)
    }
    if (!/\?\s*$|\?[^\n]*\n/.test(trescFB)) {
      ostrzezenie(plik, linia, "Wersja FB powinna kończyć się pytaniem do czytelników.")
    }
    if (liczHashtagi(trescFB) > 1) bland(plik, linia, "Wpis FB: więcej niż jeden hashtag.")
    sprawdzUtm(plik, wpisFB.tekst, wpisFB.offset, raw, "fb")
  }

  if (weryfikacja) {
    const punkty = weryfikacja.tekst.split(/\r?\n/).filter((l) => l.trim().startsWith("-"))
    const linia = liniaDla(raw, weryfikacja.offset)
    if (punkty.length < 3) {
      bland(plik, linia, `Sekcja Weryfikacja ma ${punkty.length} punktów, wymagane minimum 3 (kto, ile, od kogo).`)
    }
    const bezZrodla = punkty.filter((p) => !/:\s*\S/.test(p))
    if (bezZrodla.length) {
      bland(plik, linia, `${bezZrodla.length} punktów weryfikacji nie podaje źródła po dwukropku.`)
    }
  }
}

function sprawdzUtm(plik, fragment, offset, raw, kanal) {
  const linki = fragment.match(/https?:\/\/(www\.)?czypolskafirma\.pl[^\s)"']*/g) || []
  for (const link of linki) {
    if (!link.includes(`utm_source=${kanal}`)) {
      bland(plik, liniaDla(raw, offset + fragment.indexOf(link)), `Link do serwisu bez UTM-a: ${link} (oczekiwane ?utm_source=${kanal}&utm_medium=social).`)
    }
  }
}

// --------------------------------------------------------- lint: stan.json ---

function lintStanu(plik) {
  let dane
  try {
    dane = JSON.parse(fs.readFileSync(path.join(ROOT, plik), "utf8"))
  } catch (err) {
    bland(plik, 1, `Niepoprawny JSON: ${err.message}`)
    return
  }
  if (!Array.isArray(dane.opisane)) {
    bland(plik, 1, "Brak tablicy „opisane”.")
    return
  }
  const tematy = new Set()
  for (const wpis of dane.opisane) {
    if (!wpis.temat || !wpis.data) bland(plik, 1, `Wpis stanu bez pola temat/data: ${JSON.stringify(wpis)}`)
    if (tematy.has(wpis.temat)) bland(plik, 1, `Temat zduplikowany w stanie: „${wpis.temat}”.`)
    tematy.add(wpis.temat)
  }
}

// ------------------------------------------------------------------ main ---

function plikiDoSprawdzenia() {
  const zArgumentow = process.argv.slice(2).filter((a) => !a.startsWith("--"))
  if (zArgumentow.length) return zArgumentow.map((p) => p.replace(/\\/g, "/"))

  try {
    const status = execSync("git status --porcelain", { encoding: "utf8" })
    return status
      .split("\n")
      .map((l) => l.slice(3).trim().replace(/^"|"$/g, ""))
      .filter(Boolean)
      .map((p) => p.replace(/\\/g, "/"))
  } catch {
    return []
  }
}

function main() {
  const wszystkie = plikiDoSprawdzenia()
  const doSprawdzenia = wszystkie.filter(
    (p) =>
      (p.startsWith("content/blog/") && p.endsWith(".md") && !path.basename(p).startsWith("_")) ||
      /^docs\/social\/newsy\/news-.*\.md$/.test(p) ||
      p === "docs/social/newsy/stan-newsow.json",
  )

  if (!doSprawdzenia.length) {
    console.log("lint-tresci: brak plików treści do sprawdzenia.")
    process.exit(0)
  }

  for (const plik of doSprawdzenia) {
    if (!fs.existsSync(path.join(ROOT, plik))) continue
    if (plik.endsWith(".json")) lintStanu(plik)
    else if (plik.startsWith("content/blog/")) lintBloga(plik)
    else lintNewsa(plik)
  }

  console.log(`lint-tresci: sprawdzono ${doSprawdzenia.length} plików:`)
  for (const plik of doSprawdzenia) console.log(`  - ${plik}`)

  const bledy = problemy.filter((p) => p.waga === "BŁĄD")
  const ostrzezenia = problemy.filter((p) => p.waga === "OSTRZEŻENIE")

  for (const p of [...bledy, ...ostrzezenia]) {
    console.log(`${p.waga}  ${p.plik}:${p.linia}  ${p.komunikat}`)
  }

  if (bledy.length) {
    console.log(`\nlint-tresci: ${bledy.length} błędów, ${ostrzezenia.length} ostrzeżeń. Popraw błędy przed publikacją.`)
    process.exit(1)
  }

  console.log(`\nlint-tresci: OK (${ostrzezenia.length} ostrzeżeń).`)
}

main()
