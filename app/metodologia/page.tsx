import { Metadata } from "next"
import { ShieldCheck, PieChart, History, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Metodologia | CzyPolskaFirma.pl",
  description: "Zasady weryfikacji kapitału i struktury właścicielskiej firm w bazie CzyPolskaFirma.pl",
}

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Metodologia Weryfikacji Kapitału
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Celem projektu CzyPolskaFirma.pl jest ustalenie Ostatecznego Beneficjenta Rzeczywistego (UBO) –
            czyli podmiotu na samym szczycie struktury właścicielskiej.
          </p>
          <p className="text-md text-slate-500 max-w-2xl mx-auto mt-4">
            Sprawdzamy, do jakiego kraju realnie trafiają zyski i gdzie podejmowane są kluczowe decyzje.
            Nie opieramy się na sentymentach, miejscu rejestracji spółki czy historycznym pochodzeniu marki.
            Przy ocenie każdej firmy stosujemy 4 żelazne reguły:
          </p>
        </div>

        {/* Rules Grid */}
        <div className="space-y-8 sm:space-y-12">

          {/* Rule 1 */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">1. Zasada Ostatecznego Właściciela</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              <strong>Przejrzystość ponad wszystko.</strong> Ignorujemy wehikuły inwestycyjne, fundusze powiernicze i
              tzw. raje podatkowe (Cypr, Luksemburg, Malta). Patrzymy wyłącznie na szczyt piramidy.
              Jeśli za zagraniczną spółką stoi polski założyciel – kapitał uznajemy za polski.
              Z kolei jeśli właścicielem polskiej spółki z o.o. jest zagraniczny fundusz –
              kapitał przypisujemy do kraju pochodzenia tego funduszu.
            </p>
          </div>

          {/* Rule 2 */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">2. Zasada Efektywnej Kontroli</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              O przynależności firmy decyduje podmiot posiadający <strong>pakiet kontrolny</strong>.
              Wymagane jest ponad 50% udziałów LUB posiadanie największego, pojedynczego pakietu akcji
              (np. 40%), który w realiach rynkowych pozwala samodzielnie powoływać zarząd i dyktować strategię.
            </p>
          </div>

          {/* Rule 3 */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <History className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">3. Zasada "Złotej Klatki"</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Historyczne pochodzenie marki nie ma znaczenia przy ustalaniu jej bieżącego statusu.
              Jeśli firma została założona w Polsce i zbudowana przez Polaków (tak jak np. Allegro, Żabka, czy Wedel),
              ale jej pakiet kontrolny został wykupiony przez zagraniczny kapitał,
              tracąc tym samym swoją niezależność właścicielską – <strong>klasyfikujemy ją jako podmiot zagraniczny</strong>.
            </p>
          </div>

          {/* Rule 4 */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">4. Klasyfikacja Binarna</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Firma otrzymuje oficjalny status <strong>"Polska Firma"</strong> tylko wtedy,
              gdy ostateczny właściciel sprawujący efektywną kontrolę jest podmiotem polskim.
              Wszelkie przypadki mieszane i niuanse (np. mniejszościowe pakiety udziałów w rękach polskich)
              opisujemy szczegółowo w profilu firmy, jednak nie uprawniają one do uzyskania statusu polskiej firmy.
            </p>
          </div>

        </div>

      </div>
    </main>
  )
}
