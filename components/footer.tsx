import Link from "next/link"
import { Facebook, Linkedin, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#020617] text-white py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-10">

          {/* Poziom 1: Nazwa i flaga */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img
              src="https://flagcdn.com/w40/pl.png"
              alt="Polska"
              className="w-6 h-auto rounded-sm shadow-sm"
            />
            <span className="text-xl font-bold tracking-tight text-white">CZYPOLSKAFIRMA.PL</span>
          </Link>

          {/* Poziom 2: Główna nawigacja */}
          <nav className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-sm font-medium text-slate-300">
            <Link href="/o-nas" className="hover:text-white transition-colors">
              O projekcie
            </Link>
            <Link href="/metodologia" className="hover:text-white transition-colors">
              Metodologia
            </Link>
            <Link href="mailto:kontakt@czypolskafirma.pl" className="hover:text-white transition-colors">
              Kontakt
            </Link>
          </nav>

          {/* Poziom 3: Social Media */}
          <div className="flex items-center gap-6">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="X (Twitter)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          {/* Poziom 4: Separator */}
          <div className="w-full h-px bg-white/10 max-w-2xl" />

          {/* Poziom 5: Legal & Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-xs text-slate-500">
            <span>&copy; 2025 CzyPolskaFirma. Wszelkie prawa zastrzeżone.</span>
            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/polityka-prywatnosci" className="hover:text-slate-300 transition-colors">
                Polityka prywatności
              </Link>
              <Link href="/regulamin" className="hover:text-slate-300 transition-colors">
                Regulamin
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
