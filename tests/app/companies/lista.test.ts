import { beforeEach, describe, expect, it, vi } from "vitest"

// dane.ts czyta bazę przez lib/supabase/server.ts. W testach podmieniamy klienta na
// atrapę, żeby nic nie łączyło się z prawdziwym Supabase.
const supabase = vi.hoisted(() => ({
  wiersze: [] as Record<string, unknown>[],
  blad: null as { message: string } | null,
  wyjatek: null as Error | null,
  order: [] as unknown[][],
}))

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => {
    if (supabase.wyjatek) throw supabase.wyjatek
    return {
      from: () => {
        const builder = {
          select: () => builder,
          order: (...arg: unknown[]) => {
            supabase.order.push(arg)
            return builder
          },
          range: async (od: number, do_: number) =>
            supabase.blad
              ? { data: null, error: supabase.blad }
              : { data: supabase.wiersze.slice(od, do_ + 1), error: null },
        }
        return builder
      },
    }
  },
}))

import { porownajMarki, sciezkaStrony, ADRES_PELNEJ_LISTY } from "@/app/companies/wspolne"
import { FIRM_NA_STRONE, liczbaStron, pobierzListeFirm } from "@/app/companies/dane"

describe("porownajMarki (wspólna kolejność serwera i przeglądarki)", () => {
  it("układa polskie litery po polsku: Ł po L, Ś po S, Ź i Ż po Z", () => {
    const marki = ["Żabka", "Zara", "Ziaja", "Łomża", "Lidl", "Mango", "Śnieżka", "Sokołów", "Tymbark", "Źródło", "Ćmielów", "Cropp", "Dino"]
    expect([...marki].sort(porownajMarki)).toEqual([
      "Cropp",
      "Ćmielów",
      "Dino",
      "Lidl",
      "Łomża",
      "Mango",
      "Sokołów",
      "Śnieżka",
      "Tymbark",
      "Zara",
      "Ziaja",
      "Źródło",
      "Żabka",
    ])
  })

  it("Ł nie ląduje za Z (jak przy porównaniu kodów znaków)", () => {
    expect(porownajMarki("Łomża", "Zara")).toBeLessThan(0)
    expect(porownajMarki("Żabka", "Zara")).toBeGreaterThan(0)
    expect(porownajMarki("Śnieżka", "Sokołów")).toBeGreaterThan(0)
    expect(porownajMarki("Śnieżka", "Tymbark")).toBeLessThan(0)
  })

  it("równe nazwy dają 0, a wielkość liter nie przestawia marek między literami", () => {
    expect(porownajMarki("Żabka", "Żabka")).toBe(0)
    expect([..."b A a B".split(" ")].sort(porownajMarki).map((s) => s.toLowerCase())).toEqual(["a", "a", "b", "b"])
  })
})

describe("sciezkaStrony", () => {
  it("strona 1 to samo /companies (bez duplikatu /strona/1)", () => {
    expect(sciezkaStrony(1)).toBe("/companies")
  })

  it("numery poniżej 1 też prowadzą do /companies", () => {
    expect(sciezkaStrony(0)).toBe("/companies")
    expect(sciezkaStrony(-5)).toBe("/companies")
  })

  it("kolejne strony pod /companies/strona/N", () => {
    expect(sciezkaStrony(2)).toBe("/companies/strona/2")
    expect(sciezkaStrony(16)).toBe("/companies/strona/16")
  })

  it("adres pełnej listy JSON", () => {
    expect(ADRES_PELNEJ_LISTY).toBe("/companies/lista.json")
  })
})

describe("liczbaStron", () => {
  it("100 firm na stronę", () => {
    expect(FIRM_NA_STRONE).toBe(100)
  })

  it.each([
    [0, 1],
    [1, 1],
    [99, 1],
    [100, 1],
    [101, 2],
    [200, 2],
    [1555, 16],
    [2500, 25],
  ])("%i firm -> %i stron", (firm, stron) => {
    expect(liczbaStron(firm)).toBe(stron)
  })
})

describe("pobierzListeFirm (z atrapą Supabase)", () => {
  beforeEach(() => {
    supabase.wiersze = []
    supabase.blad = null
    supabase.wyjatek = null
    supabase.order = []
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("sortuje po nazwie marki po polsku i mapuje wiersze na karty", async () => {
    supabase.wiersze = [
      { id: "3", name: "Żabka Polska sp. z o.o.", slug: "zabka", display_name: "Żabka", country_code: "LU", siedziba_pl: "Tak", vat_czynny: true, website_url: "https://zabka.pl" },
      { id: "1", name: "Lidl sp. z o.o.", slug: "lidl", display_name: null, country_code: "DE", siedziba_pl: false, vat_czynny: "Nie", website_url: null },
      { id: "2", name: "Browar Łomża", slug: "Łomża", display_name: "Łomża", country_code: "JP", siedziba_pl: true, vat_czynny: null },
    ]
    const { firmy, complete } = await pobierzListeFirm()
    expect(complete).toBe(true)
    expect(firmy.map((f) => f.brand)).toEqual(["Lidl", "Łomża", "Żabka"])
    expect(firmy[0]).toEqual({ id: "1", slug: "lidl", brand: "Lidl", country_code: "DE", website_url: undefined })
    // Surowy slug z bazy dostaje kanoniczną postać, flagi tylko gdy prawdziwe.
    expect(firmy[1]).toMatchObject({ slug: "lomza", headquartersInPL: true })
    expect(firmy[1]).not.toHaveProperty("vatActive")
    expect(firmy[2]).toMatchObject({ slug: "zabka", headquartersInPL: true, vatActive: true, website_url: "https://zabka.pl" })
  })

  it("czyta bazę z tiebreakerem id po name", async () => {
    supabase.wiersze = [{ id: "1", name: "A", slug: "a" }]
    await pobierzListeFirm()
    expect(supabase.order).toEqual([
      ["name", { ascending: true }],
      ["id", { ascending: true }],
    ])
  })

  it("firma bez sluga dostaje id jako slug; równe marki rozstrzyga id", async () => {
    supabase.wiersze = [
      { id: "b", name: "Marka", slug: null, display_name: "Marka" },
      { id: "a", name: "Marka", slug: null, display_name: "Marka" },
    ]
    const { firmy } = await pobierzListeFirm()
    expect(firmy.map((f) => [f.id, f.slug])).toEqual([
      ["a", "a"],
      ["b", "b"],
    ])
  })

  it("ponad 1000 firm: lista nie jest ucięta do jednej strony Supabase", async () => {
    supabase.wiersze = Array.from({ length: 1555 }, (_, i) => ({ id: String(i), name: `Firma ${i}`, slug: `firma-${i}` }))
    const { firmy, complete } = await pobierzListeFirm()
    expect(complete).toBe(true)
    expect(firmy).toHaveLength(1555)
    expect(liczbaStron(firmy.length)).toBe(16)
  })

  it("błąd bazy: complete = false", async () => {
    supabase.blad = { message: "timeout" }
    expect(await pobierzListeFirm()).toEqual({ firmy: [], complete: false })
  })

  it("wyjątek klienta: pusta lista i complete = false, bez wywrócenia strony", async () => {
    supabase.wyjatek = new Error("Missing Supabase environment variables")
    expect(await pobierzListeFirm()).toEqual({ firmy: [], complete: false })
  })
})
