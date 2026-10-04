import Link from "next/link"

const colTitle = "text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 mb-3"
const colLink = "block py-1 text-[14.5px] font-semibold text-ink-2 hover:text-ink transition-colors"

export function Footer() {
  return (
    <footer className="bg-warm mt-10 pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-ink">
              <img src="/logo.png" alt="" className="h-7 w-auto" />
              CzyPolskaFirma
            </Link>
            <p className="mt-2.5 text-[14.5px] text-ink-2 max-w-[300px]">
              Niezależna baza pochodzenia kapitału firm działających w Polsce.
            </p>
          </div>

          <nav aria-label="Serwis">
            <p className={colTitle}>Serwis</p>
            <Link href="/companies" className={colLink}>Lista firm</Link>
            <Link href="/kategorie" className={colLink}>Kategorie</Link>
            <Link href="/blog" className={colLink}>Blog</Link>
            <Link href="/ulubione" className={colLink}>Ulubione</Link>
          </nav>

          <nav aria-label="Projekt">
            <p className={colTitle}>Projekt</p>
            <Link href="/o-projekcie" className={colLink}>O projekcie</Link>
            <Link href="/metodologia" className={colLink}>Metodologia</Link>
            <a href="https://buycoffee.to/czypolskafirma.pl" target="_blank" rel="noopener noreferrer" className={colLink}>Wesprzyj</a>
            <Link href="mailto:kontakt@czypolskafirma.pl" className={colLink}>Kontakt</Link>
          </nav>

          <div>
            <p className={colTitle}>Śledź</p>
            <a
              href="https://x.com/czypolskafirma"
              target="_blank"
              rel="noopener noreferrer"
              className={`${colLink} inline-flex items-center gap-2`}
              aria-label="X (Twitter)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X (Twitter)
            </a>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-line flex flex-col sm:flex-row justify-between gap-3 text-[13px] text-ink-3">
          <span>&copy; {new Date().getFullYear()} CzyPolskaFirma. Wszelkie prawa zastrzeżone.</span>
          <span className="flex gap-5">
            <Link href="/polityka-prywatnosci" className="hover:text-ink transition-colors">Polityka prywatności</Link>
            <Link href="/regulamin" className="hover:text-ink transition-colors">Regulamin</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
