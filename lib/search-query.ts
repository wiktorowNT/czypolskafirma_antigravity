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

/**
 * Klucz porównania nazw: bez akcentów, wielkości liter i znaków spoza liter i cyfr.
 * „L'Oréal" → „loreal", „Procter & Gamble" → „proctergamble", „Żabka" → „zabka".
 */
export function kluczPorownania(tekst: string): string {
  return (tekst || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "")
}

/**
 * Układa wyniki wyszukiwarki według trafności marki, bo PostgREST oddaje je
 * w kolejności z bazy. Ma to znaczenie przy szerokich wzorcach: znaki spoza białej
 * listy stają się wildcardem (`L'Oréal` → `L*Or*al`), więc obok szukanej marki
 * wpadają przypadkowe trafienia i „L'Oréal" lądował na 9. miejscu z 31.
 *
 * Kolejność: marka równa zapytaniu, alias marki równy zapytaniu, marka zaczynająca
 * się od zapytania, marka albo alias zawierające zapytanie, reszta. W obrębie grupy
 * zostaje kolejność z bazy (sort w JS jest stabilny).
 */
export function posortujWedlugTrafnosci<T extends { brand?: string; matchedBrand?: string }>(
  wyniki: T[],
  surowe: string
): T[] {
  const szukane = kluczPorownania(surowe)
  if (!szukane) return wyniki

  const ranga = (w: T): number => {
    const marka = kluczPorownania(w.brand || "")
    const alias = kluczPorownania(w.matchedBrand || "")
    if (marka === szukane) return 0
    if (alias && alias === szukane) return 1
    if (marka.startsWith(szukane)) return 2
    if (marka.includes(szukane) || (alias && alias.includes(szukane))) return 3
    return 4
  }

  return wyniki
    .map((w, i) => ({ w, r: ranga(w), i }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.w)
}
