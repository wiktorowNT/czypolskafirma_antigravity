// Raport markdown (tabele) i propozycje SQL z wyników analizy.

import fs from "fs"
import { rodzajRoznicy } from "./normalizacja.mjs"
import { OGOLNI_WLASCICIELE } from "./analiza.mjs"

const URL = "https://czypolskafirma.pl/firma/"
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")
const link = (slug) => `[${slug}](${URL}${slug})`
const linki = (slugi, max = 8) =>
  slugi.slice(0, max).map(link).join(", ") + (slugi.length > max ? ` (+${slugi.length - max})` : "")

function tabela(naglowki, wiersze) {
  if (!wiersze.length) return "_brak_\n"
  return [
    `| ${naglowki.join(" | ")} |`,
    `| ${naglowki.map(() => "---").join(" | ")} |`,
    ...wiersze.map((w) => `| ${w.map((c) => String(c ?? "")).join(" | ")} |`),
  ].join("\n") + "\n"
}

const warianty = (g) => g.warianty.map((w) => `„${esc(w.wariant)}” ×${w.slugi.length}`).join("<br>")
const profileGrupy = (g) => g.warianty.map((w) => linki(w.slugi, 4)).join("<br>")

export function zapiszRaport(w, plik) {
  const o = []
  o.push(`# Audyt danych firm (wygenerowany ${w.data})\n`)
  o.push("## Podsumowanie\n")
  o.push(tabela(["Miara", "Liczba"], Object.entries(w.podsumowanie).map(([k, v]) => [esc(k), v])))

  o.push("\n## Spójność źródeł\n")
  const s = w.spojnosc
  o.push(
    tabela(["Miara", "Wartość"], [
      ["profile w sitemapie", s.sitemap],
      ["sparsowane profile", s.sparsowane],
      ["błędy pobrania/parsowania", s.bledyPobrania.length],
      ["/api/companies", s.api ?? "brak"],
      ["/api/stats total / polishCount", `${s.statsTotal} / ${s.statsPolish}`],
      ["profile PL / zagraniczne (z profili)", `${s.profilePolskie} / ${s.profileZagraniczne}`],
      ["w API, nie w sitemapie", s.wApiNieWSitemapie.length],
      ["w sitemapie, nie w API", s.wSitemapieNieWApi.length],
      ["slug w bazie ≠ slug kanoniczny", s.slugKanonicznyInnyNizDb.length],
      ["/companies/lista.json", s.lista ?? "nie wdrożone"],
    ]),
  )

  const W = w.wlasciciele
  o.push("\n## 1. Właściciele zapisani różnie\n")
  o.push("### 1a. Różnice kosmetyczne (wielkość liter, cudzysłowy, ogonki, zapis formy prawnej)\n")
  o.push(tabela(["Klucz", "Warianty", "Profile", "Różnica"], W.scisle.map((g) => [esc(g.klucz), warianty(g), profileGrupy(g), esc(rodzajRoznicy(g.warianty[0].wariant, g.warianty[1].wariant))])))
  o.push("\n### 1b. Różnica tylko w dopisku w nawiasie\n")
  o.push(tabela(["Warianty", "Profile"], W.nawiasy.map((g) => [warianty(g), profileGrupy(g)])))
  o.push("\n### 1c. Do przeglądu: z formą prawną i bez, Group/Grupa/Holding, kraj w nazwie\n")
  o.push(tabela(["Klucz luźny", "Warianty", "Profile"], W.luzne.map((g) => [esc(g.klucz), warianty(g), profileGrupy(g)])))
  o.push("\n### 1d. Możliwe literówki (odległość edycyjna 1-2)\n")
  o.push(
    tabela(["Wariant A", "Wariant B", "Profile A", "Profile B"], W.literowki.map((p) => [
      p.a.map((x) => `„${esc(x.wariant)}”`).join("<br>"),
      p.b.map((x) => `„${esc(x.wariant)}”`).join("<br>"),
      linki(p.a.flatMap((x) => x.slugi), 4),
      linki(p.b.flatMap((x) => x.slugi), 4),
    ])),
  )
  o.push("\n### 1e. Ogólni właściciele, których nie łapie OGOLNI_WLASCICIELE (fałszywe „Inne firmy właściciela”)\n")
  o.push(tabela(["owner_name", "Profili", "Różnych spółek", "Profile"], W.ogolniPrzepuszczeni.map((g) => [`„${esc(g.wariant)}”`, g.slugi.length, g.spolek, linki(g.slugi, 6)])))
  o.push("\n### 1f. „Rodzina X” wspólna dla kilku różnych spółek (sprawdzić, czy to ta sama rodzina)\n")
  o.push(tabela(["owner_name", "Profili", "Spółek", "Profile"], W.rodzinyWspolne.map((g) => [`„${esc(g.wariant)}”`, g.slugi.length, g.spolek, linki(g.slugi, 6)])))

  const S = w.spolki
  o.push("\n## 2. Nazwa spółki (legalName) zapisana różnie\n")
  o.push("### 2a. Różnice kosmetyczne\n")
  o.push(tabela(["Warianty", "Profile"], S.scisle.map((g) => [warianty(g), profileGrupy(g)])))
  o.push("\n### 2b. Ten sam NIP, różne nazwy spółki\n")
  o.push(tabela(["NIP", "Warianty", "Profile"], S.nipWieleNazw.map((g) => [g.nip, warianty(g), profileGrupy(g)])))
  o.push("\n### 2c. Do przeglądu (bez formy prawnej / Group)\n")
  o.push(tabela(["Klucz", "Warianty", "Profile"], S.luzne.map((g) => [esc(g.klucz), warianty(g), profileGrupy(g)])))
  o.push("\n### 2d. Możliwe literówki\n")
  o.push(
    tabela(["Wariant A", "Wariant B", "Profile"], S.literowki.map((p) => [
      p.a.map((x) => `„${esc(x.wariant)}”`).join("<br>"),
      p.b.map((x) => `„${esc(x.wariant)}”`).join("<br>"),
      linki([...p.a, ...p.b].flatMap((x) => x.slugi), 4),
    ])),
  )
  o.push(`\n### 2e. Profile bez nazwy spółki (${S.bezNazwySpolki.length})\n`)
  o.push(linki(S.bezNazwySpolki, 400) + "\n")
  o.push(`\n### 2f. Nazwa spółki z cudzysłowem podwójnym (${S.nazwyZCudzyslowem.length}): page.tsx pomija je w filtrze rodziny\n`)
  o.push(linki(S.nazwyZCudzyslowem, 400) + "\n")
  o.push(`\n### 2g. Podwójne spacje lub spacje na brzegach w name/owner_name (${S.bialeZnaki.length})\n`)
  o.push(linki(S.bialeZnaki, 400) + "\n")

  o.push("\n## 3. Podejrzenia niespójności werdyktu (do ręcznej weryfikacji)\n")
  o.push(
    tabela(["Profil", "country_code", "owner_name", "Pkt", "Powody"], w.werdykt.podejrzenia.map((x) => [
      link(x.slug), x.kraj, esc(x.wlasciciel), x.wynik, x.powody.map(esc).join("<br>"),
    ])),
  )
  const grupaKrajow = (g) => g.profile.map((p) => `${link(p.slug)} ${p.kraj}`).join("<br>")
  o.push("\n### 3b. Ten sam NIP (ta sama polska spółka), różny country_code\n")
  o.push(tabela(["NIP", "Profile i kraj"], w.werdykt.nipRozneKraje.map((g) => [g.nip, grupaKrajow(g)])))
  o.push("\n### 3c. Ten sam owner_name, różny country_code\n")
  o.push(tabela(["owner_name (klucz)", "Profile i kraj"], w.werdykt.wlascicielRozneKraje.map((g) => [esc(g.wlasciciel), grupaKrajow(g)])))
  o.push("\n### ownership_type spoza słownika\n")
  o.push(tabela(["Profil", "ownership_type"], w.werdykt.typySpozaSlownika.map((x) => [link(x.slug), esc(x.typ)])))

  const B = w.braki
  o.push("\n## 4. Braki\n")
  o.push(`### Logo: awatar z literą od razu (brak www) (${B.logo.litera.length})\n\n${linki(B.logo.litera, 400)}\n`)
  o.push(`\n### Logo: brak pliku w /logos (wyświetla się Brandfetch albo litera) (${B.logo.brakPliku.length})\n`)
  o.push(tabela(["Profil", "website_url"], B.logo.brakPliku.map((x) => [link(x.slug), esc(x.www)])))
  o.push(`\n### Bez strony www (${B.bezWww.length})\n\n${linki(B.bezWww, 400)}\n`)
  o.push(`\n### Bez opisu działalności (${B.bezOpisuDzialalnosci.length})\n\n${linki(B.bezOpisuDzialalnosci, 400)}\n`)
  o.push(`\n### Bez opisu własności (${B.bezOpisuWlasnosci.length})\n\n${linki(B.bezOpisuWlasnosci, 400)}\n`)
  o.push(`\n### Krótki opis działalności (${B.krotkiOpisDzialalnosci.length})\n`)
  o.push(tabela(["Profil", "Znaków", "Tekst"], B.krotkiOpisDzialalnosci.sort((a, b) => a.dl - b.dl).map((x) => [link(x.slug), x.dl, esc(x.tekst)])))
  o.push(`\n### Krótki opis własności (${B.krotkiOpisWlasnosci.length})\n`)
  o.push(tabela(["Profil", "Znaków", "Tekst"], B.krotkiOpisWlasnosci.sort((a, b) => a.dl - b.dl).map((x) => [link(x.slug), x.dl, esc(x.tekst)])))
  o.push(`\n### Bez verified_at (${B.bezVerifiedAt.length}), wg miesiąca dodania\n`)
  o.push(tabela(["Miesiąc created_at", "Profili"], Object.entries(w.miesiaceBezVerified).sort().map(([k, v]) => [k, v])))
  o.push(`\n### Data na profilu starsza niż 12 miesięcy (${B.staraData.length})\n\n${linki(B.staraData.map((x) => x.slug), 400)}\n`)
  o.push(`\n### Bez owner_name (${B.bezWlasciciela.length})\n\n${linki(B.bezWlasciciela, 400)}\n`)
  o.push(`\n### Bez NIP (${B.bezNip.length})\n\n${linki(B.bezNip, 400)}\n`)
  o.push(`\n### NIP niepoprawny (${B.nipNiepoprawny.length})\n`)
  o.push(tabela(["Profil", "NIP"], B.nipNiepoprawny.map((x) => [link(x.slug), esc(x.nip)])))

  o.push("\n## 5. Podejrzenia duplikatów\n")
  o.push(
    tabela(["Siła", "Profile", "Marki", "Spółki / NIP", "www", "Powody"], w.duplikaty.map((d) => [
      d.sila,
      d.profile.map((p) => link(p.slug)).join("<br>"),
      d.profile.map((p) => `${esc(p.marka)} (${p.kraj})`).join("<br>"),
      d.profile.map((p) => `${esc(p.spolka || "?")} / ${p.nip || "?"}`).join("<br>"),
      d.profile.map((p) => esc(p.www || "?")).join("<br>"),
      [...new Set(d.powody)].map(esc).join("<br>"),
    ])),
  )

  o.push("\n## 6. Styl opisów: pauzy i forma „my”\n")
  o.push(
    tabela(["Profil", "Pole", "—", "– pauza", "„ - ”", "„my”", "Fragment"], w.styl.map((x) => [
      link(x.slug), x.pole, x.em || "", x.enPauza || "", x.minusPauza || "", x.my.join(", "), esc(x.fragment),
    ])),
  )
  fs.writeFileSync(plik, o.join("\n"))
}

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`

/**
 * Propozycje UPDATE owner_name.
 *  A (aktywne): grupy 1a, różnice czysto kosmetyczne, bez właścicieli „ogólnych”.
 *  B (zakomentowane): grupy 1b, ten sam podmiot z dopiskiem w nawiasie i bez. Decyzja redakcyjna.
 *  C (zakomentowane): name z "X" na 'X' (spoza zakresu pliku, ale ta sama mechanika dopasowania).
 * Kanoniczny zapis = najczęstszy wariant (przy remisie: ładniejszy zapis / krótszy).
 */
export function zapiszSql(w, plik, { czyOgolny = () => false } = {}) {
  const o = []
  o.push(`-- Propozycje ujednolicenia zapisu companies.owner_name (audyt ${w.data}, tools/audyt-danych/audyt-danych.mjs).`)
  o.push("-- NIE URUCHAMIAĆ bez decyzji właściciela. Dane z żywej strony, nie z bazy.")
  o.push("-- Każdy UPDATE ma strażnika `owner_name = <stary zapis>`: powtórne uruchomienie nic nie zmienia,")
  o.push("-- a rekord poprawiony w międzyczasie zostaje w spokoju. `slug` to surowy slug z bazy.")
  o.push("-- Po co: sekcja „Inne firmy, których właścicielem jest …” (app/firma/[slug]/page.tsx,")
  o.push("-- getCompanyFamily) dopasowuje po równości owner_name, więc każdy wariant zapisu to osobny właściciel.\n")
  o.push("begin;\n")
  const blok = (g, naglowek, prefiks = "") => {
    const [kanon, ...reszta] = g.warianty
    o.push(`${prefiks}-- ${naglowek}: „${kanon.wariant}” (${kanon.slugi.length} prof.) ← ${reszta.map((r) => `„${r.wariant}” (${r.slugi.length})`).join(", ")}`)
    for (const r of reszta) {
      const slugiDb = r.slugi.map((s) => w.profile[s]?.slugDb || s)
      o.push(`${prefiks}-- różnica: ${rodzajRoznicy(kanon.wariant, r.wariant)}`)
      o.push(`${prefiks}update companies set owner_name = ${sqlStr(kanon.wariant)}`)
      o.push(`${prefiks}  where slug in (${slugiDb.map(sqlStr).join(", ")})`)
      o.push(`${prefiks}    and owner_name = ${sqlStr(r.wariant)};`)
    }
    o.push("")
  }
  const ogolna = (g) => g.warianty.some((x) => czyOgolny(x.wariant))
  o.push("-- ===== A. Kosmetyka zapisu (pewne): wielkość liter, kropki, przecinek przed Inc., cudzysłowy =====\n")
  for (const g of w.wlasciciele.scisle.filter((g) => !ogolna(g))) blok(g, "A")
  const pominiete = w.wlasciciele.scisle.filter(ogolna)
  if (pominiete.length) {
    o.push("-- Pominięte celowo (właściciel „ogólny”, ujednolicenie POŁĄCZYŁOBY niepowiązane firmy w sekcji właściciela):")
    for (const g of pominiete) o.push(`--   ${g.warianty.map((x) => `„${x.wariant}”`).join(" / ")}`)
    o.push("")
  }
  // A2: literówki, które po poprawce trafiają w OGOLNI_WLASCICIELE (np. „Akconariat” → „Akcjonariat”).
  // Poprawka jest pewna i usuwa fałszywe dopasowanie „ten sam właściciel” między niepowiązanymi firmami.
  const lit = w.wlasciciele.literowki.filter((p) => p.odleglosc === 1)
  const a2 = []
  for (const p of lit) {
    const sumy = [p.a, p.b].map((strona) => strona.reduce((n, x) => n + x.slugi.length, 0))
    const [wiekszy, mniejszy] = sumy[0] >= sumy[1] ? [p.a, p.b] : [p.b, p.a]
    const kanon = wiekszy[0].wariant
    if (!OGOLNI_WLASCICIELE.test(kanon)) continue
    for (const r of mniejszy) if (!OGOLNI_WLASCICIELE.test(r.wariant)) a2.push({ kanon, r })
  }
  if (a2.length) {
    o.push("-- ===== A2. Literówki (pewne): po poprawce zapis trafia w OGOLNI_WLASCICIELE i przestaje łączyć firmy =====\n")
    for (const { kanon, r } of a2) {
      const slugiDb = r.slugi.map((s) => w.profile[s]?.slugDb || s)
      o.push(`-- A2: „${r.wariant}” (${r.slugi.length} prof.) → „${kanon}”`)
      o.push(`update companies set owner_name = ${sqlStr(kanon)}`)
      o.push(`  where slug in (${slugiDb.map(sqlStr).join(", ")})`)
      o.push(`    and owner_name = ${sqlStr(r.wariant)};`)
      o.push("")
    }
  }
  o.push("-- ===== B. Dopisek w nawiasie (ten sam podmiot). DO DECYZJI: odkomentuj wybrane bloki. =====")
  o.push("-- Kanoniczny = najczęstszy wariant. Dopisek bywa informacją (np. pośredni holding), wtedy lepiej")
  o.push("-- przenieść go do ownership_description niż trzymać dwa zapisy właściciela.\n")
  const nawiasy = w.wlasciciele.nawiasy.filter((g) => !ogolna(g) && !/^skarb pa/i.test(g.warianty[0].wariant))
  for (const g of nawiasy) {
    const kopia = { ...g, warianty: [...g.warianty].sort((a, b) => b.slugi.length - a.slugi.length || a.wariant.length - b.wariant.length) }
    blok(kopia, "B", "-- ")
  }
  o.push("commit;\n")
  o.push("-- ===== C. Poza zakresem owner_name: nazwa spółki (name) z \"X\" zamiast 'X'. DO DECYZJI. =====")
  o.push("-- getCompanyFamily pomija nazwy z cudzysłowem podwójnym, więc te profile nie pokazują innych marek")
  o.push("-- tej samej spółki, a pozostałe marki nie pokazują ich. Większość bazy ma już zapis z apostrofami.\n")
  for (const g of w.spolki.scisle) {
    const kanon = g.warianty.find((x) => !/"/.test(x.wariant) && x.wariant === x.wariant.trim())
    if (!kanon) continue
    for (const r of g.warianty.filter((x) => x !== kanon)) {
      if (r.wariant.replace(/"/g, "'").trim() !== kanon.wariant && r.wariant.replace(/"/g, "").trim() !== kanon.wariant.replace(/'/g, "")) continue
      const slugiDb = r.slugi.map((s) => w.profile[s]?.slugDb || s)
      o.push(`-- update companies set name = ${sqlStr(kanon.wariant)} where slug in (${slugiDb.map(sqlStr).join(", ")}) and name = ${sqlStr(r.wariant)};`)
    }
  }
  fs.writeFileSync(plik, o.join("\n") + "\n")
}
