import Link from "next/link"

export const metadata = {
    title: "Polityka Prywatności | CzyPolskaFirma",
    description: "Polityka prywatności serwisu CzyPolskaFirma.pl — informacje o przetwarzaniu danych osobowych.",
}

export default function PolitykaPrywatnosci() {
    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Polityka Prywatności</h1>

                <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
                    <p>Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}</p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">1. Administrator danych</h2>
                    <p>
                        Administratorem danych osobowych jest zespół CzyPolskaFirma. Kontakt z administratorem możliwy jest
                        za pośrednictwem formularza kontaktowego dostępnego na stronie.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">2. Zakres zbieranych danych</h2>
                    <p>
                        Serwis zbiera wyłącznie dane niezbędne do świadczenia usługi:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Dane analityczne (anonimowe statystyki ruchu za pomocą Vercel Analytics)</li>
                        <li>Pliki cookies niezbędne do funkcjonowania strony</li>
                        <li>Dane podane dobrowolnie w formularzach kontaktowych (e-mail, treść wiadomości)</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">3. Pliki cookies</h2>
                    <p>
                        Serwis wykorzystuje pliki cookies w celach funkcjonalnych (zapamiętanie preferencji użytkownika)
                        oraz analitycznych. Użytkownik może zarządzać ustawieniami cookies za pomocą bannera wyświetlanego
                        przy pierwszej wizycie.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">4. Prawa użytkownika</h2>
                    <p>
                        Zgodnie z RODO, każdy użytkownik ma prawo do: dostępu do swoich danych, ich sprostowania, usunięcia,
                        ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu wobec przetwarzania.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-900 mt-8">5. Źródła danych o firmach</h2>
                    <p>
                        Dane o firmach prezentowane w serwisie pochodzą wyłącznie z publicznych rejestrów (KRS, CEIDG, GUS, CRBR)
                        i nie stanowią danych osobowych w rozumieniu RODO.
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
