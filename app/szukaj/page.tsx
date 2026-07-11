import { Suspense } from "react"
import SearchResultsClient from "./SearchResultsClient"

export const metadata = {
    title: "Wyniki wyszukiwania",
    description: "Wyniki wyszukiwania firm w bazie CzyPolskaFirma",
    // /szukaj jest zablokowane w robots.txt — dodatkowo noindex dla pewności
    robots: { index: false, follow: true },
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500">Ładowanie wyników...</div>
            </div>
        }>
            <SearchResultsClient />
        </Suspense>
    )
}
