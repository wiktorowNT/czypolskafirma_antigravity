import { Suspense } from "react"
import BookmarksClient from "./BookmarksClient"

export const metadata = {
    title: "Ulubione firmy | CzyPolskaFirma",
    description: "Twoja lista ulubionych firm zapisanych w przeglądarce.",
}

export default function BookmarksPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500">Ładowanie ulubionych...</div>
            </div>
        }>
            <BookmarksClient />
        </Suspense>
    )
}
