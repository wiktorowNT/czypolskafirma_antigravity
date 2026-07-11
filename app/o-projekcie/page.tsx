import { Metadata } from "next"
import { Search, TrendingUp, Globe2 } from "lucide-react"

export const metadata: Metadata = {
  title: "O projekcie",
  description: "Dowiedz się, dlaczego stworzyliśmy projekt CzyPolskaFirma i jak wspieramy świadomość konsumencką oraz polską gospodarkę.",
  alternates: {
    canonical: "https://czypolskafirma.pl/o-projekcie",
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Dlaczego powstał ten projekt?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            CzyPolskaFirma.pl to niezależna inicjatywa, która zrodziła się z potrzeby budowania 
            świadomości konsumenckiej oraz wspierania polskiej gospodarki.
          </p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-8 sm:space-y-12">
          
          {/* Block 1 */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Świadome zakupy</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Codziennie robimy zakupy i wybieramy usługi, rzadko zastanawiając się, 
              dokąd finalnie trafiają nasze pieniądze. Wiele znanych i lubianych marek, 
              które od lat są obecne na polskim rynku i kojarzą się z rodzimą produkcją, 
              w rzeczywistości należy do zagranicznych korporacji. Naszym celem jest 
              dostarczenie prostego narzędzia, które pozwala zweryfikować 
              rzeczywiste pochodzenie kapitału i strukturę właścicielską firm.
            </p>
          </div>

          {/* Block 2 */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Rozwój polskiej gospodarki</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Wierzymy, że wspieranie rodzimych przedsiębiorstw ma ogromny sens ekonomiczny. 
              Polskie firmy płacą tu podatki, tworzą miejsca pracy, inwestują lokalnie 
              i budują innowacje w naszym kraju. Kiedy świadomie wybieramy ich usługi lub produkty, 
              przyczyniamy się do rozwoju całej gospodarki, co przekłada się na lepszy standard 
              życia nas wszystkich.
            </p>
          </div>

          {/* Block 3 */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <Globe2 className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Wolny wybór</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Nikogo nie bojkotujemy – otwarta gospodarka przynosi wiele korzyści i jest motorem postępu. 
              Chcemy jedynie, by polscy konsumenci mieli pełen obraz sytuacji i świadomość 
              tego kogo wspierają. Dlatego nasza strona podpowiada również 
              polskie alternatywy w poszczególnych branżach. Ostateczna decyzja 
              zawsze należy do Ciebie!
            </p>
          </div>

        </div>

      </div>
    </main>
  )
}
