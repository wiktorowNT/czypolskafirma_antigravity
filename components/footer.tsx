import { Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* O projekcie */}
          <div>
            <h3 className="font-semibold mb-4">O projekcie</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  O nas
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Misja
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Zespół
                </a>
              </li>
            </ul>
          </div>

          {/* Metodologia */}
          <div>
            <h3 className="font-semibold mb-4">Metodologia</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Kryteria oceny
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Źródła danych
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Aktualizacje
                </a>
              </li>
            </ul>
          </div>

          {/* Kategorie */}
          <div>
            <h3 className="font-semibold mb-4">Kategorie</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Spożywcze
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  RTV/AGD
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Moda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Wszystkie
                </a>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="mailto:kontakt@czypolskafirma.pl" className="hover:text-white transition-colors">
                  kontakt@czypolskafirma.pl
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Polityka prywatności
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Regulamin
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <form className="flex items-center justify-center gap-4 flex-wrap">
            <span className="text-slate-300">Bądź na bieżąco:</span>
            <input
              type="email"
              placeholder="Twój e-mail"
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[200px]"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Zapisz się
            </button>
          </form>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <p className="text-slate-400 text-sm">© 2024 CzyPolskaFirma. Wszelkie prawa zastrzeżone.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
