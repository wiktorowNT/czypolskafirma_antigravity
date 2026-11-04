import type { Metadata } from "next"
import { StronaListy } from "./StronaListy"
import { kartySpolecznosciowe } from "@/lib/meta-strony"

const TYTUL = "Wszystkie firmy: sprawdź pochodzenie kapitału"
const OPIS = "Przeglądaj pełną bazę firm i marek dostępnych w serwisie CzyPolskaFirma. Sprawdź pochodzenie kapitału."

export const revalidate = 86400 // ISR: odśwież listę raz na dobę (limit CPU Vercela)

export const metadata: Metadata = {
  // Sufiks "| CzyPolskaFirma.pl" dodaje title.template z layoutu — bez ręcznego dopisywania.
  title: TYTUL,
  description: OPIS,
  ...kartySpolecznosciowe({ tytul: `${TYTUL} | CzyPolskaFirma.pl`, opis: OPIS, sciezka: "/companies" }),
  alternates: {
    canonical: "https://czypolskafirma.pl/companies",
  },
}

// Strona 1 listy. Kolejne strony: app/companies/strona/[numer]. Cała baza w jednym HTML-u
// ważyła 3,5 MB (1555 kart plus te same dane drugi raz w ładunku RSC).
export default async function CompaniesPage() {
  return <StronaListy numer={1} />
}
