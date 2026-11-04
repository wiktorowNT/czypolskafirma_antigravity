// Wspólne dla serwera i przeglądarki: kolejność listy i adresy stron.

// Jedna kolejność alfabetyczna na serwerze i w przeglądarce. Serwer tnie listę na strony,
// więc gdyby przeglądarka sortowała inaczej (np. inny domyślny język porównywania liter
// Ł, Ś, Ż), firmy na granicy stron mogłyby przeskakiwać między stronami.
const kolator = new Intl.Collator("pl")

export function porownajMarki(a: string, b: string): number {
  return kolator.compare(a, b)
}

/** Kanoniczny adres strony listy: strona 1 to samo /companies, bez duplikatu /strona/1. */
export function sciezkaStrony(numer: number): string {
  return numer <= 1 ? "/companies" : `/companies/strona/${numer}`
}

/** Pełna lista firm do filtrowania i sortowania w przeglądarce (statyczna, ISR). */
export const ADRES_PELNEJ_LISTY = "/companies/lista.json"
