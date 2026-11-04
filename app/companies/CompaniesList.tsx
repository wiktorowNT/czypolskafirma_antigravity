"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Building2, AlertCircle, ArrowUpDown, Globe } from "lucide-react"
import { CompanyGrid, CompanyGridItem } from "@/components/CompanyGrid"
import { countryNames } from "@/lib/countries"
import { porownajMarki, ADRES_PELNEJ_LISTY } from "./wspolne"

const SCROLL_KEY = "companies-list-scroll"

interface CompaniesListProps {
  /** Firmy bieżącej strony (100), z serwera: renderują się w wyjściowym HTML. */
  firmyStrony: CompanyGridItem[]
  /** Liczba firm w całej bazie (nagłówek strony). */
  liczbaFirm: number
  /** Linki do stron listy, renderowane na serwerze. Ukryte, gdy działa filtr albo sortowanie. */
  nawigacja?: ReactNode
}

type StanPelnejListy = "brak" | "laduje" | "gotowa" | "blad"

export function CompaniesList({ firmyStrony, liczbaFirm, nawigacja }: CompaniesListProps) {
  const pathname = usePathname()
  const kluczPrzewiniecia = `${SCROLL_KEY}:${pathname}`
  const [sortBy, setSortBy] = useState<string>("name-asc")
  const [countryQuery, setCountryQuery] = useState<string>("")
  // Filtr kraju i sortowanie działają na całej bazie, nie na jednej stronie. Pełną listę
  // dociągamy dopiero, gdy są potrzebne: domyślne wejście nie pobiera nic poza HTML-em.
  const [pelnaLista, setPelnaLista] = useState<CompanyGridItem[] | null>(null)
  const [stanPelnej, setStanPelnej] = useState<StanPelnejListy>("brak")
  const pobieranie = useRef(false)

  const zaladujPelnaListe = useCallback(() => {
    if (pobieranie.current) return
    pobieranie.current = true
    setStanPelnej("laduje")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    fetch(ADRES_PELNEJ_LISTY, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Lista firm: ${response.status}`)
        return response.json()
      })
      .then((dane: CompanyGridItem[]) => {
        setPelnaLista(dane)
        setStanPelnej("gotowa")
      })
      .catch((err) => {
        console.error("Błąd pobierania pełnej listy firm:", err)
        pobieranie.current = false // kolejna zmiana filtra albo sortowania spróbuje ponownie
        setStanPelnej("blad")
      })
      .finally(() => clearTimeout(timeoutId))
  }, [])

  // Save scroll position before navigating away
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(kluczPrzewiniecia, String(window.scrollY))
    }

    // Save on any click (catches link navigations)
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a")
      if (link && link.href && !link.href.startsWith("#")) {
        saveScroll()
      }
    }

    document.addEventListener("click", handleClick, true)
    window.addEventListener("beforeunload", saveScroll)

    return () => {
      document.removeEventListener("click", handleClick, true)
      window.removeEventListener("beforeunload", saveScroll)
    }
  }, [kluczPrzewiniecia])

  useEffect(() => {
    // ?country= z wyszukiwarki krajów na stronie głównej (components/hero.tsx).
    // Czytane po zamontowaniu, bo strona jest statyczna (ISR).
    const params = new URLSearchParams(window.location.search)
    const country = params.get("country")
    if (country) {
      setCountryQuery(country)
      return
    }

    // Powrót z profilu firmy: przywróć miejsce na liście (osobno dla każdej strony listy).
    const savedScroll = sessionStorage.getItem(kluczPrzewiniecia)
    if (savedScroll) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScroll, 10))
          sessionStorage.removeItem(kluczPrzewiniecia)
        })
      })
    }
  }, [kluczPrzewiniecia])

  const filtrujeAlboSortuje = countryQuery.trim() !== "" || sortBy !== "name-asc"

  useEffect(() => {
    if (filtrujeAlboSortuje && stanPelnej === "brak") zaladujPelnaListe()
  }, [filtrujeAlboSortuje, stanPelnej, zaladujPelnaListe])

  const companies = filtrujeAlboSortuje ? pelnaLista ?? [] : firmyStrony

  const filteredCompanies = companies.filter(company => {
    const query = countryQuery.toLowerCase().trim()
    if (!query) return true
    const countryName = countryNames[company.country_code || ""]?.toLowerCase() || ""
    const countryCode = company.country_code?.toLowerCase() || ""
    return countryName.includes(query) || countryCode === query
  })

  // Strona z serwera jest już ułożona A-Z (app/companies/dane.ts), tą samą kolejnością.
  const sortedCompanies = !filtrujeAlboSortuje ? filteredCompanies : [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case "name-asc": return porownajMarki(a.brand, b.brand)
      case "name-desc": return porownajMarki(b.brand, a.brand)
      case "polish-first":
        if (a.country_code === "PL" && b.country_code !== "PL") return -1
        if (a.country_code !== "PL" && b.country_code === "PL") return 1
        return porownajMarki(a.brand, b.brand)
      case "foreign-first":
        if (a.country_code !== "PL" && b.country_code === "PL") return -1
        if (a.country_code === "PL" && b.country_code !== "PL") return 1
        return porownajMarki(a.brand, b.brand)
      default: return 0
    }
  })

  const czekaNaPelnaListe = filtrujeAlboSortuje && pelnaLista === null

  let zawartosc: ReactNode
  if (czekaNaPelnaListe && stanPelnej === "blad") {
    zawartosc = (
      <div className="bg-white p-8 rounded-2xl border border-line text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-brand mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ink mb-2">Błąd</h2>
        <p className="text-ink-2">Nie udało się pobrać listy firm</p>
      </div>
    )
  } else if (czekaNaPelnaListe) {
    zawartosc = (
      <div className="flex items-center justify-center py-16" role="status" aria-label="Wczytywanie listy firm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  } else if (filteredCompanies.length === 0) {
    zawartosc = (
      <div className="text-center py-12 bg-white rounded-2xl border border-line border-dashed">
        <Building2 className="w-16 h-16 text-ink-3 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink mb-2">Brak firm spełniających kryteria</h3>
        <p className="text-ink-2">Spróbuj zmienić filtry lub wyszukać inną nazwę</p>
      </div>
    )
  } else {
    zawartosc = <CompanyGrid companies={sortedCompanies} />
  }

  return (
    <div className="min-h-screen bg-warm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-2">Wszystkie firmy</h1>
            <p className="text-ink-2">
              Przeglądaj pełną bazę firm i marek dostępnych w serwisie ({liczbaFirm})
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative group flex-1 sm:min-w-[240px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Globe className="w-4 h-4 text-ink-3 group-focus-within:text-ink-2 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Filtruj wg kraju (np. Niemcy)..."
                value={countryQuery}
                onChange={(e) => { setCountryQuery(e.target.value); zaladujPelnaListe() }}
                // Zacznij pobierać pełną listę już przy wejściu w pole, zanim padnie pierwsza litera.
                onFocus={zaladujPelnaListe}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-line rounded-xl text-sm font-medium text-ink-2 hover:border-line focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-ink-3 group-focus-within:text-ink-2 transition-colors" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); zaladujPelnaListe() }}
                onFocus={zaladujPelnaListe}
                className="pl-10 pr-4 py-2.5 bg-white border border-line rounded-xl text-sm font-medium text-ink-2 hover:border-line focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="name-asc">Nazwa (A-Z)</option>
                <option value="name-desc">Nazwa (Z-A)</option>
                <option value="polish-first">Najpierw polskie</option>
                <option value="foreign-first">Najpierw zagraniczne</option>
              </select>
            </div>
          </div>
        </div>
        {zawartosc}
        {!filtrujeAlboSortuje && nawigacja}
      </div>
    </div>
  )
}
