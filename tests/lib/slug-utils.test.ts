import { describe, expect, it } from "vitest"
import { cleanAddress, displayNameFromSlug, resolveDisplayName, slugify } from "@/lib/slug-utils"

describe("slugify", () => {
  it.each([
    // Przykłady z komentarza w lib/slug-utils.ts
    ["50 Style", "50-style"],
    ["DM (Drogerie Markt)", "dm-drogerie-markt"],
    ["Dr. Max", "dr-max"],
    ["Mrówka", "mrowka"],
    ["TaniaKsiazka.pl", "taniaksiazka-pl"],
    // Polskie znaki, także wielkie
    ["Żabka", "zabka"],
    ["Łomża", "lomza"],
    ["ŁOMŻA", "lomza"],
    ["Zażółć gęślą jaźń", "zazolc-gesla-jazn"],
    ["Śnieżka", "sniezka"],
    // Inne akcenty
    ["L'Oréal", "l-oreal"],
    ["Müller", "muller"],
    ["Nestlé", "nestle"],
    // Separatory
    ["Procter & Gamble", "procter-gamble"],
    ["  Biedronka  ", "biedronka"],
    ["e-obuwie", "e-obuwie"],
    ["a -- b", "a-b"],
    ["(Grupa) / X.", "grupa-x"],
  ])("%s -> %s", (nazwa, slug) => {
    expect(slugify(nazwa)).toBe(slug)
  })

  it("pusty albo same separatory dają pusty slug", () => {
    expect(slugify("")).toBe("")
    expect(slugify("   ")).toBe("")
    expect(slugify("---")).toBe("")
    expect(slugify("&&&")).toBe("")
  })

  it("brakująca wartość z bazy (null) nie wywraca funkcji", () => {
    expect(slugify(null as unknown as string)).toBe("")
  })

  it("polska litera w NFD daje ten sam slug co w NFC", () => {
    expect(slugify("Żabka".normalize("NFD"))).toBe("zabka")
  })

  it("jest idempotentna: slug sluga to ten sam slug", () => {
    for (const nazwa of ["DM (Drogerie Markt)", "Dr. Max", "Łomża", "L'Oréal", "TaniaKsiazka.pl"]) {
      const raz = slugify(nazwa)
      expect(slugify(raz)).toBe(raz)
    }
  })

  it("wynik zawiera tylko [a-z0-9] i pojedyncze dywizy w środku", () => {
    for (const nazwa of ["  --Ćma & Ćmy!!  ", "ÀÉÎÕÜ", "a//b\\\\c", "Ąę 123 ŻŹ"]) {
      expect(slugify(nazwa)).toMatch(/^([a-z0-9]+(-[a-z0-9]+)*)?$/)
    }
  })
})

describe("displayNameFromSlug", () => {
  it("czysty slug kebab-case zamienia na nazwę z wielkimi literami", () => {
    expect(displayNameFromSlug("biedronka")).toBe("Biedronka")
    expect(displayNameFromSlug("polkomtel-plus")).toBe("Polkomtel Plus")
  })

  it("surowy slug z bazy, który wygląda na nazwę marki, zostaje bez zmian", () => {
    expect(displayNameFromSlug("50 Style")).toBe("50 Style")
    expect(displayNameFromSlug("DM (Drogerie Markt)")).toBe("DM (Drogerie Markt)")
    expect(displayNameFromSlug("Dr. Max")).toBe("Dr. Max")
    expect(displayNameFromSlug("Mrówka")).toBe("Mrówka")
    expect(displayNameFromSlug(" Mrówka ")).toBe("Mrówka")
  })
})

describe("resolveDisplayName", () => {
  it("display_name z bazy ma pierwszeństwo (przycięty)", () => {
    expect(resolveDisplayName("Żabka", "zabka", "Żabka Polska sp. z o.o.")).toBe("Żabka")
    expect(resolveDisplayName("  PKO BP ", "pko-bp", "PKO Bank Polski")).toBe("PKO BP")
  })

  it("pusty albo brakujący display_name: nazwa ze sluga", () => {
    expect(resolveDisplayName(null, "biedronka", "Jeronimo Martins")).toBe("Biedronka")
    expect(resolveDisplayName(undefined, "polkomtel-plus")).toBe("Polkomtel Plus")
    expect(resolveDisplayName("", "Dr. Max", "Dr.Max sp. z o.o.")).toBe("Dr. Max")
    expect(resolveDisplayName("   ", "biedronka", "X")).toBe("Biedronka")
  })

  it("bez display_name i sluga: nazwa spółki (przycięta)", () => {
    expect(resolveDisplayName(null, null, "  Jeronimo Martins  ")).toBe("Jeronimo Martins")
    expect(resolveDisplayName(null, "", "Jeronimo Martins")).toBe("Jeronimo Martins")
  })

  it("bez żadnych danych: pusty łańcuch", () => {
    expect(resolveDisplayName(null, null, null)).toBe("")
    expect(resolveDisplayName(undefined, undefined)).toBe("")
  })

  // Był błąd: slug złożony z samych spacji jest „prawdziwy”, więc funkcja nie sięga po nazwę
  // spółki, a displayNameFromSlug("   ") zwraca "". Firma dostałaby pusty H1 i tytuł.
  // Komentarz obiecuje kolejność display_name -> slug -> name, czyli tu "Jeronimo Martins".
  // Naprawione w lib/slug-utils.ts (2026-11-05).
  it("slug z samych spacji: wraca nazwa spółki", () => {
    expect(resolveDisplayName(null, "   ", "Jeronimo Martins")).toBe("Jeronimo Martins")
  })
})

describe("cleanAddress", () => {
  it.each([
    ["ul. ul. Żniwna 5", "ul. Żniwna 5"],
    ["al. al. Jerozolimskie 100", "al. Jerozolimskie 100"],
    ["pl. pl. Grunwaldzki 1", "pl. Grunwaldzki 1"],
    ["os. os. Kosmonautów 3", "os. Kosmonautów 3"],
    ["Ul. ul. Żniwna 5", "Ul. Żniwna 5"],
    ["00-001 Warszawa, ul. ul. Prosta 1", "00-001 Warszawa, ul. Prosta 1"],
    ["al. al.Jerozolimskie 100", "al. Jerozolimskie 100"],
  ])("%s -> %s", (wejscie, wynik) => {
    expect(cleanAddress(wejscie)).toBe(wynik)
  })

  it("poprawny adres zostaje bez zmian", () => {
    expect(cleanAddress("ul. Żniwna 5, 62-080 Tarnowo Podgórne")).toBe("ul. Żniwna 5, 62-080 Tarnowo Podgórne")
    // Różne prefiksy to nie dubel.
    expect(cleanAddress("pl. al. Coś 1")).toBe("pl. al. Coś 1")
  })

  it("null, undefined i pusty łańcuch przechodzą bez zmian", () => {
    expect(cleanAddress(null)).toBeNull()
    expect(cleanAddress(undefined)).toBeUndefined()
    expect(cleanAddress("")).toBe("")
  })
})
