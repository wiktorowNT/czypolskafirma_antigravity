import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { StronaListy } from "../../StronaListy"
import { pobierzListeFirm, liczbaStron, FIRM_NA_STRONE, BAZOWY_URL } from "../../dane"
import { sciezkaStrony } from "../../wspolne"
import { kartySpolecznosciowe } from "@/lib/meta-strony"

export const revalidate = 86400 // ISR: doba, jak strona 1 (/companies)

// Wszystkie strony prerenderowane w buildzie (16 przy 1555 firmach): to tylko kawałki tej
// samej listy, a jeden odczyt bazy wystarcza na wszystkie. Gdy baza urośnie o stronę po
// buildzie, nowa strona wyrenderuje się przy pierwszym wejściu (dynamicParams domyślne).
export async function generateStaticParams(): Promise<{ numer: string }[]> {
  const { firmy } = await pobierzListeFirm()
  const stron = liczbaStron(firmy.length)
  return Array.from({ length: Math.max(0, stron - 1) }, (_, i) => ({ numer: String(i + 2) }))
}

/** Tylko kanoniczny zapis numeru: "2", nie "02" ani "2a" (inaczej duplikaty tej samej strony). */
function numerStrony(surowy: string): number | null {
  return /^[1-9]\d{0,4}$/.test(surowy) ? Number(surowy) : null
}

export async function generateMetadata({ params }: { params: Promise<{ numer: string }> }): Promise<Metadata> {
  const numer = numerStrony((await params).numer)
  const { firmy } = await pobierzListeFirm()
  const stron = liczbaStron(firmy.length)

  if (!numer || numer > stron) {
    return { title: "Strona nie znaleziona", robots: { index: false, follow: false } }
  }

  const kawalek = firmy.slice((numer - 1) * FIRM_NA_STRONE, numer * FIRM_NA_STRONE)
  const od = kawalek[0]?.brand
  const do_ = kawalek[kawalek.length - 1]?.brand

  // Tytuł i opis różne na każdej stronie, żeby Google nie traktował ich jak duplikatów.
  const title = `Wszystkie firmy, strona ${numer} z ${stron}`
  const description = `Lista firm i marek w bazie CzyPolskaFirma, strona ${numer} z ${stron}${od && do_ ? `: od ${od} do ${do_}` : ""}. Sprawdź pochodzenie kapitału.`

  return {
    title,
    description,
    ...kartySpolecznosciowe({ tytul: `${title} | CzyPolskaFirma.pl`, opis: description, sciezka: sciezkaStrony(numer) }),
    alternates: {
      // Każda strona wskazuje samą siebie (nie stronę 1): inaczej Google pominąłby firmy z dalszych stron.
      canonical: `${BAZOWY_URL}${sciezkaStrony(numer)}`,
    },
  }
}

export default async function CompaniesPageNumer({ params }: { params: Promise<{ numer: string }> }) {
  const surowy = (await params).numer
  // /companies/strona/1 to duplikat /companies.
  if (surowy === "1") permanentRedirect("/companies")
  const numer = numerStrony(surowy)
  if (!numer) notFound()
  return <StronaListy numer={numer} />
}
