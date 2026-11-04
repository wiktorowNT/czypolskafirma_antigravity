// Wyciąga dane firmy z HTML profilu /firma/<slug>.
//
// Dwa źródła w tym samym HTML:
//  1. payload RSC (self.__next_f.push): obiekt `company`, który serwer przekazuje do
//     CompanyProfileClient. To prawie 1:1 wiersz z tabeli `companies` (owner_name,
//     parent_company_name, opisy, country_code, website_url, lastVerified...).
//  2. JSON-LD (<script type="application/ld+json">): Organization (legalName,
//     parentOrganization), FAQPage. Służy jako kontrola krzyżowa.
// Plus pierwszy <img alt="Logo ..."> w nagłówku profilu (kandydat logo z SSR).

function wyciagnijFlight(html) {
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g
  let flight = ""
  let m
  while ((m = re.exec(html))) {
    try {
      flight += JSON.parse('"' + m[1] + '"')
    } catch {
      /* uszkodzony fragment: pomijamy */
    }
  }
  return flight
}

/** Zwraca obiekt JSON zaczynający się od klucza `"klucz":{` (pierwsze wystąpienie). */
function obiektPoKluczu(tekst, klucz) {
  const start = tekst.indexOf(`"${klucz}":{`)
  if (start < 0) return null
  const od = start + klucz.length + 3
  let glebokosc = 0
  let wTekscie = false
  for (let j = od; j < tekst.length; j++) {
    const c = tekst[j]
    if (wTekscie) {
      if (c === "\\") j++
      else if (c === '"') wTekscie = false
      continue
    }
    if (c === '"') wTekscie = true
    else if (c === "{") glebokosc++
    else if (c === "}") {
      glebokosc--
      if (glebokosc === 0) {
        try {
          return JSON.parse(tekst.slice(od, j + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** RSC serializuje undefined jako "$undefined". Zamieniamy na null. */
function oczysc(o) {
  if (Array.isArray(o)) return o.map(oczysc)
  if (o && typeof o === "object") {
    const w = {}
    for (const [k, v] of Object.entries(o)) w[k] = oczysc(v)
    return w
  }
  if (o === "$undefined") return null
  if (typeof o === "string" && o.startsWith("$D")) return o.slice(2)
  return o
}

function jsonLdOrganizacji(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let dane
    try {
      dane = JSON.parse(m[1])
    } catch {
      continue
    }
    const graf = dane["@graph"] || [dane]
    const org = graf.find((g) => g["@type"] === "Organization" && g.name !== "CzyPolskaFirma")
    if (!org) continue
    const faq = graf.find((g) => g["@type"] === "FAQPage")
    return {
      name: org.name ?? null,
      legalName: org.legalName ?? null,
      url: org.url ?? null,
      taxID: org.taxID ?? null,
      parentOrganization: org.parentOrganization?.name ?? null,
      faq: (faq?.mainEntity || []).map((q) => ({ pytanie: q.name, odpowiedz: q.acceptedAnswer?.text || "" })),
    }
  }
  return null
}

function logoZHtml(html, marka) {
  // Nagłówek profilu: pierwszy <img alt="Logo <marka>">. Brak <img> = od razu awatar z literą
  // (komponent nie ma żadnego kandydata, czyli brak website_url).
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0]
    const alt = /alt="([^"]*)"/.exec(tag)?.[1] || ""
    if (!alt.startsWith("Logo ") || alt === "CzyPolskaFirma Logo") continue
    if (marka && alt !== `Logo ${marka}` && !alt.includes(marka)) continue
    return /src="([^"]*)"/.exec(tag)?.[1] || null
  }
  return null
}

export function parsujProfil(html) {
  const flight = wyciagnijFlight(html)
  const firma = oczysc(obiektPoKluczu(flight, "company"))
  const ld = jsonLdOrganizacji(html)
  if (!firma && !ld) return null
  const marka = firma?.brandName || ld?.name || null
  return { firma, ld, logoSrc: logoZHtml(html, marka) }
}
