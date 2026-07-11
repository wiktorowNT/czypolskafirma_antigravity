import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Polityka Prywatności",
  description: "Polityka prywatności i pliki cookies serwisu CzyPolskaFirma.pl",
  alternates: {
    canonical: "https://czypolskafirma.pl/polityka-prywatnosci",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Polityka Prywatności
          </h1>
          <p className="text-sm text-slate-500">Ostatnia aktualizacja: 04.05.2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200">
          <div className="space-y-8 text-slate-600 leading-relaxed">
            
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Informacje ogólne</h3>
              <p>
                Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników 
                w związku z korzystaniem przez nich z serwisu internetowego CzyPolskaFirma.pl (dalej: "Serwis").
              </p>
            </section>

            <section>
              <p>
                Administratorem danych osobowych zawartych w serwisie jest <strong>Zespół CzyPolskaFirma.pl</strong>. <br/>
                Kontakt z Administratorem możliwy jest pod adresem e-mail: <strong>kontakt@czypolskafirma.pl</strong>.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Cele i podstawy przetwarzania danych</h3>
              <p className="mb-3">Administrator przetwarza dane osobowe w następujących celach:</p>
              <ul className="list-disc list-outside ml-5 space-y-2">
                <li><strong>Analityka i statystyka:</strong> w celu analizy ruchu na stronie i poprawy jej funkcjonalności (podstawa: prawnie uzasadniony interes Administratora).</li>
                <li><strong>Kontakt:</strong> w przypadku kontaktu mailowego z Administratorem, w celu obsługi zapytania (podstawa: zgoda użytkownika lub prawnie uzasadniony interes).</li>
                <li><strong>Zapewnienie bezpieczeństwa:</strong> w celu zapewnienia sprawnego i bezpiecznego działania Serwisu (np. logi serwera).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">4. Jakie dane zbieramy?</h3>
              <p>
                Podczas korzystania z Serwisu automatycznie zbierane są tzw. dane eksploatacyjne (logi serwera), w tym: 
                adres IP, data i czas wizyty, informacje o przeglądarce i systemie operacyjnym. Zbieramy również 
                anonimowe dane analityczne dotyczące sposobu korzystania z Serwisu (np. odwiedzane podstrony).
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">5. Odbiorcy danych</h3>
              <p>
                Dane Użytkowników mogą być powierzane podmiotom zewnętrznym świadczącym usługi na rzecz Administratora, 
                w tym przede wszystkim: dostawcom usług hostingowych oraz dostawcom narzędzi analitycznych (np. Google Analytics, Vercel).
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">6. Prawa użytkowników (RODO)</h3>
              <p className="mb-3">Zgodnie z RODO, każdy Użytkownik ma prawo do:</p>
              <ul className="list-disc list-outside ml-5 space-y-2">
                <li>Dostępu do swoich danych oraz otrzymania ich kopii.</li>
                <li>Sprostowania (poprawiania) swoich danych.</li>
                <li>Usunięcia danych lub ograniczenia ich przetwarzania.</li>
                <li>Wniesienia sprzeciwu wobec przetwarzania danych.</li>
                <li>Wniesienia skargi do organu nadzorczego (Prezes Urzędu Ochrony Danych Osobowych).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">7. Pliki Cookies (Ciasteczka)</h3>
              <p>
                Serwis korzysta z plików cookies. Są to niewielkie pliki tekstowe wysyłane przez serwer www i przechowywane 
                na urządzeniu końcowym Użytkownika. Wykorzystujemy je w celach technicznych (niezbędne do działania strony) 
                oraz statystycznych. Użytkownik może w każdej chwili samodzielnie zarządzać plikami cookies zmieniając ustawienia swojej przeglądarki.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
