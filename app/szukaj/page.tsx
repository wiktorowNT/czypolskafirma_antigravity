import { Suspense } from "react"
import SearchResultsClient from "./SearchResultsClient"

export const metadata = {
    title: "Wyniki wyszukiwania | CzyPolskaFirma",
    description: "Wyniki wyszukiwania firm w bazie CzyPolskaFirma",
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
