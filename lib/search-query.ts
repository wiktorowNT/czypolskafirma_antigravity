/**
 * Sanityzacja zapytań wyszukiwarki przed wstawieniem ich do filtra PostgREST.
 *
 * Problem: filtry `or=(name.ilike.*X*,slug.ilike.*X*)` budujemy jako tekst URL-a.
 * `encodeURIComponent` NIE chroni tu przed składnią PostgREST, bo nie koduje
 * znaków `,` `.` `(` `)` `*`, a PostgREST dekoduje wartość przed parsowaniem.
 * Wystarczył przecinek albo nawias w zapytaniu, żeby filtr się rozpadł
 * (sprawdzone na produkcji: `zabka)` i `zabka,` zwracały pustą listę).
 *
 * Rozwiązanie: biała lista znaków. Wszystko poza literami (z polskimi
 * diakrytykami), cyframi, spacją i dywizem zamieniamy na spację, a spacje
 * na `*`, czyli wildcard PostgREST. Dzięki temu „Dr. Oetker" nadal znajduje
 * „DR.OETKER POLSKA" (`Dr*Oetker`), a `zabka)` znajduje Żabkę.
 */

/** Znaki, których w zapytaniu nie dopuszczamy do filtra PostgREST. */
const ZNAKI_NIEDOZWOLONE = /[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ \-]+/g

/** Górny limit długości zapytania. Zapytania-potwory tylko obciążają bazę. */
const MAKS_DLUGOSC = 80

/**
 * Zapytanie użytkownika sprowadzone do bezpiecznych znaków.
 * Zwraca pusty łańcuch, gdy po oczyszczeniu nie zostało nic sensownego.
 */
export function oczyscZapytanie(surowe: string): string {
  if (!surowe) return ""
  return surowe
    .normalize("NFC")
    .slice(0, MAKS_DLUGOSC)
    .replace(ZNAKI_NIEDOZWOLONE, " ")
    // Dywiz tylko wewnątrz słowa (np. „e-obuwie"); osamotniony staje się spacją.
    .replace(/(^|\s)-+|-+(\s|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Wzorzec do `ilike` w PostgREST: spacje zamienione na wildcard `*`.
 * Wynik zawiera już tylko znaki z białej listy, więc jest bezpieczny
 * w filtrze (i tak przepuszczamy go jeszcze przez `encodeURIComponent`).
 */
export function wzorzecIlike(oczyszczone: string): string {
  return oczyszczone.replace(/\s+/g, "*")
}

/**
 * Jedno wywołanie dla route handlerów: oczyszcza zapytanie i zwraca gotowy,
 * zakodowany fragment wartości filtra, albo `null`, gdy nie ma czego szukać.
 */
export function przygotujFiltrSzukania(
  surowe: string,
  minDlugosc = 2
): { oczyszczone: string; zakodowane: string } | null {
  const oczyszczone = oczyscZapytanie(surowe)
  if (oczyszczone.length < minDlugosc) return null
  return {
    oczyszczone,
    zakodowane: encodeURIComponent(wzorzecIlike(oczyszczone)),
  }
}
