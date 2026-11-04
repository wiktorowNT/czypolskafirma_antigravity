/**
 * Zabezpieczenia licznika odsłon (`/api/companies/views`).
 *
 * Ranking „najpopularniejsze" jest elementem wiarygodności serwisu, więc licznik
 * nie może przyjmować dowolnego identyfikatora ani zliczać wielokrotnych wejść
 * tego samego użytkownika.
 *
 * OGRANICZENIE: oba magazyny poniżej (cache istniejących id oraz dedup odsłon)
 * trzymane są w pamięci instancji. Na Vercel każda instancja funkcji ma własną
 * pamięć, więc:
 *   - deduplikacja działa tylko w obrębie jednej instancji, a zimny start
 *     zeruje stan,
 *   - bot rozproszony po wielu adresach IP nadal może napompować licznik.
 * Pełne rozwiązanie wymaga wspólnego magazynu (Redis/Upstash) albo kolumny `ip`
 * w tabeli `company_views` i deduplikacji po stronie bazy.
 * Kroki i decyzje właściciela: `docs/BACKLOG_BEZPIECZENSTWO.md`.
 */

/** Kanoniczny format UUID, w jakim Supabase trzyma `companies.id`. */
const WZORZEC_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Czy wartość z żądania wygląda jak UUID. Odsiewa śmieci przed zapytaniem do bazy. */
export function jestPoprawnyUuid(wartosc: unknown): wartosc is string {
  return typeof wartosc === "string" && WZORZEC_UUID.test(wartosc)
}

// --- Cache identyfikatorów potwierdzonych w bazie -------------------------

const CACHE_ID_TTL_MS = 60 * 60 * 1000 // godzina
const CACHE_ID_MAX = 5_000

const znaneId = new Map<string, number>()

/** Czy id było już potwierdzone w bazie i potwierdzenie nie wygasło. */
export function czyIdPotwierdzone(id: string): boolean {
  const waznoscDo = znaneId.get(id)
  if (!waznoscDo) return false
  if (Date.now() > waznoscDo) {
    znaneId.delete(id)
    return false
  }
  return true
}

/** Zapamiętuje, że firma o tym id istnieje w bazie (oszczędza zapytania). */
export function zapamietajId(id: string): void {
  if (znaneId.size >= CACHE_ID_MAX) {
    // Najstarszy wpis jest pierwszy w kolejności wstawiania Map.
    const najstarszy = znaneId.keys().next().value
    if (najstarszy !== undefined) znaneId.delete(najstarszy)
  }
  znaneId.set(id, Date.now() + CACHE_ID_TTL_MS)
}

// --- Deduplikacja odsłon per IP i firma -----------------------------------

const OKNO_DEDUP_MS = 24 * 60 * 60 * 1000 // doba
const DEDUP_MAX = 50_000

const ostatniaOdslona = new Map<string, number>()

/**
 * Sprawdza i od razu odnotowuje odsłonę.
 * Zwraca `true`, gdy ta sama para (IP, firma) była już liczona w ostatniej dobie,
 * czyli odsłony NIE należy zapisywać do bazy.
 */
export function czyDuplikatOdslony(ip: string, idFirmy: string): boolean {
  const klucz = `${ip}:${idFirmy}`
  const teraz = Date.now()

  const poprzednia = ostatniaOdslona.get(klucz)
  if (poprzednia !== undefined && teraz - poprzednia < OKNO_DEDUP_MS) {
    return true
  }

  if (ostatniaOdslona.size >= DEDUP_MAX) {
    posprzataj(teraz)
    if (ostatniaOdslona.size >= DEDUP_MAX) {
      const najstarszy = ostatniaOdslona.keys().next().value
      if (najstarszy !== undefined) ostatniaOdslona.delete(najstarszy)
    }
  }

  ostatniaOdslona.set(klucz, teraz)
  return false
}

/** Usuwa wpisy starsze niż okno deduplikacji. */
function posprzataj(teraz: number): void {
  for (const [klucz, czas] of ostatniaOdslona.entries()) {
    if (teraz - czas >= OKNO_DEDUP_MS) ostatniaOdslona.delete(klucz)
  }
}
