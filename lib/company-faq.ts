import { countryNames } from "@/lib/countries"

// Wspólna logika budowania FAQ firmy — używana przez widoczną sekcję FAQ
// (components/CompanyFAQ.tsx) oraz przez JSON-LD FAQPage w app/firma/[slug]/page.tsx.
// Dzięki temu treść w danych strukturalnych jest IDENTYCZNA z treścią widoczną na stronie.

export interface CompanyFaqInput {
  brandName: string
  country_code?: string | null
  country_code_2?: string | null
  ownership_description?: string | null
  owner_name?: string | null
  parent_company_name?: string | null
  business_description?: string | null
  categoryName?: string | null
  adres?: string | null
  siedziba_pl?: boolean
  founded_at?: string | null
  age?: number
}

export interface CompanyFaqItem {
  question: string
  answer: string
}

export function getCountryName(code?: string | null): string {
  if (!code) return "Brak danych"
  const upper = code.toUpperCase()
  if (upper === "UK") return "Wielka Brytania"
  return countryNames[upper] || upper
}

// Wspólna kontrola 50/50 (kolumna country_code_2): drugi kraj kapitału obok głównego.
// country_code zostaje krajem „głównym” (werdykt, statystyki, filtry) — reguła B5 metodologii.
export function getCountryCodes(code?: string | null, code2?: string | null): string[] {
  const first = code?.trim().toUpperCase()
  if (!first) return []
  const second = code2?.trim().toUpperCase()
  return second && second !== first ? [first, second] : [first]
}

// "Niemcy" albo "Niemcy i Szwajcaria" (mianownik, bez odmiany).
export function getCountryLabel(code?: string | null, code2?: string | null): string {
  const codes = getCountryCodes(code, code2)
  if (codes.length === 0) return "Brak danych"
  return codes.map((c) => getCountryName(c)).join(" i ")
}

export function isJointControl(code?: string | null, code2?: string | null): boolean {
  return getCountryCodes(code, code2).length > 1
}

export function buildCompanyFaqItems({
  brandName,
  country_code,
  country_code_2,
  ownership_description,
  owner_name,
  parent_company_name,
  business_description,
  categoryName,
  adres,
  siedziba_pl,
  founded_at,
  age,
}: CompanyFaqInput): CompanyFaqItem[] {
  const name = brandName
  const isPolish = country_code?.toUpperCase() === "PL"
  const countryName = getCountryName(country_code)
  const joint = isJointControl(country_code, country_code_2)
  const countryLabel = getCountryLabel(country_code, country_code_2)
  const ownerDisplay = owner_name || parent_company_name

  const faqItems: CompanyFaqItem[] = []

  // Q1: Czy to polska firma?
  const originText = isPolish
    ? `Tak, ${name} to polska firma. Kapitał firmy pochodzi z Polski.`
    : joint
      ? `Nie, ${name} to firma zagraniczna. Kontrolę sprawuje wspólnie kapitał z dwóch krajów (50/50): ${countryLabel}.`
      : `Nie, ${name} to firma zagraniczna. Kapitał firmy pochodzi z kraju: ${countryName}.`
  const ownershipSuffix = ownership_description ? ` ${ownership_description}` : ""
  faqItems.push({
    question: `Czy ${name} to polska firma?`,
    answer: `${originText}${ownershipSuffix}`,
  })

  // Q2: Kto jest właścicielem?
  if (ownerDisplay || ownership_description) {
    const ownerText = ownerDisplay ? `Właścicielem firmy ${name} jest ${ownerDisplay}.` : ""
    const descText = ownership_description ? ` ${ownership_description}` : ""
    faqItems.push({
      question: `Kto jest właścicielem ${name}?`,
      answer: `${ownerText}${descText}`.trim(),
    })
  }

  // Q3: Gdzie siedziba?
  if (adres || siedziba_pl !== undefined) {
    const addressText = adres
      ? `Siedziba firmy ${name} w Polsce znajduje się pod adresem: ${adres}.`
      : siedziba_pl
        ? `${name} posiada zarejestrowaną siedzibę na terenie Polski.`
        : `${name} nie posiada zarejestrowanej siedziby w Polsce.`
    faqItems.push({
      question: `Gdzie ${name} ma siedzibę?`,
      answer: addressText,
    })
  }

  // Q4: Czym zajmuje się firma?
  if (business_description || categoryName) {
    const bizText = business_description
      ? `${name} — ${business_description}`
      : `${name} działa w kategorii ${categoryName}.`
    const catSuffix =
      business_description && categoryName
        ? ` Firma jest sklasyfikowana w kategorii: ${categoryName}.`
        : ""
    faqItems.push({
      question: `Czym zajmuje się ${name}?`,
      answer: `${bizText}${catSuffix}`,
    })
  }

  // Q5: Od kiedy działa w Polsce?
  if (founded_at && age !== undefined && age > 0) {
    const year = new Date(founded_at).getFullYear()
    faqItems.push({
      question: `Od kiedy ${name} działa w Polsce?`,
      answer: `${name} jest obecna na polskim rynku od ${year} roku, co oznacza ponad ${age} lat działalności w Polsce.`,
    })
  }

  return faqItems
}
