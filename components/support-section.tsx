import { Coffee } from "lucide-react"

export function SupportSection() {
  return (
    <section id="support" className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-panel text-white rounded-[24px] p-6 sm:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            {/* Tekst nagłówka bez zmian względem poprzedniej wersji (zasada: nie ruszamy nagłówków, SEO) */}
            <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight">
              Podoba Ci się ten projekt? Wesprzyj nasze działania!
            </h2>
            <p className="mt-2.5 text-[15.5px] leading-relaxed text-[#d6d0c6]">
              Projekt utrzymuje się wyłącznie z dobrowolnego wsparcia — bez reklam i sponsorów.
              Wsparcie idzie na rozwój bazy, weryfikację źródeł i utrzymanie serwisu.
            </p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2 flex-shrink-0">
            <a
              href="https://buycoffee.to/czypolskafirma.pl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-[52px] px-6 rounded-full bg-brand hover:bg-[#d4452b] text-white text-base font-bold transition-colors"
            >
              <Coffee className="w-5 h-5" />
              Postaw nam kawę
            </a>
            <p className="text-[13px] text-[#b5afa5]">Bezpieczne płatności przez buycoffee.to</p>
          </div>
        </div>
      </div>
    </section>
  )
}
