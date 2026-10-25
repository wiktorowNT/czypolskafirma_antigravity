"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import "./globals.css"

const BASE_URL = "https://czypolskafirma.pl"
const RELOAD_KEY = "cpf-global-error-reload"
const RELOAD_WINDOW_MS = 5 * 60 * 1000

// Zastępuje domyślny ekran błędu Next.js („Application error: a client-side
// exception has occurred…”). Ten ekran jest identyczny na każdej stronie Next.js
// na świecie i nie ma canonicala — gdy Google renderował nasz HTML po nowym
// wdrożeniu (stare pliki JS już 404), klastrował nasze profile z obcymi serwisami.
//
// Najczęstsza przyczyna to brakujący plik JS z poprzedniego wdrożenia, więc
// najpierw jedno przeładowanie po świeży HTML. Drugie w ciągu kilku minut już
// nie — wtedy pokazujemy własny komunikat z canonicalem tej strony.
function shouldReload(path: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(RELOAD_KEY)
    const last = raw ? (JSON.parse(raw) as { path: string; at: number }) : null
    if (last && last.path === path && Date.now() - last.at < RELOAD_WINDOW_MS) return false
    window.sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ path, at: Date.now() }))
    return true
  } catch {
    // Bez sessionStorage nie da się zabezpieczyć przed pętlą przeładowań.
    return false
  }
}

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const pathname = usePathname() || (typeof window !== "undefined" ? window.location.pathname : "/")

  useEffect(() => {
    console.error("[global-error]", error)
    if (shouldReload(window.location.pathname)) window.location.reload()
  }, [error])

  return (
    <html lang="pl-PL">
      <head>
        <title>CzyPolskaFirma — sprawdź, czy firma jest polska</title>
        <link rel="canonical" href={`${BASE_URL}${pathname}`} />
      </head>
      <body className="font-sans">
        <main className="min-h-screen bg-warm flex items-center justify-center">
          <div className="max-w-md mx-auto text-center px-4">
            <h1 className="text-2xl font-bold text-ink mb-2">Nie udało się wczytać strony</h1>
            <p className="text-ink-2 mb-8">
              Serwis CzyPolskaFirma.pl właśnie się aktualizował. Odśwież stronę, żeby zobaczyć jej aktualną wersję.
            </p>
            <a
              href={pathname}
              className="inline-block px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand-ink transition-colors font-medium text-sm"
            >
              Odśwież stronę
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
