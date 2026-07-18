import Link from "next/link"

export default function NotFound() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white flex items-center justify-center">
            <div className="text-center px-4">
                <div className="mb-8">
                    <img
                        src="/flags/pl-w80.png"
                        alt="Polska"
                        className="w-16 h-auto mx-auto rounded-sm shadow-sm opacity-50"
                    />
                </div>
                <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">Strona nie znaleziona</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Strona, której szukasz, nie istnieje lub została przeniesiona.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                        Wróć na stronę główną
                    </Link>
                </div>
            </div>
        </main>
    )
}
