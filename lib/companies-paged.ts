// Stronicowany odczyt tabeli `companies`.
//
// ── Po co ten plik istnieje ─────────────────────────────────────────────────
// Instancja Supabase ma ustawione `db-max-rows = 1000`: PostgREST zwraca maksymalnie
// 1000 wierszy na zapytanie i robi to CICHO — bez błędu, bez ostrzeżenia i bez niczego
// w odpowiedzi, co by to obcięcie pokazało. Własny `limit=` tego NIE podnosi, bo serwer
// bierze min(limit, db-max-rows): `.limit(20000)` też kończy się na 1000 wierszach.
//
// Przy 1555 firmach w bazie każde „pobierz wszystkie firmy i policz" bez stronicowania
// liczyło więc na obciętej próbce ~2/3 bazy, a wynik wyglądał na poprawny. Ten błąd
// trafił już sitemapę firm (commit 68862d5 — ucinało 555 firm), a potem /api/stats
// (publikowało total = 1000 przy 1555 w bazie) i liczniki firm na /kategorie.
// Żeby nie wracał przy każdym nowym miejscu, cały pełny odczyt `companies` idzie tędy.
//
// ── Czego tu NIE używać ─────────────────────────────────────────────────────
// To narzędzie do czytania CAŁEJ tabeli. Zapytania zawężone listą id, slugiem,
// `category_id` albo `limit` mniejszym od 1000 (np. /api/companies/by-ids, wyszukiwarki,
// „podobne firmy") mieszczą się w jednym zapytaniu i stronicowania nie potrzebują.
//
// ── Kompletność odpowiedzi ──────────────────────────────────────────────────
// Oba warianty zwracają `{ rows, complete }`. `complete = false` znaczy, że któraś
// strona padła i `rows` jest niepełne. Wywołujący MUSI to obsłużyć: przy statystykach
// lepiej nie pokazać nic niż opublikować liczbę policzoną na urwanej próbce.

import { FILTR_PUBLIKACJI } from "@/lib/publikacja"

/** Twardy limit wierszy na zapytanie (`db-max-rows` instancji Supabase). */
export const ROZMIAR_STRONY = 1000

/** Bezpiecznik: 100 stron = 100 000 firm. Chroni przed pętlą bez końca, gdy serwer
 *  zacznie zwracać pełne strony w kółko (np. niestabilna kolejność bez tiebreakera). */
const MAX_STRON = 100

export interface WynikStronicowania<T> {
  rows: T[]
  /** false = któraś strona padła, `rows` jest niepełne i nie wolno z niego liczyć statystyk. */
  complete: boolean
}

/**
 * Rdzeń stronicowania: woła `pobierzStrone(od, do)` tak długo, jak wraca pełna strona
 * (`do` to indeks ostatniego wiersza strony, wygodny dla `.range()` supabase-js).
 * `pobierzStrone` zwraca `null`, gdy zapytanie padło — wtedy przerywamy z `complete: false`.
 */
async function stronicuj<T>(
  pobierzStrone: (od: number, do_: number) => Promise<T[] | null>,
  etykieta: string,
): Promise<WynikStronicowania<T>> {
  const rows: T[] = []

  for (let strona = 0; strona < MAX_STRON; strona++) {
    const od = strona * ROZMIAR_STRONY
    const dane = await pobierzStrone(od, od + ROZMIAR_STRONY - 1)

    if (dane === null) {
      console.error(`[${etykieta}] Stronicowanie companies przerwane na offsecie ${od} (mam ${rows.length} wierszy)`)
      return { rows, complete: false }
    }

    rows.push(...dane)
    // Krótsza strona = koniec danych. Dokładnie ROZMIAR_STRONY = pytamy o następną.
    if (dane.length < ROZMIAR_STRONY) return { rows, complete: true }
  }

  console.error(`[${etykieta}] Stronicowanie companies przerwane po ${MAX_STRON} stronach — podnieś MAX_STRON`)
  return { rows, complete: false }
}

/**
 * Wszystkie firmy przez klienta supabase-js (`lib/supabase/server.ts`).
 * Filtr `published` dokłada sam klient serwerowy, więc nie trzeba go podawać.
 *
 * `dostrojZapytanie` pozwala dodać własne `.order()` / `.eq()` do każdej strony.
 * WAŻNE: przy własnym `.order()` dodaj unikalny tiebreaker (zwykle `.order("id")`),
 * inaczej wiersze o równym kluczu mogą się między stronami powtórzyć albo zgubić.
 */
export async function pobierzWszystkieFirmy<T = any>(
  supabase: any,
  select: string,
  opcje: { etykieta: string; dostrojZapytanie?: (zapytanie: any) => any } = { etykieta: "companies" },
): Promise<WynikStronicowania<T>> {
  return stronicuj<T>(async (od, do_) => {
    let zapytanie = supabase.from("companies").select(select)
    if (opcje.dostrojZapytanie) zapytanie = opcje.dostrojZapytanie(zapytanie)
    const { data, error } = await zapytanie.range(od, do_)
    if (error || !data) {
      if (error) console.error(`[${opcje.etykieta}] Supabase:`, error.message)
      return null
    }
    return data as T[]
  }, opcje.etykieta)
}

/**
 * Wszystkie firmy przez REST (PostgREST) — dla tras, które wołają Supabase `fetch`em
 * zamiast klientem supabase-js. Filtr publikacji dokładamy ręcznie (FILTR_PUBLIKACJI),
 * a stronicujemy nagłówkiem `Range`, bo to jedyny sposób wyjścia poza db-max-rows.
 */
export async function pobierzWszystkieFirmyRest<T = any>(
  select: string,
  opcje: {
    supabaseUrl: string
    supabaseKey: string
    etykieta: string
    /** Dodatkowe parametry PostgREST, np. "order=name.asc". Bez własnego `order=`
     *  helper dokłada `order=id.asc`, żeby stronicowanie było stabilne. */
    parametry?: string
    /** Przekazywane do fetch — zachowuje `next: { revalidate }` trasy (cache Next.js). */
    init?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }
  },
): Promise<WynikStronicowania<T>> {
  // Stabilna kolejność jest przy stronicowaniu obowiązkowa: bez `order` PostgREST nie
  // gwarantuje tej samej kolejności wierszy między zapytaniami, więc kolejne okna `Range`
  // mogłyby się nakładać albo pominąć część firm — i liczby znów by nie wyszły.
  const parametry = opcje.parametry?.includes("order=")
    ? opcje.parametry
    : [opcje.parametry, "order=id.asc"].filter(Boolean).join("&")
  const bazowyUrl = `${opcje.supabaseUrl}/rest/v1/companies?${FILTR_PUBLIKACJI}select=${select}&${parametry}`

  return stronicuj<T>(async (od) => {
    // Stronicujemy przez `limit`/`offset` w URL-u, a nie nagłówkiem `Range`: każda strona
    // ma wtedy własny, unikalny URL. To istotne, bo trasy przekazują `next: { revalidate }`
    // — przy jednym URL-u dla wszystkich stron cache Next.js mógłby oddać tę samą stronę
    // w kółko. `limit=ROZMIAR_STRONY` jest równe db-max-rows, więc serwer go nie obniża.
    const res = await fetch(`${bazowyUrl}&limit=${ROZMIAR_STRONY}&offset=${od}`, {
      ...opcje.init,
      headers: {
        apikey: opcje.supabaseKey,
        Authorization: `Bearer ${opcje.supabaseKey}`,
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      console.error(`[${opcje.etykieta}] PostgREST ${res.status}:`, await res.text())
      return null
    }

    return (await res.json()) as T[]
  }, opcje.etykieta)
}
