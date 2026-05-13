import dynamic from "next/dynamic"

const CompaniesList = dynamic(
  () => import("./CompaniesList").then((mod) => mod.CompaniesList),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }
)

export const metadata = {
  title: "Wszystkie Firmy | CzyPolskaFirma",
  description: "Przeglądaj pełną bazę firm i marek dostępnych w serwisie CzyPolskaFirma. Sprawdź pochodzenie kapitału.",
}

export default function CompaniesPage() {
  return <CompaniesList />
}
