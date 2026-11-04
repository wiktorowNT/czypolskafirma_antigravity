import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"
import type { InnaKategoria } from "@/components/category-page-view"

// Sekcje pod listą firm na stronie kategorii. Komponenty serwerowe: dane przychodzą
// z renderu strony (ISR), więc linki są w wyjściowym HTML-u, bez zapytań z przeglądarki.

export interface WpisKategorii {
  slug: string
  title: string
  date: string
  description: string
  /** Marki z tej kategorii, o których jest wpis (do podpisu pod tytułem). */
  marki: string[]
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function KategoriaNaBlogu({ wpisy, nazwaKategorii }: { wpisy: WpisKategorii[]; nazwaKategorii: string }) {
  if (wpisy.length === 0) return null

  return (
    <section className="mt-12" aria-labelledby="kategoria-blog">
      <h2 id="kategoria-blog" className="text-xl font-extrabold tracking-tight text-ink mb-1.5">
        Na blogu o firmach z tej kategorii
      </h2>
      <p className="text-[14.5px] text-ink-2 mb-4">
        Wpisy o właścicielach i przejęciach marek z kategorii {nazwaKategorii}.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {wpisy.map((wpis) => (
          <Link
            key={wpis.slug}
            href={`/blog/${wpis.slug}`}
            prefetch={false}
            className="group flex flex-col rounded-2xl border-[1.5px] border-line bg-card px-4 py-3.5 hover:border-ink transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
              <CalendarDays className="w-3.5 h-3.5" />
              <time dateTime={wpis.date}>{formatDate(wpis.date)}</time>
            </span>
            <span className="mt-1 text-[15.5px] font-bold text-ink leading-snug group-hover:underline underline-offset-4">
              {wpis.title}
            </span>
            {wpis.marki.length > 0 && (
              <span className="mt-1 text-[13px] text-ink-2">
                {`O firmach: ${wpis.marki.join(", ")}`}
              </span>
            )}
            <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[13.5px] font-bold text-brand-ink">
              Czytaj wpis
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/**
 * Inne kategorie pod listą. Na dużym ekranie te same linki są w bocznym panelu,
 * więc blok widać tylko na telefonie i tablecie (w HTML-u jest zawsze).
 */
export function InneKategorieLinki({ kategorie }: { kategorie: InnaKategoria[] }) {
  if (kategorie.length === 0) return null

  return (
    <nav className="mt-12 lg:hidden" aria-labelledby="inne-kategorie">
      <h2 id="inne-kategorie" className="text-xl font-extrabold tracking-tight text-ink mb-3.5">
        Inne kategorie
      </h2>
      <ul className="flex flex-wrap gap-2">
        {kategorie.map((kat) => (
          <li key={kat.slug}>
            <Link
              href={`/kategoria/${kat.slug}`}
              prefetch={false}
              className="inline-flex items-center h-9 px-3.5 rounded-full border-[1.5px] border-line bg-card text-[14px] font-semibold text-ink-2 hover:border-ink hover:text-ink transition-colors"
            >
              {kat.name}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/kategorie"
            className="inline-flex items-center gap-1 h-9 px-3.5 text-[14px] font-bold text-brand-ink hover:underline underline-offset-4"
          >
            Wszystkie kategorie
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
