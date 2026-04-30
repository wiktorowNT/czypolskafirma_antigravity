import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Regulamin | CzyPolskaFirma.pl",
  description: "Regulamin korzystania z serwisu informacyjnego CzyPolskaFirma.pl",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Regulamin Serwisu
          </h1>
          <p className="text-sm text-slate-500">Ostatnia aktualizacja: [WSTAW_DATE_NP_28.04.2026]</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200">
          <div className="space-y-8 text-slate-600 leading-relaxed">
            
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Postanowienia ogólne</h3>
              <p>
                Niniejszy Regulamin określa zasady funkcjonowania i korzystania z serwisu internetowego 
                dostępnego pod adresem CzyPolskaFirma.pl (dalej: "Serwis"). Właścicielem i Administratorem 
                Serwisu jest <strong>[TWOJE_IMIĘ_I_NAZWISKO_LUB_NAZWA_FIRMY]</strong>.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Rodzaj i zakres świadczonych usług</h3>
              <p>
                Serwis CzyPolskaFirma.pl jest darmowym portalem informacyjnym, który udostępnia użytkownikom bazę danych 
                zawierającą informacje o strukturze właścicielskiej oraz kraju pochodzenia kapitału firm operujących na polskim rynku. 
                Korzystanie z Serwisu jest dobrowolne, całkowicie bezpłatne i nie wymaga rejestracji konta.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Wyłączenie odpowiedzialności (Disclaimer)</h3>
              <p className="mb-3">
                Wszelkie dane prezentowane w Serwisie, w tym przypisany status "Polska Firma" oraz informacje o właścicielach, 
                mają charakter wyłącznie informacyjny, poglądowy i edukacyjny. Zespół Serwisu dokłada wszelkich starań, aby dane były rzetelne, 
                aktualne i oparte na publicznie dostępnych rejestrach (np. KRS, CRBR), jednakże:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-2">
                <li>Struktury własnościowe mogą ulegać dynamicznym zmianom, dlatego Administrator nie gwarantuje, że dane są w 100% poprawne i aktualne w każdym momencie.</li>
                <li>Administrator nie ponosi odpowiedzialności cywilnej ani karnej za jakiekolwiek decyzje konsumenckie, biznesowe czy inwestycyjne podjęte przez Użytkowników na podstawie informacji zawartych w Serwisie.</li>
                <li>Dane publikowane na stronie nie stanowią oficjalnej opinii prawnej ani porady gospodarczej.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">4. Prawa autorskie i ochrona bazy danych</h3>
              <p>
                Wszelkie treści udostępniane w Serwisie, włączając w to koncepcję, układ graficzny, logo oraz 
                zgromadzoną i skompilowaną bazę danych, podlegają ochronie prawnej praw autorskich i praw pokrewnych. 
                Zabrania się zautomatyzowanego pobierania danych (tzw. web scraping), masowego kopiowania oraz 
                wykorzystywania danych bazy do celów komercyjnych bez wyraźnej, pisemnej zgody Administratora.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">5. Zgłaszanie błędów i weryfikacja</h3>
              <p>
                W przypadku dostrzeżenia nieścisłości lub nieaktualnych informacji w profilach poszczególnych firm, 
                Użytkownik ma możliwość zgłoszenia poprawki poprzez przycisk "Zgłoś uwagi" w profilu firmy lub mailowo na adres: 
                <strong>[TWÓJ_ADRES_EMAIL]</strong>. Administrator zastrzega sobie prawo do weryfikacji każdego zgłoszenia 
                przed wprowadzeniem zmian do bazy danych, bez podawania przyczyny odrzucenia zgłoszenia.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">6. Postanowienia końcowe</h3>
              <p>
                Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszym Regulaminie (np. ze względu na zmiany w prawie lub rozwój Serwisu). 
                Korzystanie z Serwisu po wprowadzeniu zmian oznacza ich akceptację. W sprawach nieuregulowanych niniejszym Regulaminem 
                zastosowanie mają odpowiednie przepisy powszechnie obowiązującego prawa polskiego.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
