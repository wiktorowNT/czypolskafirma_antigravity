import { describe, expect, it } from "vitest"
import {
  buildCompanyFaqItems,
  getCountryCodes,
  getCountryLabel,
  getCountryName,
  isJointControl,
  type CompanyFaqInput,
} from "@/lib/company-faq"

const EM_DASH = "\u2014"

function pytania(input: CompanyFaqInput): string[] {
  return buildCompanyFaqItems(input).map((i) => i.question)
}

function odpowiedz(input: CompanyFaqInput, poczatekPytania: string): string | undefined {
  return buildCompanyFaqItems(input).find((i) => i.question.startsWith(poczatekPytania))?.answer
}

const POLSKA: CompanyFaqInput = {
  brandName: "Dino",
  country_code: "PL",
  owner_name: "Tomasz Biernacki",
  ownership_description: "Większość akcji ma założyciel sieci.",
  business_description: "Sieć supermarketów w mniejszych miejscowościach.",
  categoryName: "Supermarkety",
  adres: "ul. Ostrowska 122, 63-700 Krotoszyn",
  siedziba_pl: true,
  founded_at: "1999-03-15",
  age: 27,
}

const ZAGRANICZNA: CompanyFaqInput = {
  brandName: "Lidl",
  country_code: "DE",
  owner_name: "Schwarz Gruppe",
  ownership_description: "Należy do niemieckiej grupy Schwarz.",
  business_description: "Sieć dyskontów spożywczych.",
  categoryName: "Dyskonty",
  siedziba_pl: true,
}

describe("buildCompanyFaqItems", () => {
  it("firma polska: komplet pięciu pytań w stałej kolejności", () => {
    expect(pytania(POLSKA)).toEqual([
      "Czy Dino to polska firma?",
      "Kto jest właścicielem Dino?",
      "Gdzie Dino ma siedzibę?",
      "Czym zajmuje się Dino?",
      "Od kiedy Dino działa w Polsce?",
    ])
  })

  it("firma polska: odpowiedź „Tak” z opisem struktury właścicielskiej", () => {
    expect(odpowiedz(POLSKA, "Czy")).toBe(
      "Tak, Dino to polska firma. Kapitał firmy pochodzi z Polski. Większość akcji ma założyciel sieci.",
    )
    expect(odpowiedz(POLSKA, "Kto")).toBe(
      "Właścicielem firmy Dino jest Tomasz Biernacki. Większość akcji ma założyciel sieci.",
    )
    expect(odpowiedz(POLSKA, "Gdzie")).toBe(
      "Siedziba firmy Dino w Polsce znajduje się pod adresem: ul. Ostrowska 122, 63-700 Krotoszyn.",
    )
    expect(odpowiedz(POLSKA, "Czym")).toBe(
      "Sieć supermarketów w mniejszych miejscowościach. Firma jest sklasyfikowana w kategorii: Supermarkety.",
    )
    expect(odpowiedz(POLSKA, "Od kiedy")).toBe(
      "Dino jest obecna na polskim rynku od 1999 roku, co oznacza ponad 27 lat działalności w Polsce.",
    )
  })

  it("kod kraju małymi literami też jest rozpoznany jako Polska", () => {
    expect(odpowiedz({ brandName: "X", country_code: "pl" }, "Czy")).toMatch(/^Tak, X to polska firma\./)
  })

  it("firma zagraniczna: „Nie” i nazwa kraju po polsku", () => {
    expect(odpowiedz(ZAGRANICZNA, "Czy")).toBe(
      "Nie, Lidl to firma zagraniczna. Kapitał firmy pochodzi z kraju: Niemcy. Należy do niemieckiej grupy Schwarz.",
    )
  })

  it("firma zagraniczna bez adresu, ale z siedzibą w PL", () => {
    expect(odpowiedz(ZAGRANICZNA, "Gdzie")).toBe("Lidl posiada zarejestrowaną siedzibę na terenie Polski.")
  })

  it("siedziba_pl = false: firma bez siedziby w Polsce", () => {
    expect(odpowiedz({ brandName: "Temu", country_code: "CN", siedziba_pl: false }, "Gdzie")).toBe(
      "Temu nie posiada zarejestrowanej siedziby w Polsce.",
    )
  })

  it("wspólna kontrola 50/50 dwóch krajów zagranicznych (country_code_2)", () => {
    expect(odpowiedz({ brandName: "JV", country_code: "DE", country_code_2: "CH" }, "Czy")).toBe(
      "Nie, JV to firma zagraniczna. Kontrolę sprawuje wspólnie kapitał z dwóch krajów (50/50): Niemcy i Szwajcaria.",
    )
  })

  it("JV 50/50 z Polską (reguła B5: country_code = kraj zagraniczny, country_code_2 = PL) to firma zagraniczna", () => {
    expect(odpowiedz({ brandName: "JV", country_code: "DE", country_code_2: "PL" }, "Czy")).toBe(
      "Nie, JV to firma zagraniczna. Kontrolę sprawuje wspólnie kapitał z dwóch krajów (50/50): Niemcy i Polska.",
    )
  })

  it("country_code_2 równy głównemu krajowi to nie jest wspólna kontrola", () => {
    expect(odpowiedz({ brandName: "X", country_code: "DE", country_code_2: "de" }, "Czy")).toBe(
      "Nie, X to firma zagraniczna. Kapitał firmy pochodzi z kraju: Niemcy.",
    )
  })

  it("brak kodu kraju: odpowiedź z „Brak danych”, bez wywrócenia", () => {
    expect(odpowiedz({ brandName: "X", country_code: null }, "Czy")).toBe(
      "Nie, X to firma zagraniczna. Kapitał firmy pochodzi z kraju: Brak danych.",
    )
  })

  it("firma bez opisów: tylko pytanie o pochodzenie", () => {
    const faq = buildCompanyFaqItems({ brandName: "Pusta", country_code: "PL" })
    expect(faq).toEqual([
      {
        question: "Czy Pusta to polska firma?",
        answer: "Tak, Pusta to polska firma. Kapitał firmy pochodzi z Polski.",
      },
    ])
  })

  it("właściciel z parent_company_name, gdy brak owner_name", () => {
    expect(odpowiedz({ brandName: "X", country_code: "FR", parent_company_name: "Groupe Y" }, "Kto")).toBe(
      "Właścicielem firmy X jest Groupe Y.",
    )
  })

  it("sam opis struktury, bez nazwy właściciela", () => {
    expect(odpowiedz({ brandName: "X", country_code: "PL", ownership_description: "Spółka rodzinna." }, "Kto")).toBe(
      "Spółka rodzinna.",
    )
  })

  it("sama kategoria, bez opisu działalności", () => {
    expect(odpowiedz({ brandName: "X", country_code: "PL", categoryName: "Napoje" }, "Czym")).toBe(
      "X działa w kategorii Napoje.",
    )
  })

  it("sam opis działalności, bez kategorii: bez dopisku o kategorii", () => {
    expect(odpowiedz({ brandName: "X", country_code: "PL", business_description: "Robi soki." }, "Czym")).toBe(
      "Robi soki.",
    )
  })

  it("pytanie o rok założenia tylko przy dodatnim wieku i dacie", () => {
    expect(pytania({ brandName: "X", founded_at: "2026-01-10", age: 0 })).not.toContain("Od kiedy X działa w Polsce?")
    expect(pytania({ brandName: "X", founded_at: "2001-01-10" })).not.toContain("Od kiedy X działa w Polsce?")
    expect(pytania({ brandName: "X", age: 10 })).not.toContain("Od kiedy X działa w Polsce?")
  })

  it("w wygenerowanych pytaniach i odpowiedziach nie ma em-dashy", () => {
    const warianty: CompanyFaqInput[] = [
      POLSKA,
      ZAGRANICZNA,
      { brandName: "JV", country_code: "DE", country_code_2: "PL", siedziba_pl: false, categoryName: "Energia" },
      { brandName: "Pusta" },
      { brandName: "X", country_code: "GB", parent_company_name: "Y plc", founded_at: "1990-06-01", age: 36 },
    ]
    for (const wariant of warianty) {
      for (const { question, answer } of buildCompanyFaqItems(wariant)) {
        expect(question).not.toContain(EM_DASH)
        expect(answer).not.toContain(EM_DASH)
      }
    }
  })
})

describe("kraje w FAQ", () => {
  it("getCountryName: nazwa po polsku, UK jako alias GB, nieznany kod bez zmian", () => {
    expect(getCountryName("DE")).toBe("Niemcy")
    expect(getCountryName("de")).toBe("Niemcy")
    expect(getCountryName("UK")).toBe("Wielka Brytania")
    expect(getCountryName("GB")).toBe("Wielka Brytania")
    expect(getCountryName("XX")).toBe("XX")
    expect(getCountryName(null)).toBe("Brak danych")
    expect(getCountryName("")).toBe("Brak danych")
  })

  it("getCountryCodes: wielkie litery, przycięcie, bez duplikatu i bez drugiego kraju bez pierwszego", () => {
    expect(getCountryCodes(" de ", " ch ")).toEqual(["DE", "CH"])
    expect(getCountryCodes("DE", "DE")).toEqual(["DE"])
    expect(getCountryCodes("DE", null)).toEqual(["DE"])
    expect(getCountryCodes(null, "PL")).toEqual([])
    expect(getCountryCodes("  ", "PL")).toEqual([])
  })

  it("getCountryLabel i isJointControl", () => {
    expect(getCountryLabel("DE", "CH")).toBe("Niemcy i Szwajcaria")
    expect(getCountryLabel("FR")).toBe("Francja")
    expect(getCountryLabel(null)).toBe("Brak danych")
    expect(isJointControl("DE", "PL")).toBe(true)
    expect(isJointControl("DE", "de")).toBe(false)
    expect(isJointControl("DE")).toBe(false)
  })
})
