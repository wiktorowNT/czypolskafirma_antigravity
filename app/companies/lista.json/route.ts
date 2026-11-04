import { NextResponse } from "next/server"
import { pobierzListeFirm } from "../dane"

// Pełna lista firm do filtra kraju i sortowania na /companies, pobierana przez przeglądarkę
// dopiero, gdy użytkownik z nich skorzysta (albo wejdzie z ?country= z wyszukiwarki krajów
// na stronie głównej). Statyczna z ISR na dobę: serwuje ją CDN Vercela, bez funkcji przy
// każdym pobraniu, w przeciwieństwie do /api/companies (force-dynamic, pełny odczyt bazy).
// Tylko pola, które pokazuje karta firmy.
export const revalidate = 86400

export async function GET() {
  const { firmy, complete } = await pobierzListeFirm()

  // Urwany odczyt: błąd zamiast zapisania na dobę niepełnej listy (ISR zostawia poprzednią).
  if (!complete) {
    throw new Error(`[companies/lista.json] Odczyt niepełny: ${firmy.length} firm`)
  }

  return NextResponse.json(firmy, {
    headers: {
      // Dane dla skryptu strony, nie dokument do wyników wyszukiwania.
      "X-Robots-Tag": "noindex",
    },
  })
}
