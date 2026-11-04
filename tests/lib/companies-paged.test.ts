import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ROZMIAR_STRONY, pobierzWszystkieFirmy, pobierzWszystkieFirmyRest } from "@/lib/companies-paged"

// Testy nie dotykają prawdziwej bazy. Atrapa udaje Supabase z `db-max-rows = 1000`:
// każde zapytanie zwraca co najwyżej 1000 wierszy, niezależnie od żądanego zakresu.

type Wiersz = { id: number }

function tabela(liczba: number): Wiersz[] {
  return Array.from({ length: liczba }, (_, i) => ({ id: i + 1 }))
}

function wycinek(wiersze: Wiersz[], od: number, do_: number): Wiersz[] {
  return wiersze.slice(od, Math.min(do_ + 1, od + ROZMIAR_STRONY))
}

// ── Atrapa klienta supabase-js ────────────────────────────────────────────────

interface Wywolanie {
  tabela: string
  select: string
  order: unknown[][]
  eq: unknown[][]
  range: [number, number]
}

type Odpowiedz = { data: Wiersz[] | null; error: { message: string } | null }

/**
 * Klient z łańcuchem `from().select().order().eq().range()`. `odpowiedz` dostaje numer
 * strony i zakres, a zwraca to, co Supabase oddałby dla tego `.range()`.
 */
function atrapaKlienta(odpowiedz: (strona: number, od: number, do_: number) => Odpowiedz) {
  const wywolania: Wywolanie[] = []
  const klient = {
    from(nazwa: string) {
      const w: Wywolanie = { tabela: nazwa, select: "", order: [], eq: [], range: [-1, -1] }
      const builder = {
        select(kolumny: string) {
          w.select = kolumny
          return builder
        },
        order(...arg: unknown[]) {
          w.order.push(arg)
          return builder
        },
        eq(...arg: unknown[]) {
          w.eq.push(arg)
          return builder
        },
        range(od: number, do_: number) {
          w.range = [od, do_]
          const strona = wywolania.length
          wywolania.push(w)
          return Promise.resolve(odpowiedz(strona, od, do_))
        },
      }
      return builder
    },
  }
  return { klient, wywolania }
}

function klientZTabela(liczba: number) {
  const wiersze = tabela(liczba)
  return atrapaKlienta((_, od, do_) => ({ data: wycinek(wiersze, od, do_), error: null }))
}

describe("pobierzWszystkieFirmy (supabase-js)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("ROZMIAR_STRONY odpowiada db-max-rows = 1000", () => {
    expect(ROZMIAR_STRONY).toBe(1000)
  })

  it("pusta tabela: jedno zapytanie, 0 wierszy, complete", async () => {
    const { klient, wywolania } = klientZTabela(0)
    const wynik = await pobierzWszystkieFirmy(klient, "id", { etykieta: "test" })
    expect(wynik).toEqual({ rows: [], complete: true })
    expect(wywolania.map((w) => w.range)).toEqual([[0, 999]])
  })

  it("mniej niż strona (999): jedno zapytanie", async () => {
    const { klient, wywolania } = klientZTabela(999)
    const wynik = await pobierzWszystkieFirmy<Wiersz>(klient, "id", { etykieta: "test" })
    expect(wynik.rows).toHaveLength(999)
    expect(wynik.complete).toBe(true)
    expect(wywolania).toHaveLength(1)
  })

  it("dokładnie 1000 wierszy: pyta o drugą stronę i dostaje pustą", async () => {
    const { klient, wywolania } = klientZTabela(1000)
    const wynik = await pobierzWszystkieFirmy<Wiersz>(klient, "id", { etykieta: "test" })
    expect(wynik.rows).toHaveLength(1000)
    expect(wynik.complete).toBe(true)
    expect(wywolania.map((w) => w.range)).toEqual([
      [0, 999],
      [1000, 1999],
    ])
  })

  it("1555 firm (stan bazy z błędu sitemapy): wszystkie, nie ucięte do 1000", async () => {
    const { klient, wywolania } = klientZTabela(1555)
    const wynik = await pobierzWszystkieFirmy<Wiersz>(klient, "id", { etykieta: "test" })
    expect(wynik.complete).toBe(true)
    expect(wynik.rows).toHaveLength(1555)
    expect(wynik.rows.map((r) => r.id)).toEqual(tabela(1555).map((r) => r.id))
    expect(wywolania.map((w) => w.range)).toEqual([
      [0, 999],
      [1000, 1999],
    ])
  })

  it("2500 firm: trzy strony w kolejności, bez duplikatów", async () => {
    const { klient, wywolania } = klientZTabela(2500)
    const wynik = await pobierzWszystkieFirmy<Wiersz>(klient, "id", { etykieta: "test" })
    expect(wynik.complete).toBe(true)
    expect(wynik.rows).toHaveLength(2500)
    expect(new Set(wynik.rows.map((r) => r.id)).size).toBe(2500)
    expect(wywolania.map((w) => w.range)).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
  })

  it("czyta tabelę companies z podanym selectem", async () => {
    const { klient, wywolania } = klientZTabela(10)
    await pobierzWszystkieFirmy(klient, "id, slug, name", { etykieta: "test" })
    expect(wywolania[0].tabela).toBe("companies")
    expect(wywolania[0].select).toBe("id, slug, name")
  })

  it("błąd na 2. stronie: complete = false i tylko wiersze z 1. strony", async () => {
    const wiersze = tabela(2500)
    const { klient, wywolania } = atrapaKlienta((strona, od, do_) =>
      strona === 1 ? { data: null, error: { message: "timeout" } } : { data: wycinek(wiersze, od, do_), error: null },
    )
    const wynik = await pobierzWszystkieFirmy<Wiersz>(klient, "id", { etykieta: "test" })
    expect(wynik.complete).toBe(false)
    expect(wynik.rows).toHaveLength(1000)
    // Po błędzie nie pytamy o kolejne strony.
    expect(wywolania).toHaveLength(2)
    expect(console.error).toHaveBeenCalled()
  })

  it("brak danych bez błędu (data = null) też znaczy niepełny odczyt", async () => {
    const { klient } = atrapaKlienta((strona) =>
      strona === 0 ? { data: tabela(1000), error: null } : { data: null, error: null },
    )
    const wynik = await pobierzWszystkieFirmy<Wiersz>(klient, "id", { etykieta: "test" })
    expect(wynik).toMatchObject({ complete: false })
    expect(wynik.rows).toHaveLength(1000)
  })

  it("błąd na 1. stronie: pusta lista i complete = false", async () => {
    const { klient } = atrapaKlienta(() => ({ data: null, error: { message: "boom" } }))
    expect(await pobierzWszystkieFirmy(klient, "id", { etykieta: "test" })).toEqual({ rows: [], complete: false })
  })

  it("bezpiecznik: po 100 pełnych stronach przerywa z complete = false", async () => {
    // Serwer, który w kółko oddaje pełną stronę (np. niestabilna kolejność bez tiebreakera).
    const pelna = tabela(ROZMIAR_STRONY)
    const { klient, wywolania } = atrapaKlienta(() => ({ data: pelna, error: null }))
    const wynik = await pobierzWszystkieFirmy<Wiersz>(klient, "id", { etykieta: "test" })
    expect(wynik.complete).toBe(false)
    expect(wywolania).toHaveLength(100)
    expect(wynik.rows).toHaveLength(100 * ROZMIAR_STRONY)
    expect(wywolania.at(-1)!.range).toEqual([99_000, 99_999])
  })

  it("dostrojZapytanie trafia do KAŻDEJ strony, razem z tiebreakerem id", async () => {
    const { klient, wywolania } = klientZTabela(2500)
    await pobierzWszystkieFirmy(klient, "id, name", {
      etykieta: "test",
      dostrojZapytanie: (q) => q.order("name", { ascending: true }).order("id", { ascending: true }).eq("x", 1),
    })
    expect(wywolania).toHaveLength(3)
    for (const w of wywolania) {
      expect(w.order).toEqual([
        ["name", { ascending: true }],
        ["id", { ascending: true }],
      ])
      expect(w.eq).toEqual([["x", 1]])
    }
  })

  it("bez dostrojZapytanie nie dokłada własnego sortowania (tiebreaker to obowiązek wywołującego)", async () => {
    const { klient, wywolania } = klientZTabela(5)
    await pobierzWszystkieFirmy(klient, "id")
    expect(wywolania[0].order).toEqual([])
  })

  it("wyjątek klienta (np. zerwane połączenie) nie jest łapany, tylko propaguje się wyżej", async () => {
    const klient = {
      from: () => ({
        select: () => ({ range: () => Promise.reject(new Error("fetch failed")) }),
      }),
    }
    await expect(pobierzWszystkieFirmy(klient, "id", { etykieta: "test" })).rejects.toThrow("fetch failed")
  })
})

// ── Atrapa fetch dla wariantu REST ────────────────────────────────────────────

function odpowiedzJson(dane: unknown, status = 200): Response {
  return new Response(JSON.stringify(dane), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

/** Atrapa PostgREST: czyta `limit` i `offset` z URL-a i oddaje odpowiedni wycinek. */
function fetchZTabela(liczba: number, bledy: Record<number, number> = {}) {
  const wiersze = tabela(liczba)
  const atrapa = vi.fn(async (wejscie: string | URL | Request, _init?: RequestInit) => {
    const url = new URL(String(wejscie))
    const offset = Number(url.searchParams.get("offset") ?? 0)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? ROZMIAR_STRONY), ROZMIAR_STRONY)
    const strona = atrapa.mock.calls.length - 1
    if (bledy[strona]) return new Response("blad serwera", { status: bledy[strona] })
    return odpowiedzJson(wiersze.slice(offset, offset + limit))
  })
  vi.stubGlobal("fetch", atrapa)
  return atrapa
}

const OPCJE_REST = { supabaseUrl: "https://atrapa.supabase.co", supabaseKey: "klucz-testowy", etykieta: "test" }

function adresy(atrapa: ReturnType<typeof fetchZTabela>): URL[] {
  return atrapa.mock.calls.map(([wejscie]) => new URL(String(wejscie)))
}

describe("pobierzWszystkieFirmyRest (PostgREST przez fetch)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("pusta tabela: jedno zapytanie, complete", async () => {
    const atrapa = fetchZTabela(0)
    expect(await pobierzWszystkieFirmyRest("id", OPCJE_REST)).toEqual({ rows: [], complete: true })
    expect(atrapa).toHaveBeenCalledTimes(1)
  })

  it.each([
    [1000, 2],
    [1555, 2],
    [2500, 3],
  ])("%i firm: %i zapytań i komplet wierszy", async (liczba, zapytan) => {
    const atrapa = fetchZTabela(liczba)
    const wynik = await pobierzWszystkieFirmyRest<Wiersz>("id", OPCJE_REST)
    expect(wynik.complete).toBe(true)
    expect(wynik.rows).toHaveLength(liczba)
    expect(new Set(wynik.rows.map((r) => r.id)).size).toBe(liczba)
    expect(atrapa).toHaveBeenCalledTimes(zapytan)
  })

  it("każda strona ma własny URL z limit i offset (cache Next.js nie skleja stron)", async () => {
    const atrapa = fetchZTabela(2500)
    await pobierzWszystkieFirmyRest("id", OPCJE_REST)
    const urle = adresy(atrapa)
    expect(urle.map((u) => [u.searchParams.get("limit"), u.searchParams.get("offset")])).toEqual([
      ["1000", "0"],
      ["1000", "1000"],
      ["1000", "2000"],
    ])
    expect(new Set(urle.map(String)).size).toBe(3)
  })

  it("bez własnego order= dokłada tiebreaker order=id.asc", async () => {
    const atrapa = fetchZTabela(10)
    await pobierzWszystkieFirmyRest("country_code,categories(name,slug)", OPCJE_REST)
    const url = adresy(atrapa)[0]
    expect(url.origin + url.pathname).toBe("https://atrapa.supabase.co/rest/v1/companies")
    expect(url.searchParams.get("select")).toBe("country_code,categories(name,slug)")
    expect(url.searchParams.getAll("order")).toEqual(["id.asc"])
  })

  it("dokłada order=id.asc także obok innych parametrów", async () => {
    const atrapa = fetchZTabela(10)
    await pobierzWszystkieFirmyRest("id", { ...OPCJE_REST, parametry: "country_code=eq.PL" })
    const url = adresy(atrapa)[0]
    expect(url.searchParams.get("country_code")).toBe("eq.PL")
    expect(url.searchParams.getAll("order")).toEqual(["id.asc"])
  })

  it("własne order= zostawia bez zmian (bez dublowania order)", async () => {
    const atrapa = fetchZTabela(10)
    await pobierzWszystkieFirmyRest("id", { ...OPCJE_REST, parametry: "order=name.asc,id.asc" })
    expect(adresy(atrapa)[0].searchParams.getAll("order")).toEqual(["name.asc,id.asc"])
  })

  it("poza podglądem filtruje tylko opublikowane firmy (published=eq.true)", async () => {
    const atrapa = fetchZTabela(10)
    await pobierzWszystkieFirmyRest("id", OPCJE_REST)
    expect(adresy(atrapa)[0].searchParams.get("published")).toBe("eq.true")
  })

  it("na podglądzie Vercel (VERCEL_ENV=preview) pokazuje też nieopublikowane", async () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.resetModules()
    const modul = await import("@/lib/companies-paged")
    const atrapa = fetchZTabela(10)
    await modul.pobierzWszystkieFirmyRest("id", OPCJE_REST)
    expect(adresy(atrapa)[0].searchParams.has("published")).toBe(false)
  })

  it("wysyła klucz w nagłówkach i zachowuje init trasy (next.revalidate)", async () => {
    const atrapa = fetchZTabela(10)
    await pobierzWszystkieFirmyRest("id", { ...OPCJE_REST, init: { next: { revalidate: 300 } } })
    const init = atrapa.mock.calls[0][1] as RequestInit & { next?: { revalidate?: number } }
    expect(init.next).toEqual({ revalidate: 300 })
    expect(init.headers).toEqual({
      apikey: "klucz-testowy",
      Authorization: "Bearer klucz-testowy",
      Accept: "application/json",
    })
  })

  it("błąd HTTP na 2. stronie: complete = false i wiersze z 1. strony", async () => {
    const atrapa = fetchZTabela(2500, { 1: 500 })
    const wynik = await pobierzWszystkieFirmyRest<Wiersz>("id", OPCJE_REST)
    expect(wynik.complete).toBe(false)
    expect(wynik.rows).toHaveLength(1000)
    expect(atrapa).toHaveBeenCalledTimes(2)
    expect(console.error).toHaveBeenCalled()
  })

  it("błąd HTTP na 1. stronie: pusta lista i complete = false", async () => {
    fetchZTabela(2500, { 0: 503 })
    expect(await pobierzWszystkieFirmyRest("id", OPCJE_REST)).toEqual({ rows: [], complete: false })
  })

  it("bezpiecznik: po 100 pełnych stronach przerywa z complete = false", async () => {
    const pelna = tabela(ROZMIAR_STRONY)
    const atrapa = vi.fn(async () => odpowiedzJson(pelna))
    vi.stubGlobal("fetch", atrapa)
    const wynik = await pobierzWszystkieFirmyRest("id", OPCJE_REST)
    expect(wynik.complete).toBe(false)
    expect(atrapa).toHaveBeenCalledTimes(100)
  })
})
