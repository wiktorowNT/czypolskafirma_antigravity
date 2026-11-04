// Analiza sparsowanych profili: warianty właścicieli i spółek, niespójności werdyktu,
// braki, duplikaty, styl opisów. Zwraca obiekt z pełnymi listami (wyniki.json).

import { kluczScisly, kluczLuzny, levenshtein, bezOgonkow } from "./normalizacja.mjs"

const DZIS = new Date(process.env.AUDYT_DZIS || new Date().toISOString().slice(0, 10))
const ROK_TEMU = new Date(DZIS.getTime() - 365 * 864e5)

// Ta sama reguła co app/firma/[slug]/page.tsx (OGOLNI_WLASCICIELE): takie owner_name
// nie dostają sekcji „Inne firmy, których właścicielem jest …”.
export const OGOLNI_WLASCICIELE =
  /^(brak|nieznan|rozproszon|akcjonariusz|akcjonariat|inwestorzy|free float|wielu|osoby fizyczne|osoba fizyczna|inni)/i
// Szersze rozpoznanie „ogólnego” właściciela (do wyłapania tych, które regex przepuszcza).
const WYGLADA_OGOLNIE =
  /(rozprosz|akcjonari|akconari|akcjonarai|giełdow|gieldow|free.?float|osob[ay] fizyczn|prywatn\w* (akcjonariusz|inwestor|właściciel|wlasciciel)|brak danych|nieznan|inwestorzy|wspólnicy|wspolnicy|kadra zarządzająca|zarząd i)/i

// Właściciel „ogólny”: cała nazwa (bez dopisku w nawiasie) opisuje kategorię, a nie konkretny podmiot.
// „Haleon plc (akcjonariat rozproszony)” to konkretny podmiot, „Polscy wspólnicy (CRBR)” już nie.
const POCZATEK_OGOLNY =
  /^(polsc\p{L}*|polsk\p{L}*|prywatn\p{L}*|trzech|trzej|dwóch|dwaj|dwie|czterech|osob\p{L}*|akc\p{L}*nariat\p{L}*|akcjonariusz\p{L}*|wspólni\p{L}*|inwestor\p{L}*|właściciel\p{L}*|udziałowc\p{L}*|założyciel\p{L}*|kadra|zarząd|menedżer\p{L}*|rodzina założycieli|fundusze inwestycyjne|brak|nieznan\p{L}*)(?!\p{L})/iu
export function czyOgolny(w) {
  const baza = String(w || "").replace(/\s*\([^)]*\)\s*/g, " ").trim()
  return POCZATEK_OGOLNY.test(baza) || (WYGLADA_OGOLNIE.test(baza) && baza.split(/\s+/).length <= 4 && !/[A-Z]{2,}|\b(Inc|AG|SE|plc|S\.A\.|SA|Ltd)\b/.test(baza))
}

const SLOWNIK_OWNERSHIP_TYPE = new Set([
  "osoba/rodzina", "korporacja_gieldowa", "korporacja_prywatna", "rozproszony", "fundusz_pe_vc", "fundacja",
  "spoldzielnia", "skarb_panstwa", "inny",
])

const RAJE = new Set(["CY", "LU", "MT", "VG", "KY", "BM", "JE", "GG", "IM", "LI", "MC", "PA", "BS", "SC", "AE"])

function profil(f) {
  const c = f.firma
  return {
    slug: c.canonicalSlug || f.slug,
    slugDb: c.slug,
    marka: c.brandName,
    spolka: c.name || "",
    kraj: c.country_code || null,
    kraj2: c.country_code_2 || null,
    wlasciciel: c.owner_name || null,
    posrednik: c.parent_company_name || null,
    typ: c.ownership_type || null,
    nip: c.nip || null,
    www: c.website_url || null,
    od: c.ownership_description || "",
    bd: c.business_description || "",
    data: c.lastVerified || null,
  }
}

// ------------------------------------------------------------ warianty nazw ---

/** Grupuje wartości pola po kluczu; zwraca grupy z >1 surowym wariantem. */
function grupujWarianty(profile, pole, kluczFn) {
  const grupy = new Map()
  for (const p of profile) {
    const v = p[pole]
    if (!v || !v.trim()) continue
    const k = kluczFn(v)
    if (!k) continue
    if (!grupy.has(k)) grupy.set(k, new Map())
    const warianty = grupy.get(k)
    if (!warianty.has(v)) warianty.set(v, [])
    warianty.get(v).push(p.slug)
  }
  const wynik = []
  for (const [klucz, warianty] of grupy) {
    if (warianty.size < 2) continue
    const lista = [...warianty.entries()]
      .map(([wariant, slugi]) => ({ wariant, slugi }))
      .sort((a, b) => b.slugi.length - a.slugi.length || ocenaZapisu(b.wariant) - ocenaZapisu(a.wariant))
    wynik.push({ klucz, warianty: lista, profili: lista.reduce((s, w) => s + w.slugi.length, 0) })
  }
  return wynik.sort((a, b) => b.profili - a.profili)
}

/** Przy remisie liczności: wolimy zapis „ładniejszy” (nie same wielkie litery, z ogonkami, bez spacji na brzegach). */
function ocenaZapisu(s) {
  let o = 0
  if (s !== s.toUpperCase()) o += 4
  if (s === s.trim() && !/\s{2,}/.test(s)) o += 4
  if (/[ąćęłńóśźżéèüöäå]/i.test(s)) o += 2
  if (!/["'„”]/.test(s)) o += 1
  // przy pełnym remisie pełniejszy zapis („Kontoor Brands, Inc.”, „Agora S.A.”)
  return o + Math.min(s.length, 200) / 1000
}

/** Literówki: pary kluczy luźnych o odległości edycyjnej 1-2 (dla dłuższych nazw). */
function literowki(profile, pole) {
  const mapa = new Map()
  for (const p of profile) {
    const v = p[pole]
    if (!v) continue
    const k = kluczLuzny(v.replace(/\s*\([^)]*\)\s*/g, " ")).replace(/^rodzin[ay] /, "")
    if (k.length < 5) continue
    if (!mapa.has(k)) mapa.set(k, new Map())
    const w = mapa.get(k)
    if (!w.has(v)) w.set(v, [])
    w.get(v).push(p.slug)
  }
  const klucze = [...mapa.keys()].sort()
  const pary = []
  for (let i = 0; i < klucze.length; i++) {
    for (let j = i + 1; j < klucze.length; j++) {
      const a = klucze[i], b = klucze[j]
      if (Math.abs(a.length - b.length) > 2) continue
      const prog = Math.min(a.length, b.length) >= 12 ? 2 : 1
      const d = levenshtein(a, b)
      if (d === 0 || d > prog) continue
      // różnica tylko w cyfrach/liczbie mnogiej rodzin to zwykle inne podmioty: zostawiamy, ale oznaczamy
      pary.push({
        a: [...mapa.get(a).entries()].map(([wariant, slugi]) => ({ wariant, slugi })),
        b: [...mapa.get(b).entries()].map(([wariant, slugi]) => ({ wariant, slugi })),
        odleglosc: d,
      })
    }
  }
  return pary
}

// ------------------------------------------------------ niespójność werdyktu ---

const PRZYM_OBCE =
  "niemieck|francusk|amerykańsk|brytyjsk|angielsk|holendersk|niderlandzk|szwedzk|szwajcarsk|włosk|hiszpańsk|japońsk|chińsk|czesk|duńsk|norwesk|fińsk|austriack|belgijsk|luksembursk|cypryjsk|irlandzk|koreańsk|kanadyjsk|tureck|litewsk|łotewsk|węgiersk|portugalsk|greck|izraelsk|indyjsk|ukraińsk|estońsk|słowack|słoweńsk|chorwack|rosyjsk|tajwańsk|singapursk|australijsk|meksykańsk|brazylijsk|katarsk|saudyjsk|emirack|islandzk|rumuńsk|bułgarsk|serbsk|maltańsk"
const RE_OBCE = new RegExp(`(?<!\\p{L})(${PRZYM_OBCE})\\p{L}*|zagraniczn\\p{L}*`, "giu")
// Holding w raju podatkowym/jurysdykcji holdingowej nie przesądza o kapitale (Zasada Ostatecznego Właściciela).
const PRZYM_RAJE = /^(cypryjsk|luksembursk|maltańsk|holendersk|niderlandzk|zagraniczn)/iu
const RE_POLSKIE =
  /(?<!\p{L})(polsk\p{L}* (kapitał\p{L}*|założyciel\p{L}*|rodzin\p{L}*|przedsiębiorc\p{L}*|inwestor\p{L}*|fundusz\p{L}*|biznesmen\p{L}*|właściciel\p{L}*|beneficjen\p{L}*|akcjonariusz\p{L}*|wspólni\p{L}*)|polscy \p{L}+|polaków|polacy|skarb\p{L}* państwa(?! (rs|chorwac|fiński|norwesk|franc|niem))|polskich rąk|z polskim kapitałem)/giu
const RE_KONTROLA =
  /(należy do|należą do|kontrolowan\p{L}*|jedyn\p{L}* (wspólnik|akcjonariusz|udziałowc)\p{L}*|100\s?%|spółk\p{L}* zależn\p{L}*|częścią grupy|część grupy|wchodzi w skład|przejął|przejęła|przejęło|większościow\p{L}*|pakiet\p{L}* kontroln\p{L}*)/iu
const NEGACJA = /(nie ma|nie należy|nie należą|nigdy|brak (zagraniczn|podmiot)|nie występuj|bez zagraniczn|nie posiada|nie jest kontrolowan)/iu
const ZAKUP_OD = /(kupił\p{L}*|odkupił\p{L}*|wykupił\p{L}*|przejął|przejęła|nabył\p{L}*)[^.;]{0,120}(?<!\p{L})od(?!\p{L})/iu
const MNIEJSZOSC = /(mniejszościow|drugim (akcjonariuszem|udziałowcem)|pozostał\p{L}* (akcje|udziały))/iu
const FORMY_OBCE = /\b(GmbH|AG|Inc\.?|PLC|Ltd\.?|Limited|N\.?V\.?|S\.?p\.?A\.?|S\.?A\.?S\.?|AB|A\/S|Corp\.?|Corporation|LLC|K\.?K\.?|SE|Oyj|ASA|KGaA|Co\.,? Ltd\.?)\b/
const FORMY_PL = /(sp\.\s*z\s*o\.\s*o\.|spółka z ograniczoną|sp\.\s*k\.|s\.k\.a\.|spółka akcyjna|fundacja rodzinna|^skarb państwa( rp)?$)/i
const RODZINA_PL = /^rodzin[ay]\s+\p{L}+(ów|owie|skich|ckich|dzkich|ewiczów|owiczów)\b/iu

const KRAJE_W_NAWIASIE = {
  niemcy: "DE", francja: "FR", usa: "US", "stany zjednoczone": "US", "wielka brytania": "GB", uk: "GB",
  holandia: "NL", szwecja: "SE", szwajcaria: "CH", wlochy: "IT", hiszpania: "ES", japonia: "JP", chiny: "CN",
  czechy: "CZ", dania: "DK", norwegia: "NO", finlandia: "FI", austria: "AT", belgia: "BE", luksemburg: "LU",
  cypr: "CY", irlandia: "IE", "korea poludniowa": "KR", kanada: "CA", turcja: "TR", litwa: "LT", wegry: "HU",
  portugalia: "PT", polska: "PL", tajwan: "TW", ukraina: "UA", estonia: "EE", slowacja: "SK", izrael: "IL",
}

function zdania(t) {
  return String(t || "").split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ0-9„"])/u)
}

function procenty(z) {
  return [...z.matchAll(/(\d+(?:[.,]\d+)?)\s?%/g)].map((m) => parseFloat(m[1].replace(",", ".")))
}

/** Zdanie mówi, że kontrolę ma podmiot zagraniczny (spoza rajów), nie w trybie historycznym i nie o mniejszości. */
function zdanieObcejKontroli(z) {
  if (NEGACJA.test(z) || ZAKUP_OD.test(z) || MNIEJSZOSC.test(z)) return false
  RE_OBCE.lastIndex = 0
  // „Duńska marka Gram należy do Amica S.A.”: przymiotnik opisuje markę, nie właściciela.
  const obce = [...z.matchAll(RE_OBCE)]
    .filter((m) => !/^\s+mar(k|ce)/iu.test(z.slice(m.index + m[0].length)))
    .map((m) => m[0])
    .filter((x) => !PRZYM_RAJE.test(x))
  if (!obce.length || !RE_KONTROLA.test(z)) return false
  const pr = procenty(z)
  if (pr.length && Math.max(...pr) < 50) return false
  RE_POLSKIE.lastIndex = 0
  return !RE_POLSKIE.test(z)
}

/** Zdanie mówi, że kontrolę ma polski podmiot/osoba. */
function zdaniePolskiejKontroli(z) {
  if (NEGACJA.test(z) || ZAKUP_OD.test(z) || MNIEJSZOSC.test(z)) return false
  if (/(sprzeda|wcześniej|dawn\p{L}*|do roku|do \d{4}|przed \d{4}|założ\p{L}*|od \d{4}|(?<!\p{L})od polsk)/iu.test(z)) return false
  RE_POLSKIE.lastIndex = 0
  if (!RE_POLSKIE.test(z) || !RE_KONTROLA.test(z)) return false
  const pr = procenty(z)
  if (pr.length && Math.max(...pr) < 50) return false
  RE_OBCE.lastIndex = 0
  return ![...z.matchAll(RE_OBCE)].some((m) => !PRZYM_RAJE.test(m[0]))
}

function podejrzeniaWerdyktu(p) {
  const powody = []
  let wynik = 0
  const nazwy = [p.wlasciciel, p.posrednik].filter(Boolean).join(" | ")
  // kraj w nawiasie w owner_name/parent_company_name różny od country_code
  for (const m of nazwy.matchAll(/\(([^)]+)\)/g)) {
    const kod = KRAJE_W_NAWIASIE[bezOgonkow(m[1]).toLowerCase().trim()]
    if (kod && p.kraj && kod !== p.kraj && kod !== p.kraj2 && !RAJE.has(kod) && kod !== "NL") {
      wynik += 3
      powody.push(`w nazwie właściciela/pośrednika kraj „${m[1]}”, a country_code ${p.kraj}`)
    }
  }
  const zdaniaOd = zdania(p.od)
  if (p.kraj === "PL") {
    if (p.wlasciciel && FORMY_OBCE.test(p.wlasciciel) && !FORMY_PL.test(p.wlasciciel)) {
      RE_POLSKIE.lastIndex = 0
      if (!RE_POLSKIE.test(p.wlasciciel)) {
        wynik += 2
        powody.push(`owner_name z zagraniczną formą prawną: „${p.wlasciciel}”`)
      }
    }
    const z = zdaniaOd.find(zdanieObcejKontroli)
    if (z) {
      wynik += 2
      powody.push(`opis własności: „${skroc(z, 220)}”`)
    }
    if (!zdaniaOd.some((x) => (RE_POLSKIE.lastIndex = 0, RE_POLSKIE.test(x))) && z) wynik += 1
  } else if (p.kraj) {
    if (RAJE.has(p.kraj)) {
      wynik += 2
      powody.push(`country_code ${p.kraj} to jurysdykcja holdingowa/raj podatkowy (Zasada Ostatecznego Właściciela)`)
    }
    if (p.typ === "skarb_panstwa") {
      wynik += 1
      powody.push("ownership_type = skarb_panstwa przy zagranicznym kraju (sprawdzić, czy to obce państwo)")
    }
    if (p.wlasciciel && (FORMY_PL.test(p.wlasciciel) || RODZINA_PL.test(p.wlasciciel))) {
      wynik += 2
      powody.push(`owner_name wygląda na polski podmiot: „${p.wlasciciel}”`)
    }
    const z = zdaniaOd.find(zdaniePolskiejKontroli)
    if (z) {
      wynik += 2
      powody.push(`opis własności: „${skroc(z, 220)}”`)
    }
  }
  return { wynik, powody }
}

/** NIP: 10 cyfr i suma kontrolna (wagi 6,5,7,2,3,4,5,6,7). */
export function nipPoprawny(nip) {
  const d = String(nip || "").replace(/[\s-]/g, "")
  if (!/^\d{10}$/.test(d)) return false
  const wagi = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  const suma = wagi.reduce((s, w, i) => s + w * Number(d[i]), 0) % 11
  return suma !== 10 && suma === Number(d[9])
}

function skroc(s, n) {
  s = String(s).replace(/\s+/g, " ").trim()
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}

// ----------------------------------------------------------------- styl ---

const RE_MY =
  /(?<!\p{L})(my|nas|nam|nami|nasz|nasza|nasze|naszego|naszej|naszym|naszych|naszą|naszymi|jesteśmy|byliśmy|sprawdziliśmy|ustaliliśmy|uznajemy|uznaliśmy|klasyfikujemy|traktujemy|przyjmujemy|przyjęliśmy|uważamy|opisujemy|stosujemy|weryfikujemy|zweryfikowaliśmy|oceniamy|zaliczamy|wskazujemy|liczymy|zakładamy|widzimy|piszemy|podajemy)(?!\p{L})/giu

function styl(tekst) {
  const t = String(tekst || "")
  const em = (t.match(/—/g) || []).length
  // en-dash ze spacjami to pauza; bez spacji („X1–X7”, „2010–2015”) to zakres, dozwolony.
  const enPauza = (t.match(/\s–\s|\s–$|^–\s/g) || []).length
  const enZakres = (t.match(/[\p{L}\d]–[\p{L}\d]/gu) || []).length
  const minusPauza = (t.match(/\s-\s/g) || []).length
  // Pomijamy nazwy własne: „My Little Pony”, „Fundacja Nasze Dzieci” (słowo wielką literą + kolejne wielką).
  const my = [...t.matchAll(RE_MY)]
    .filter((m) => !(/^\p{Lu}/u.test(m[0]) && /^\s+\p{Lu}/u.test(t.slice(m.index + m[0].length))))
    .map((m) => m[0])
  return { em, enPauza, enZakres, minusPauza, my }
}

function fragment(t, re) {
  const m = re.exec(t)
  if (!m) return ""
  const i = Math.max(0, m.index - 60)
  return (i > 0 ? "…" : "") + t.slice(i, m.index + 60).replace(/\s+/g, " ") + "…"
}

// ------------------------------------------------------------- duplikaty ---

const kluczMarki = (s) => bezOgonkow(String(s || "")).toLowerCase().replace(/[^a-z0-9]/g, "")
const kluczSlugu = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/-(pl|polska|poland|sa|s-a|sp-z-o-o|spzoo|group|grupa|\d)$/g, "")
    .replace(/-/g, "")
function kluczWww(u, { zFragmentem = true } = {}) {
  if (!u) return null
  try {
    const x = new URL(u.startsWith("http") ? u : `https://${u}`)
    const baza = (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "")).toLowerCase()
    return zFragmentem && x.hash ? `${baza}${x.hash.toLowerCase()}` : baza
  } catch {
    return null
  }
}

const SLOWA_POMIJANE = new Set(["polska", "poland", "pl", "group", "grupa", "the", "i", "of", "and", "sa", "zdroj"])
const tokeny = (s) =>
  bezOgonkow(String(s || ""))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !SLOWA_POMIJANE.has(t))

/** Czy nazwy marek się pokrywają: jedna zawiera drugą albo mają wspólne słowo. */
function markiZbiezne(a, b) {
  const ka = kluczMarki(a), kb = kluczMarki(b)
  if (ka && kb && (ka.includes(kb) || kb.includes(ka))) return true
  const ta = new Set(tokeny(a))
  return tokeny(b).some((t) => ta.has(t))
}

/**
 * Podejrzenia duplikatów. Konwencja serwisu: marki jednej spółki bez własnej strony mają
 * www grupy z fragmentem (#marka), więc ten sam host z różnymi fragmentami NIE jest duplikatem.
 *  - mocny: ta sama marka (po normalizacji) albo ten sam dokładny URL + ten sam NIP + zbieżne nazwy;
 *  - średni: ten sam dokładny URL i NIP, ale nazwy marek różne (marka bez własnej strony albo duplikat);
 *  - słaby: podobny slug / marka różni się jedną literą (najczęściej różne firmy, do szybkiego odsiania).
 */
function duplikaty(profile) {
  const wg = (fn) => {
    const m = new Map()
    for (const p of profile) {
      const k = fn(p)
      if (!k) continue
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(p)
    }
    return [...m.entries()].filter(([, l]) => l.length > 1)
  }
  const pary = new Map()
  const dodaj = (lista, powod, sila) => {
    const slugi = lista.map((p) => p.slug).sort()
    const k = slugi.join("|")
    if (!pary.has(k)) pary.set(k, { slugi, profile: lista, powody: [], sila })
    const d = pary.get(k)
    d.powody.push(powod)
    const ranga = { mocny: 0, "średni": 1, "słaby": 2 }
    if (ranga[sila] < ranga[d.sila]) d.sila = sila
  }
  for (const [k, l] of wg((p) => kluczMarki(p.marka))) {
    const tenSamNip = l.every((p) => p.nip && p.nip === l[0].nip)
    dodaj(l, `ta sama marka (${k})${tenSamNip ? ", ten sam NIP" : ""}`, tenSamNip ? "mocny" : "średni")
  }
  for (const [k, l] of wg((p) => kluczWww(p.www))) {
    // dzielimy grupę na podgrupy po NIP; różne NIP-y pod jednym URL to raczej różne spółki grupy
    const poNip = new Map()
    for (const p of l) {
      const n = p.nip || "?"
      if (!poNip.has(n)) poNip.set(n, [])
      poNip.get(n).push(p)
    }
    for (const [nip, podgrupa] of poNip) {
      if (podgrupa.length < 2) continue
      for (let i = 0; i < podgrupa.length; i++)
        for (let j = i + 1; j < podgrupa.length; j++) {
          const [x, y] = [podgrupa[i], podgrupa[j]]
          const zb = markiZbiezne(x.marka, y.marka)
          dodaj([x, y], `ten sam URL (${k}) i NIP ${nip}${zb ? ", zbieżne nazwy marek" : ""}`, zb && nip !== "?" ? "mocny" : "średni")
        }
    }
    if (poNip.size > 1)
      dodaj(l, `ten sam URL (${k}), różne NIP-y`, "słaby")
  }
  for (const [k, l] of wg((p) => kluczSlugu(p.slug))) dodaj(l, `podobny slug (${k})`, "słaby")
  const posort = [...profile].sort((a, b) => a.slug.localeCompare(b.slug))
  for (let i = 0; i < posort.length; i++) {
    for (let j = i + 1; j < posort.length; j++) {
      const a = kluczMarki(posort[i].marka), b = kluczMarki(posort[j].marka)
      if (a.length < 6 || b.length < 6 || Math.abs(a.length - b.length) > 1) continue
      if (levenshtein(a, b) === 1) dodaj([posort[i], posort[j]], `marka różni się jedną literą`, "słaby")
    }
  }
  const ranga = { mocny: 0, "średni": 1, "słaby": 2 }
  return [...pary.values()]
    .map((d) => ({ ...d, tenSamNip: d.profile.every((p) => p.nip && p.nip === d.profile[0].nip), tenSamWerdykt: new Set(d.profile.map((p) => p.kraj)).size === 1 }))
    .sort((a, b) => ranga[a.sila] - ranga[b.sila] || a.slugi[0].localeCompare(b.slugi[0]))
}

// ------------------------------------------------------------------ main ---

export function analizuj({ firmy, bledy, api, stats, lista, slugi, lastmody = [], statusLogo, kandydaciLogo }) {
  const profile = firmy.map(profil)
  const poSlugu = new Map(profile.map((p) => [p.slug, p]))

  // 1. Właściciele
  const wlascicieleScisle = grupujWarianty(profile, "wlasciciel", kluczScisly)
  const kluczBezNawiasow = (s) => kluczScisly(String(s).replace(/\s*\([^)]*\)\s*/g, " "))
  const wlascicieleNawiasy = grupujWarianty(profile, "wlasciciel", kluczBezNawiasow).filter(
    (g) => new Set(g.warianty.map((w) => kluczScisly(w.wariant))).size > 1,
  )
  const wlascicieleLuzne = grupujWarianty(profile, "wlasciciel", kluczLuzny).filter(
    (g) => new Set(g.warianty.map((w) => kluczBezNawiasow(w.wariant))).size > 1,
  )
  const wlascicieleLiterowki = literowki(profile, "wlasciciel")

  // Ogólni właściciele, których regex OGOLNI_WLASCICIELE nie łapie (fałszywe „Inne firmy właściciela”).
  const ogolniPrzepuszczeni = []
  const poWlascicielu = new Map()
  for (const p of profile) {
    const w = (p.wlasciciel || "").trim()
    if (!w) continue
    if (!poWlascicielu.has(w)) poWlascicielu.set(w, [])
    poWlascicielu.get(w).push(p.slug)
  }
  for (const [w, sl] of poWlascicielu) {
    if (sl.length > 1 && czyOgolny(w) && !OGOLNI_WLASCICIELE.test(w)) {
      const spolki = new Set(sl.map((s) => kluczScisly(poSlugu.get(s).spolka)))
      ogolniPrzepuszczeni.push({ wariant: w, slugi: sl, spolek: spolki.size })
    }
  }
  // „Rodzina X” wspólna dla różnych spółek: może łączyć niespokrewnione rodziny o tym samym nazwisku.
  const rodzinyWspolne = []
  for (const [w, sl] of poWlascicielu) {
    if (!/^rodzin/i.test(w) || sl.length < 2) continue
    const spolki = new Set(sl.map((s) => kluczScisly(poSlugu.get(s).spolka)))
    if (spolki.size > 1) rodzinyWspolne.push({ wariant: w, slugi: sl, spolek: spolki.size })
  }
  ogolniPrzepuszczeni.sort((a, b) => b.slugi.length - a.slugi.length)
  rodzinyWspolne.sort((a, b) => b.slugi.length - a.slugi.length)

  // 2. Spółki (legalName)
  const spolkiScisle = grupujWarianty(profile, "spolka", kluczScisly)
  const spolkiLuzne = grupujWarianty(profile, "spolka", kluczLuzny).filter(
    (g) => new Set(g.warianty.map((w) => kluczScisly(w.wariant))).size > 1,
  )
  const spolkiLiterowki = literowki(profile, "spolka")
  // ten sam NIP, różne zapisy nazwy spółki
  const nipy = new Map()
  for (const p of profile) {
    if (!p.nip) continue
    if (!nipy.has(p.nip)) nipy.set(p.nip, new Map())
    const m = nipy.get(p.nip)
    const n = p.spolka || "(pusta nazwa)"
    if (!m.has(n)) m.set(n, [])
    m.get(n).push(p.slug)
  }
  const nipWieleNazw = [...nipy.entries()]
    .filter(([, m]) => m.size > 1)
    .map(([nip, m]) => ({ nip, warianty: [...m.entries()].map(([wariant, slugi]) => ({ wariant, slugi })) }))
  const bezNazwySpolki = profile.filter((p) => !p.spolka.trim()).map((p) => p.slug)
  // page.tsx (getCompanyFamily) pomija w filtrze nazwy z " i \, więc te profile nie mają
  // sekcji „inne marki tej spółki”, nawet gdy spółka ma w bazie kilka marek.
  const nazwyZCudzyslowem = profile.filter((p) => /["\\]/.test(p.spolka)).map((p) => p.slug)
  const wlascicieleZCudzyslowem = profile.filter((p) => /["\\]/.test(p.wlasciciel || "")).map((p) => p.slug)
  const bialeZnaki = profile
    .filter((p) => [p.spolka, p.wlasciciel || ""].some((t) => t !== t.trim() || /\s{2,}/.test(t)))
    .map((p) => p.slug)
  const ldNiezgodne = firmy
    .filter((f) => f.ld && (f.ld.legalName || "") !== (f.firma.name || ""))
    .map((f) => f.firma.canonicalSlug)

  // 3. Werdykt
  const werdykt = profile
    .map((p) => ({ slug: p.slug, marka: p.marka, kraj: p.kraj, wlasciciel: p.wlasciciel, posrednik: p.posrednik, typ: p.typ, ...podejrzeniaWerdyktu(p) }))
    .filter((x) => x.wynik >= 2)
    .sort((a, b) => b.wynik - a.wynik || a.slug.localeCompare(b.slug))
  // Ta sama spółka (NIP) albo ten sam właściciel (klucz ścisły), a różny country_code.
  const rozneKraje = (fn, etykieta) => {
    const m = new Map()
    for (const p of profile) {
      const k = fn(p)
      if (!k) continue
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(p)
    }
    return [...m.entries()]
      .filter(([, l]) => new Set(l.map((p) => p.kraj)).size > 1)
      .map(([k, l]) => ({ [etykieta]: k, profile: l.map((p) => ({ slug: p.slug, kraj: p.kraj, wlasciciel: p.wlasciciel })) }))
  }
  const nipRozneKraje = rozneKraje((p) => p.nip, "nip")
  const wlascicielRozneKraje = rozneKraje((p) => (p.wlasciciel && !czyOgolny(p.wlasciciel) ? kluczScisly(p.wlasciciel) : null), "wlasciciel")
  const typySpozaSlownika = profile.filter((p) => p.typ && !SLOWNIK_OWNERSHIP_TYPE.has(p.typ)).map((p) => ({ slug: p.slug, typ: p.typ }))
  const typVsKraj = profile
    .filter((p) => (p.typ === "skarb_panstwa" && p.kraj !== "PL") || (p.typ === "spoldzielnia" && p.kraj !== "PL"))
    .map((p) => ({ slug: p.slug, typ: p.typ, kraj: p.kraj }))

  // 4. Braki
  const logo = { litera: [], brakPliku: [] }
  for (const f of firmy) {
    const p = poSlugu.get(f.firma.canonicalSlug)
    const k = kandydaciLogo(f)
    if (!f.logoSrc && k.length === 0) logo.litera.push(p.slug)
    else if (!k.some((x) => statusLogo[x] === 200)) logo.brakPliku.push({ slug: p.slug, www: p.www })
  }
  const prog = { bd: 80, od: 100 }
  const braki = {
    bezWww: profile.filter((p) => !p.www).map((p) => p.slug),
    bezOpisuDzialalnosci: profile.filter((p) => !p.bd.trim()).map((p) => p.slug),
    bezOpisuWlasnosci: profile.filter((p) => !p.od.trim()).map((p) => p.slug),
    krotkiOpisDzialalnosci: profile.filter((p) => p.bd.trim() && p.bd.trim().length < prog.bd).map((p) => ({ slug: p.slug, dl: p.bd.trim().length, tekst: p.bd.trim() })),
    krotkiOpisWlasnosci: profile.filter((p) => p.od.trim() && p.od.trim().length < prog.od).map((p) => ({ slug: p.slug, dl: p.od.trim().length, tekst: p.od.trim() })),
    bezWlasciciela: profile.filter((p) => !p.wlasciciel).map((p) => p.slug),
    bezNip: profile.filter((p) => !p.nip).map((p) => p.slug),
    nipNiepoprawny: profile.filter((p) => p.nip && !nipPoprawny(p.nip)).map((p) => ({ slug: p.slug, nip: p.nip })),
    bezKraju: profile.filter((p) => !p.kraj).map((p) => p.slug),
    bezTypu: profile.filter((p) => !p.typ).map((p) => p.slug),
    staraData: profile.filter((p) => p.data && new Date(p.data) < ROK_TEMU).map((p) => ({ slug: p.slug, data: p.data })),
    logo,
  }
  // verified_at vs created_at: sitemap podaje lastmod = verified_at ?? created_at. verified_at jest
  // kolumną typu date (północ UTC), created_at ma pełny czas. Profil z czasem ≠ 00:00 = brak verified_at.
  braki.bezVerifiedAt = lastmody
    .filter((x) => !/T00:00:00(\.000)?Z$/.test(x.lastmod))
    .map((x) => ({ slug: x.slug, created: x.lastmod.slice(0, 10) }))
  const miesiaceBezVerified = {}
  for (const x of braki.bezVerifiedAt) miesiaceBezVerified[x.created.slice(0, 7)] = (miesiaceBezVerified[x.created.slice(0, 7)] || 0) + 1

  // 5. Duplikaty
  const dupl = duplikaty(profile)

  // 6. Styl
  const stylLista = []
  for (const p of profile) {
    for (const [pole, t] of [["ownership_description", p.od], ["business_description", p.bd], ["owner_name", p.wlasciciel || ""]]) {
      const s = styl(t)
      if (s.em || s.enPauza || s.minusPauza || s.my.length)
        stylLista.push({
          slug: p.slug,
          pole,
          ...s,
          fragment: s.em ? fragment(t, /—/) : s.enPauza ? fragment(t, /–/) : s.my.length ? fragment(t, new RegExp(`(?<!\\p{L})${s.my[0]}(?!\\p{L})`, "u")) : fragment(t, /\s-\s/),
        })
    }
  }

  // Spójność źródeł
  const slugiSet = new Set(slugi)
  const apiSlugi = Array.isArray(api) ? new Set(api.map((c) => c.slug)) : null
  const spojnosc = {
    sitemap: slugi.length,
    sparsowane: firmy.length,
    bledyPobrania: bledy.map((b) => ({ slug: b?.slug, blad: b?.blad || "brak danych firmy w HTML" })),
    api: api ? api.length : null,
    statsTotal: stats?.total ?? null,
    statsPolish: stats?.polishCount ?? null,
    profilePolskie: profile.filter((p) => p.kraj === "PL").length,
    profileZagraniczne: profile.filter((p) => p.kraj && p.kraj !== "PL").length,
    wApiNieWSitemapie: apiSlugi ? [...apiSlugi].filter((s) => !slugiSet.has(s)) : [],
    wSitemapieNieWApi: apiSlugi ? slugi.filter((s) => !apiSlugi.has(s)) : [],
    slugKanonicznyInnyNizDb: profile.filter((p) => p.slugDb && p.slugDb !== p.slug).map((p) => ({ slug: p.slug, slugDb: p.slugDb })),
    lista: lista ? (Array.isArray(lista) ? lista.length : "jest") : null,
  }

  const podsumowanie = {
    profili: profile.length,
    "1. grupy właścicieli, zapis kosmetyczny (SQL)": wlascicieleScisle.length,
    "1. profile w tych grupach": wlascicieleScisle.reduce((s, g) => s + g.profili, 0),
    "1. grupy właścicieli różniące się dopiskiem w nawiasie": wlascicieleNawiasy.length,
    "1. grupy właścicieli do przeglądu (forma prawna/Group/kraj)": wlascicieleLuzne.length,
    "1. pary możliwych literówek w właścicielach": wlascicieleLiterowki.length,
    "1. ogólni właściciele przepuszczeni przez OGOLNI_WLASCICIELE": ogolniPrzepuszczeni.length,
    "1. „Rodzina X” wspólna dla różnych spółek": rodzinyWspolne.length,
    "2. grupy spółek, zapis kosmetyczny": spolkiScisle.length,
    "2. grupy spółek do przeglądu": spolkiLuzne.length,
    "2. pary możliwych literówek w spółkach": spolkiLiterowki.length,
    "2. NIP z różnymi nazwami spółki": nipWieleNazw.length,
    "2. profile bez nazwy spółki": bezNazwySpolki.length,
    "2. nazwa spółki z \" (bez sekcji „inne marki tej spółki”)": nazwyZCudzyslowem.length,
    "1/2. podwójne spacje lub spacje na brzegach (name/owner_name)": bialeZnaki.length,
    "3. podejrzenia niespójności werdyktu": werdykt.length,
    "3. ten sam NIP, różny country_code": nipRozneKraje.length,
    "3. ten sam owner_name, różny country_code": wlascicielRozneKraje.length,
    "3. ownership_type spoza słownika": typySpozaSlownika.length,
    "4. bez strony www": braki.bezWww.length,
    "4. logo: od razu litera (brak www)": logo.litera.length,
    "4. logo: brak pliku w /logos (Brandfetch albo litera)": logo.brakPliku.length,
    "4. bez opisu działalności": braki.bezOpisuDzialalnosci.length,
    "4. bez opisu własności": braki.bezOpisuWlasnosci.length,
    [`4. krótki opis działalności (<${prog.bd} zn.)`]: braki.krotkiOpisDzialalnosci.length,
    [`4. krótki opis własności (<${prog.od} zn.)`]: braki.krotkiOpisWlasnosci.length,
    "4. bez verified_at (data z created_at)": braki.bezVerifiedAt.length,
    "4. data na profilu starsza niż 12 mies.": braki.staraData.length,
    "4. bez owner_name": braki.bezWlasciciela.length,
    "4. bez NIP": braki.bezNip.length,
    "4. NIP niepoprawny (format/suma kontrolna)": braki.nipNiepoprawny.length,
    "4. bez ownership_type": braki.bezTypu.length,
    "5. podejrzenia duplikatów (mocne)": dupl.filter((d) => d.sila === "mocny").length,
    "5. podejrzenia duplikatów (średnie)": dupl.filter((d) => d.sila === "średni").length,
    "5. podejrzenia duplikatów (słabe)": dupl.filter((d) => d.sila === "słaby").length,
    "6. profile z em-dash": new Set(stylLista.filter((s) => s.em).map((s) => s.slug)).size,
    "6. profile z en-dash jako pauzą": new Set(stylLista.filter((s) => s.enPauza).map((s) => s.slug)).size,
    "6. profile z „ - ” jako pauzą": new Set(stylLista.filter((s) => s.minusPauza).map((s) => s.slug)).size,
    "6. profile z formą „my”": new Set(stylLista.filter((s) => s.my.length).map((s) => s.slug)).size,
  }

  return {
    data: DZIS.toISOString().slice(0, 10),
    podsumowanie,
    spojnosc,
    wlasciciele: { scisle: wlascicieleScisle, nawiasy: wlascicieleNawiasy, luzne: wlascicieleLuzne, literowki: wlascicieleLiterowki, ogolniPrzepuszczeni, rodzinyWspolne },
    spolki: { scisle: spolkiScisle, luzne: spolkiLuzne, literowki: spolkiLiterowki, nipWieleNazw, bezNazwySpolki, ldNiezgodne, nazwyZCudzyslowem, wlascicieleZCudzyslowem, bialeZnaki },
    werdykt: { podejrzenia: werdykt, typySpozaSlownika, typVsKraj, nipRozneKraje, wlascicielRozneKraje },
    braki,
    miesiaceBezVerified,
    duplikaty: dupl.map((d) => ({ ...d, profile: d.profile.map((p) => ({ slug: p.slug, marka: p.marka, spolka: p.spolka, nip: p.nip, www: p.www, kraj: p.kraj })) })),
    styl: stylLista,
    profile: Object.fromEntries(profile.map((p) => [p.slug, { marka: p.marka, slugDb: p.slugDb, kraj: p.kraj, wlasciciel: p.wlasciciel, spolka: p.spolka }])),
  }
}
