import Link from "next/link"

export const metadata = {
    title: "Regulamin | CzyPolskaFirma",
    description: "Regulamin korzystania z serwisu CzyPolskaFirma.pl.",
}

export default function Regulamin() {
    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Regulamin</h1>

                <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
                    <p>Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}</p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">1. Postanowienia ogólne</h2>
                    <p>
                        Serwis CzyPolskaFirma.pl jest bezpłatną usługą informacyjną umożliwiającą weryfikację struktury
                        właścicielskiej i pochodzenia kapitału firm działających w Polsce.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">2. Źródła danych</h2>
                    <p>
                        Wszystkie prezentowane informacje opierają się na publicznych źródłach danych, w szczególności:
                        Krajowy Rejestr Sądowy (KRS), Centralny Rejestr Beneficjentów Rzeczywistych (CRBR),
                        Centralna Ewidencja i Informacja o Działalności Gospodarczej (CEIDG), GUS oraz oficjalne strony podmiotów.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">3. Ograniczenie odpowiedzialności</h2>
                    <p>
                        Informacje prezentowane w serwisie mają charakter wyłącznie informacyjny i nie stanowią porady prawnej,
                        finansowej ani inwestycyjnej. Zespół CzyPolskaFirma dokłada wszelkich starań, aby dane były aktualne
                        i rzetelne, jednak nie ponosi odpowiedzialności za ich kompletność i dokładność.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">4. Zgłaszanie błędów</h2>
                    <p>
                        Użytkownicy mogą zgłaszać błędy i nieścisłości za pomocą formularza „Zgłoś firmę lub poprawkę"
                        dostępnego na stronie każdej firmy. Zgłoszenia wymagają podania źródła potwierdzającego zmianę.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">5. Prawa autorskie</h2>
                    <p>
                        Struktura serwisu, układ graficzny oraz opracowania tekstowe są chronione prawem autorskim.
                        Kopiowanie treści w celach komercyjnych wymaga pisemnej zgody administratora.
                    </p>
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200">
                    <Link href="/" className="text-sm text-red-600 hover:text-red-700 font-medium">
                        ← Wróć na stronę główną
                    </Link>
                </div>
            </div>
        </main>
    )
}
