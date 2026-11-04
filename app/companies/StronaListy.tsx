import { notFound } from "next/navigation"
import { CompaniesList } from "./CompaniesList"
import { Stronicowanie, type ZakresStrony } from "./Stronicowanie"
import { pobierzListeFirm, liczbaStron, FIRM_NA_STRONE } from "./dane"

/**
 * Jedna strona listy wszystkich firm (100 firm), renderowana na serwerze: linki
 * <a href="/firma/..."> są w wyjściowym HTML. Wspólna dla /companies i /companies/strona/[numer].
 */
export async function StronaListy({ numer }: { numer: number }) {
  const { firmy, complete } = await pobierzListeFirm()
  const stron = liczbaStron(firmy.length)

  if (numer > stron) {
    // Urwany odczyt: rzucamy, żeby ISR zostawił poprzednią, dobrą wersję strony zamiast
    // zapisać na dobę 404 dla strony, która istnieje.
    if (!complete) throw new Error(`[companies] Odczyt niepełny, nie wiadomo, czy strona ${numer} istnieje`)
    notFound()
  }

  const start = (numer - 1) * FIRM_NA_STRONE
  const firmyStrony = firmy.slice(start, start + FIRM_NA_STRONE)

  const zakresy: ZakresStrony[] = Array.from({ length: stron }, (_, i) => {
    const kawalek = firmy.slice(i * FIRM_NA_STRONE, (i + 1) * FIRM_NA_STRONE)
    return { od: kawalek[0]?.brand ?? "", do: kawalek[kawalek.length - 1]?.brand ?? "" }
  })

  return (
    <CompaniesList
      firmyStrony={firmyStrony}
      liczbaFirm={firmy.length}
      nawigacja={
        <Stronicowanie
          numer={numer}
          zakresy={zakresy}
          pierwszaPozycja={firmyStrony.length ? start + 1 : 0}
          ostatniaPozycja={start + firmyStrony.length}
          liczbaFirm={firmy.length}
        />
      }
    />
  )
}
