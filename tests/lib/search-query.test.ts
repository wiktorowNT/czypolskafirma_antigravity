import { describe, expect, it } from "vitest"
import {
  kluczPorownania,
  oczyscZapytanie,
  posortujWedlugTrafnosci,
  przygotujFiltrSzukania,
  wzorzecIlike,
} from "@/lib/search-query"

// Po oczyszczeniu w zapytaniu mogą zostać tylko te znaki (biała lista z lib/search-query.ts).
const TYLKO_BIALA_LISTA = /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ -]*$/

describe("oczyscZapytanie", () => {
  it("zwraca pusty łańcuch dla pustego wejścia", () => {
    expect(oczyscZapytanie("")).toBe("")
    expect(oczyscZapytanie("   ")).toBe("")
  })

  it("zostawia zwykłe zapytanie bez zmian", () => {
    expect(oczyscZapytanie("Biedronka")).toBe("Biedronka")
    expect(oczyscZapytanie("PKO BP")).toBe("PKO BP")
  })

  it("usuwa przecinek i nawias, które rozbijały filtr PostgREST (zabka, / zabka))", () => {
    expect(oczyscZapytanie("zabka,")).toBe("zabka")
    expect(oczyscZapytanie("zabka)")).toBe("zabka")
    expect(oczyscZapytanie("(zabka)")).toBe("zabka")
    expect(oczyscZapytanie("a,b")).toBe("a b")
  })

  it("zamienia kropkę na spację: „Dr. Oetker” -> „Dr Oetker”", () => {
    expect(oczyscZapytanie("Dr. Oetker")).toBe("Dr Oetker")
    expect(oczyscZapytanie("Dr.Max")).toBe("Dr Max")
  })

  it("usuwa znaki specjalne PostgREST i URL-a", () => {
    for (const znak of ["*", "%", ":", "&", "=", "?", "#", "'", '"', "\\", "/", ";", "|", "{", "}", "[", "]"]) {
      expect(oczyscZapytanie(`ab${znak}cd`)).toBe("ab cd")
    }
  })

  it("po oczyszczeniu zostają tylko znaki z białej listy", () => {
    const zlosliwe = [
      "name.ilike.*x*),slug.eq.(y",
      "a)or(id.gt.0",
      "zabka%2C",
      "<script>alert(1)</script>",
      "Zażółć gęślą jaźń!!!",
      "tab\tnowa\nlinia",
      "spacja niełamliwa",
      "emoji 🍺 piwo",
    ]
    for (const z of zlosliwe) {
      const wynik = oczyscZapytanie(z)
      expect(wynik).toMatch(TYLKO_BIALA_LISTA)
      expect(wynik).not.toMatch(/^\s|\s$|\s{2}/)
    }
  })

  it("zachowuje polskie znaki (małe i wielkie)", () => {
    expect(oczyscZapytanie("Zażółć gęślą jaźń")).toBe("Zażółć gęślą jaźń")
    expect(oczyscZapytanie("ŻABKA ŁOMŻA ŚNIEŻKA")).toBe("ŻABKA ŁOMŻA ŚNIEŻKA")
  })

  it("normalizuje do NFC: „Żabka” zapisana jako Z + kropka łącząca zostaje „Żabką”", () => {
    const nfd = "Żabka".normalize("NFD")
    expect(nfd).not.toBe("Żabka")
    expect(oczyscZapytanie(nfd)).toBe("Żabka")
    expect(oczyscZapytanie("Łomża".normalize("NFD"))).toBe("Łomża")
  })

  it("akcenty spoza polskiego alfabetu stają się spacją („L'Oréal” -> „L Or al”)", () => {
    expect(oczyscZapytanie("L'Oréal")).toBe("L Or al")
  })

  it("zostawia dywiz wewnątrz słowa", () => {
    expect(oczyscZapytanie("e-obuwie")).toBe("e-obuwie")
    expect(oczyscZapytanie("Coca-Cola HBC")).toBe("Coca-Cola HBC")
  })

  it("usuwa osamotnione dywizy na brzegach słów", () => {
    expect(oczyscZapytanie("-")).toBe("")
    expect(oczyscZapytanie("---")).toBe("")
    expect(oczyscZapytanie("-zabka")).toBe("zabka")
    expect(oczyscZapytanie("zabka-")).toBe("zabka")
    expect(oczyscZapytanie("--zabka--")).toBe("zabka")
    expect(oczyscZapytanie("a - b")).toBe("a b")
    expect(oczyscZapytanie("a -b c- d")).toBe("a b c d")
    // Dywiz przed usuniętym znakiem też ląduje na brzegu słowa.
    expect(oczyscZapytanie("zabka-)")).toBe("zabka")
  })

  it("zbija wielokrotne spacje i przycina brzegi", () => {
    expect(oczyscZapytanie("  Dr.   Oetker  ")).toBe("Dr Oetker")
  })

  it("ucina zapytanie do 80 znaków (przed oczyszczeniem)", () => {
    expect(oczyscZapytanie("a".repeat(200))).toHaveLength(80)
    expect(oczyscZapytanie("ż".repeat(81))).toBe("ż".repeat(80))
    // Limit liczy się od surowego wejścia: znaki po 80. pozycji nie wracają po oczyszczeniu.
    expect(oczyscZapytanie(",".repeat(79) + "abc")).toBe("a")
  })
})

describe("wzorzecIlike", () => {
  it("zamienia spacje na wildcard PostgREST *", () => {
    expect(wzorzecIlike("Dr Oetker")).toBe("Dr*Oetker")
    expect(wzorzecIlike("a b c")).toBe("a*b*c")
    expect(wzorzecIlike("zabka")).toBe("zabka")
  })

  it("ciąg spacji daje jeden wildcard", () => {
    expect(wzorzecIlike("a   b")).toBe("a*b")
  })
})

describe("przygotujFiltrSzukania", () => {
  it("„Dr. Oetker” daje wzorzec Dr*Oetker (znajduje „DR.OETKER POLSKA”)", () => {
    expect(przygotujFiltrSzukania("Dr. Oetker")).toEqual({
      oczyszczone: "Dr Oetker",
      zakodowane: "Dr*Oetker",
    })
  })

  it("„zabka)” i „zabka,” szukają Żabki zamiast zwracać pustą listę", () => {
    expect(przygotujFiltrSzukania("zabka)")).toEqual({ oczyszczone: "zabka", zakodowane: "zabka" })
    expect(przygotujFiltrSzukania("zabka,")).toEqual({ oczyszczone: "zabka", zakodowane: "zabka" })
  })

  it("koduje polskie znaki do URL-a", () => {
    expect(przygotujFiltrSzukania("Żabka")).toEqual({
      oczyszczone: "Żabka",
      zakodowane: "%C5%BBabka",
    })
    expect(decodeURIComponent(przygotujFiltrSzukania("Łomża Pełne")!.zakodowane)).toBe("Łomża*Pełne")
  })

  it("zakodowany wzorzec nie zawiera znaków składni filtra poza wildcardem", () => {
    const wynik = przygotujFiltrSzukania("a,b.c(d)e:f*g")!
    expect(decodeURIComponent(wynik.zakodowane)).toBe("a*b*c*d*e*f*g")
    expect(wynik.zakodowane).not.toMatch(/[,.():]/)
  })

  it("zwraca null, gdy po oczyszczeniu zostaje mniej niż minDlugosc znaków", () => {
    expect(przygotujFiltrSzukania("")).toBeNull()
    expect(przygotujFiltrSzukania("a")).toBeNull()
    expect(przygotujFiltrSzukania(")")).toBeNull()
    expect(przygotujFiltrSzukania("a)")).toBeNull()
    expect(przygotujFiltrSzukania(" - ")).toBeNull()
    expect(przygotujFiltrSzukania("ab")).not.toBeNull()
  })

  it("respektuje własne minDlugosc", () => {
    expect(przygotujFiltrSzukania("a", 1)).toEqual({ oczyszczone: "a", zakodowane: "a" })
    expect(przygotujFiltrSzukania("abc", 4)).toBeNull()
    expect(przygotujFiltrSzukania("abcd", 4)).not.toBeNull()
  })

  it("trzyma limit 80 znaków", () => {
    const wynik = przygotujFiltrSzukania("x".repeat(500))!
    expect(wynik.oczyszczone).toHaveLength(80)
    expect(wynik.zakodowane).toHaveLength(80)
  })
})

describe("kluczPorownania", () => {
  it.each([
    ["L'Oréal", "loreal"],
    ["Procter & Gamble", "proctergamble"],
    ["Żabka", "zabka"],
    ["ŻABKA", "zabka"],
    ["Łomża", "lomza"],
    ["ŁOMŻA", "lomza"],
    ["Dr. Oetker", "droetker"],
    ["Nestlé", "nestle"],
    ["Śnieżka", "sniezka"],
    ["Gęślą jaźń", "geslajazn"],
    ["e-obuwie", "eobuwie"],
    ["50 Style", "50style"],
  ])("%s -> %s", (wejscie, oczekiwane) => {
    expect(kluczPorownania(wejscie)).toBe(oczekiwane)
  })

  it("Żabka zapisana w NFC i NFD daje ten sam klucz", () => {
    expect(kluczPorownania("Żabka".normalize("NFD"))).toBe(kluczPorownania("Żabka"))
  })

  it("puste i brakujące wejście daje pusty klucz", () => {
    expect(kluczPorownania("")).toBe("")
    expect(kluczPorownania("!!! ...")).toBe("")
    expect(kluczPorownania(undefined as unknown as string)).toBe("")
  })
})

describe("posortujWedlugTrafnosci", () => {
  type Wynik = { id: string; brand?: string; matchedBrand?: string }

  it("układa wyniki w kolejności rang: równa marka, równy alias, prefiks, zawiera, reszta", () => {
    const wyniki: Wynik[] = [
      { id: "reszta", brand: "Garnier" },
      { id: "zawiera-alias", brand: "Grupa X", matchedBrand: "Super L'Oréal Paris" },
      { id: "zawiera", brand: "Grupa L'Oréal" },
      { id: "prefiks", brand: "L'Oréal Paris" },
      { id: "alias", brand: "Grupa L'Oréal Polska", matchedBrand: "L'OREAL" },
      { id: "rowna", brand: "L'Oréal" },
    ]
    const posortowane = posortujWedlugTrafnosci(wyniki, "L'Oréal")
    expect(posortowane.map((w) => w.id)).toEqual(["rowna", "alias", "prefiks", "zawiera-alias", "zawiera", "reszta"])
  })

  it("„L'Oréal” wskakuje na pierwsze miejsce spośród przypadkowych trafień wzorca L*Or*al", () => {
    const wyniki: Wynik[] = [
      ...Array.from({ length: 8 }, (_, i) => ({ id: `szum-${i}`, brand: `Lorem ${i} Oral` })),
      { id: "loreal", brand: "L'Oréal" },
    ]
    expect(posortujWedlugTrafnosci(wyniki, "L'Oréal")[0].id).toBe("loreal")
  })

  it("porównuje bez polskich znaków i wielkości liter", () => {
    const wyniki: Wynik[] = [
      { id: "inna", brand: "Abc" },
      { id: "zabka", brand: "Żabka" },
    ]
    expect(posortujWedlugTrafnosci(wyniki, "ZABKA").map((w) => w.id)).toEqual(["zabka", "inna"])
  })

  it("jest stabilne: w obrębie rangi zostaje kolejność z bazy", () => {
    const wyniki: Wynik[] = [
      { id: "r1", brand: "Coś" },
      { id: "p1", brand: "Żabka Nano" },
      { id: "r2", brand: "Inne" },
      { id: "p2", brand: "Żabka Jush" },
      { id: "r3", brand: "Jeszcze inne" },
      { id: "p3", brand: "Żabka Polska" },
    ]
    expect(posortujWedlugTrafnosci(wyniki, "żabka").map((w) => w.id)).toEqual(["p1", "p2", "p3", "r1", "r2", "r3"])
  })

  it("alias zaczynający się od zapytania to ranga „zawiera” (prefiks liczy się tylko dla marki)", () => {
    const wyniki: Wynik[] = [
      { id: "alias-prefiks", brand: "Grupa", matchedBrand: "Żabka Nano" },
      { id: "marka-zawiera", brand: "Nowa Żabka" },
    ]
    expect(posortujWedlugTrafnosci(wyniki, "zabka").map((w) => w.id)).toEqual(["alias-prefiks", "marka-zawiera"])
  })

  it("radzi sobie z brakującą marką i aliasem", () => {
    const wyniki: Wynik[] = [{ id: "pusta" }, { id: "zabka", brand: "Żabka" }]
    expect(posortujWedlugTrafnosci(wyniki, "zabka").map((w) => w.id)).toEqual(["zabka", "pusta"])
  })

  it("bez sensownego zapytania zwraca wyniki bez zmian", () => {
    const wyniki: Wynik[] = [{ id: "b", brand: "B" }, { id: "a", brand: "A" }]
    expect(posortujWedlugTrafnosci(wyniki, "")).toBe(wyniki)
    expect(posortujWedlugTrafnosci(wyniki, "!!!")).toBe(wyniki)
  })

  it("nie modyfikuje tablicy wejściowej", () => {
    const wyniki: Wynik[] = [{ id: "inna", brand: "Abc" }, { id: "zabka", brand: "Żabka" }]
    const kopia = [...wyniki]
    posortujWedlugTrafnosci(wyniki, "zabka")
    expect(wyniki).toEqual(kopia)
  })

  it("pusta lista daje pustą listę", () => {
    expect(posortujWedlugTrafnosci([], "zabka")).toEqual([])
  })
})
