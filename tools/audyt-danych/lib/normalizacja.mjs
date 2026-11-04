// Normalizacja nazw właścicieli i spółek do kluczy grupujących.
//
// Dwa poziomy:
//  - kluczScisly: różnice czysto kosmetyczne (wielkość liter, cudzysłowy, polskie znaki,
//    interpunkcja, zapis formy prawnej: "S.A." = "SA" = "Spółka Akcyjna"). Ta sama nazwa,
//    inaczej zapisana. Z tego poziomu powstają propozycje SQL.
//  - kluczLuzny: dodatkowo usuwa formę prawną w ogóle, kraj w nawiasie/po przecinku
//    i słowa typu Group/Grupa/Holding. To już może łączyć różne podmioty z jednej grupy,
//    więc wyłącznie do ręcznego przeglądu.

export function bezOgonkow(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/ø/g, "o")
    .replace(/ß/g, "ss")
}

const CUDZYSLOWY = /["'„”“‚‘’«»`´]/g

// Formy prawne: każdy zapis sprowadzamy do jednego tokenu (poziom ścisły),
// a na poziomie luźnym token jest usuwany. Kolejność ma znaczenie (dłuższe najpierw).
const FORMY = [
  [/\bspolka z ograniczona odpowiedzialnoscia\b/g, " SPZOO "],
  [/\bsp\s*z\s*o\s*o\b/g, " SPZOO "],
  [/\bspolka komandytowo akcyjna\b/g, " SKA "],
  [/\bs\s*k\s*a\b/g, " SKA "],
  [/\bspolka komandytowa\b/g, " SPK "],
  [/\bsp\s*k\b/g, " SPK "],
  [/\bspolka jawna\b/g, " SPJ "],
  [/\bsp\s*j\b/g, " SPJ "],
  [/\bspolka akcyjna\b/g, " SA "],
  [/\bprosta spolka akcyjna\b/g, " PSA "],
  [/\bp\s*s\s*a\b/g, " PSA "],
  [/\bs\s*a\b/g, " SA "],
  [/\bgesellschaft mit beschrankter haftung\b/g, " GMBH "],
  [/\bgmbh\s*(&|und)\s*co\s*kg\b/g, " GMBH_CO_KG "],
  [/\bgmbh\b/g, " GMBH "],
  [/\baktiengesellschaft\b/g, " AG "],
  [/\bag\b/g, " AG "],
  [/\bkgaa\b/g, " KGAA "],
  [/\bkg\b/g, " KG "],
  [/\bse\b/g, " SE "],
  [/\bpublic limited company\b/g, " PLC "],
  [/\bplc\b/g, " PLC "],
  [/\bincorporated\b/g, " INC "],
  [/\binc\b/g, " INC "],
  [/\blimited\b/g, " LTD "],
  [/\bltd\b/g, " LTD "],
  [/\bl\s*l\s*c\b/g, " LLC "],
  [/\bcorporation\b/g, " CORP "],
  [/\bcorp\b/g, " CORP "],
  [/\bco\s+ltd\b/g, " CO_LTD "],
  [/\bn\s*v\b/g, " NV "],
  [/\bb\s*v\b/g, " BV "],
  [/\bs\s*p\s*a\b/g, " SPA "],
  [/\bs\s*r\s*l\b/g, " SRL "],
  [/\bs\s*a\s*s\b/g, " SAS "],
  [/\bs\s*l\b/g, " SL "],
  [/\ba\s*s\b/g, " AS "],
  [/\bs\s*r\s*o\b/g, " SRO "],
  [/\ba\s*b\b/g, " AB "],
  [/\b(publ)\b/g, " PUBL "],
  [/\basa\b/g, " ASA "],
  [/\boyj\b/g, " OYJ "],
  [/\bk\s*k\b/g, " KK "],
  [/\bs\s*a\s*r\s*l\b/g, " SARL "],
  [/\bl\s*p\b/g, " LP "],
]
const TOKENY_FORM = new Set(FORMY.map(([, t]) => t.trim()))

function podstawa(s) {
  let t = bezOgonkow(String(s || "")).toLowerCase()
  t = t.replace(CUDZYSLOWY, " ")
  t = t.replace(/&amp;/g, "&")
  t = t.replace(/\s+&\s+/g, " & ")
  t = t.replace(/[.,;:()\[\]\/\\]/g, " ")
  t = t.replace(/-/g, " ")
  t = t.replace(/\s+/g, " ").trim()
  for (const [re, tok] of FORMY) t = t.replace(re, tok)
  return t.replace(/\s+/g, " ").trim()
}

/** Klucz ścisły: ta sama nazwa i ta sama forma prawna (w dowolnym zapisie). */
export function kluczScisly(s) {
  return podstawa(s).toLowerCase()
}

const KRAJE = [
  "polska", "poland", "niemcy", "germany", "deutschland", "francja", "france", "usa", "us", "stany zjednoczone",
  "wielka brytania", "uk", "united kingdom", "holandia", "netherlands", "szwecja", "sweden", "szwajcaria",
  "switzerland", "wlochy", "italy", "hiszpania", "spain", "japonia", "japan", "chiny", "china", "czechy",
  "dania", "denmark", "norwegia", "norway", "finlandia", "finland", "austria", "belgia", "belgium",
  "luksemburg", "luxembourg", "cypr", "cyprus", "irlandia", "ireland", "korea poludniowa", "korea",
  "kanada", "canada", "turcja", "turkey", "litwa", "wegry", "portugalia", "grecja", "izrael", "indie",
]
const SLOWA_GRUPY = /\b(group|grupa|gruppe|groupe|grupo|gruppo|holding|holdings|international|polska|poland|the|company|co|spolka|spolki)\b/g

/** Klucz luźny: bez formy prawnej, kraju i słów typu Group/Holding. Tylko do przeglądu. */
export function kluczLuzny(s) {
  let t = String(s || "")
  // kraj w nawiasie albo po przecinku/myślniku na końcu
  t = t.replace(/\(([^)]*)\)/g, (m, w) => (KRAJE.includes(bezOgonkow(w).toLowerCase().trim()) ? " " : ` ${w} `))
  t = podstawa(t)
  for (const tok of TOKENY_FORM) t = t.replace(new RegExp(`\\b${tok}\\b`, "g"), " ")
  t = t.toLowerCase()
  for (const k of KRAJE) t = t.replace(new RegExp(`(^| )(z )?${k}$`), " ")
  t = t.replace(SLOWA_GRUPY, " ")
  return t.replace(/\s+/g, " ").trim()
}

export function levenshtein(a, b) {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 3) return 99
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

/** Jak opisać różnicę między dwoma wariantami (do komentarza w SQL i raporcie). */
export function rodzajRoznicy(a, b) {
  const r = []
  if (a.trim() !== a || b.trim() !== b || /\s{2,}/.test(a + b)) r.push("białe znaki")
  if (a.toLowerCase() === b.toLowerCase()) return [...r, "wielkość liter"].join(", ")
  if (a.replace(CUDZYSLOWY, "") !== a || b.replace(CUDZYSLOWY, "") !== b) {
    if (a.replace(CUDZYSLOWY, "").toLowerCase() === b.replace(CUDZYSLOWY, "").toLowerCase()) return [...r, "cudzysłowy"].join(", ")
    r.push("cudzysłowy")
  }
  if (bezOgonkow(a).toLowerCase() === bezOgonkow(b).toLowerCase()) return [...r, "polskie znaki/akcenty"].join(", ")
  const bezN = (x) => x.replace(/\s*\([^)]*\)\s*/g, " ").trim().toLowerCase()
  if (bezN(a) === bezN(b)) return [...r, "dopisek w nawiasie"].join(", ")
  const pa = a.toLowerCase().replace(/[.\s,]/g, "")
  const pb = b.toLowerCase().replace(/[.\s,]/g, "")
  if (pa === pb) return [...r, "kropki/spacje"].join(", ")
  r.push("zapis formy prawnej")
  return [...new Set(r)].join(", ")
}
