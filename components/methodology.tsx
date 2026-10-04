import Link from "next/link"

export function Methodology() {
  const principles = [
    {
      title: "Ostateczny właściciel",
      text: "Patrzymy na szczyt piramidy właścicielskiej i pomijamy raje podatkowe. Polski założyciel ze spółką na Cyprze to nadal polski kapitał.",
    },
    {
      title: "Efektywna kontrola",
      text: "Decyduje pakiet kontrolny, zwykle powyżej 50% udziałów lub głosów, a nie pojedyncze pakiety mniejszościowe.",
    },
    {
      title: "Złota klatka",
      text: "Historycznie polskie marki przejęte przez obcy kapitał (np. Wedel, Żabka) klasyfikujemy jako zagraniczne.",
    },
  ]

  const sources = [
    "KRS (Krajowy Rejestr Sądowy)",
    "CRBR (Centralny Rejestr Beneficjentów Rzeczywistych)",
    "CEIDG (Centralna Ewidencja i Informacja o Działalności Gospodarczej)",
    "GUS/REGON",
    "eKRS (sprawozdania finansowe)",
    "UOKiK (decyzje o koncentracjach)",
    "Wikidata/OpenCorporates",
    "Raporty roczne i strony internetowe firm",
  ]

  return (
    <section id="methodology" className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 mb-6">
          <div className="max-w-3xl">
            <h2 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-ink">Metodologia i źródła</h2>
            <p className="text-[15px] text-ink-2 mt-1.5 leading-relaxed">
              Nasze definicje i weryfikację opieramy na wytycznych <a href="https://stat.gov.pl/" className="text-ink font-semibold underline underline-offset-4" target="_blank" rel="noopener noreferrer">Głównego Urzędu Statystycznego (GUS)</a> oraz publicznych rejestrach państwowych zgodnie z <a href="https://isap.sejm.gov.pl/" className="text-ink font-semibold underline underline-offset-4" target="_blank" rel="noopener noreferrer">Ustawą o swobodzie działalności gospodarczej</a>. Każda informacja ma link i datę weryfikacji.
            </p>
          </div>
          <Link href="/metodologia" className="text-sm font-bold text-brand-ink hover:underline underline-offset-4 whitespace-nowrap">
            Poznaj pełną metodologię weryfikacji →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-3.5">
          {principles.map((p, i) => (
            <div key={p.title} className="rounded-[20px] border-[1.5px] border-line p-5 sm:p-6">
              <p className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-brand-ink">Zasada {i + 1}</p>
              <p className="text-lg font-bold text-ink mt-1.5">{p.title}</p>
              <p className="text-[15px] text-ink-2 mt-1.5 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <h3 className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 mt-8 mb-3">
          Sprawdzone źródła danych
        </h3>
        <ul className="flex flex-wrap gap-2">
          {sources.map((source) => (
            <li key={source} className="inline-flex items-center h-9 px-3.5 rounded-full bg-warm text-[13.5px] font-semibold text-ink">
              {source}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
