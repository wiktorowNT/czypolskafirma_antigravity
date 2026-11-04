import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { sciezkaStrony } from "./wspolne"

export interface ZakresStrony {
  /** Pierwsza i ostatnia marka na stronie: podpowiedź przy numerze (title, czytnik ekranu). */
  od: string
  do: string
}

interface StronicowanieProps {
  numer: number
  zakresy: ZakresStrony[]
  pierwszaPozycja: number
  ostatniaPozycja: number
  liczbaFirm: number
}

// Zwykłe linki <a href> do WSZYSTKICH stron (przy 100 firmach na stronę to 16 linków dla
// 1555 firm, 25 dla 2500): robot Google dochodzi do każdej firmy w dwóch kliknięciach
// z /companies. `prefetch={false}`: bez tego Next pobierałby w tle ładunek każdej
// widocznej strony listy, czyli kilkanaście zbędnych pobrań na telefonie.
export function Stronicowanie({ numer, zakresy, pierwszaPozycja, ostatniaPozycja, liczbaFirm }: StronicowanieProps) {
  const liczbaStron = zakresy.length
  if (liczbaStron <= 1) return null

  const klasaPrzycisku =
    "h-10 px-4 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-card text-sm font-bold text-ink hover:border-ink transition-colors"

  return (
    <nav aria-label="Strony listy firm" className="mt-10 flex flex-col items-center gap-4">
      <p className="text-sm text-ink-2">
        Firmy {pierwszaPozycja}–{ostatniaPozycja} z {liczbaFirm}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {numer > 1 && (
          <Link href={sciezkaStrony(numer - 1)} prefetch={false} rel="prev" className={klasaPrzycisku}>
            <ChevronLeft className="w-4 h-4" />
            Poprzednia
          </Link>
        )}
        <ol className="flex flex-wrap items-center justify-center gap-1.5">
          {zakresy.map((zakres, i) => {
            const n = i + 1
            const opis = `Strona ${n}: od ${zakres.od} do ${zakres.do}`
            return (
              <li key={n}>
                {n === numer ? (
                  <span
                    aria-current="page"
                    title={opis}
                    className="w-10 h-10 grid place-items-center rounded-full bg-panel text-white text-sm font-bold"
                  >
                    {n}
                  </span>
                ) : (
                  <Link
                    href={sciezkaStrony(n)}
                    prefetch={false}
                    title={opis}
                    aria-label={opis}
                    className="w-10 h-10 grid place-items-center rounded-full border-[1.5px] border-line bg-card text-sm font-bold text-ink-2 hover:border-ink hover:text-ink transition-colors"
                  >
                    {n}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
        {numer < liczbaStron && (
          <Link href={sciezkaStrony(numer + 1)} prefetch={false} rel="next" className={klasaPrzycisku}>
            Następna
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </nav>
  )
}
