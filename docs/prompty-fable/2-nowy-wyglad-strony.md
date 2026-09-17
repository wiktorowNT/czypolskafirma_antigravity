# Zadanie: nowy wygląd CzyPolskaFirma

## Kontekst i cel

Strona https://czypolskafirma.pl powstała na wczesnych modelach AI i na bazie
shadcn/v0. Jest czytelna, ale wygląda generycznie, „jak zrobiona przez AI”. W
`app/globals.css` wciąż są fabryczne tokeny shadcn. Chcę wyglądu **oryginalnego,
profesjonalnego i budzącego zaufanie**, z własną tożsamością.

Czym jest projekt: serwis sprawdza, czy marka postrzegana jako polska naprawdę należy
do polskiego kapitału. Jego wartość to rzetelność i praca śledcza, a ton to patriotyzm
gospodarczy **bez kiczu** (bez nadmiaru orłów, flag i biało-czerwonych gradientów).
Czytelnicy to zwykli konsumenci, którzy trafiają z Google i social mediów, często na
telefonie. Najwięcej ruchu z Google trafia na **profile firm** (`/firma/[slug]`).

### Główna inspiracja: Notion

Z wielu obejrzanych stron (gazety, rejestry, big techy) **najbardziej podoba mi się styl
https://www.notion.com**. Zanim zaczniesz, obejrzyj tę stronę w przeglądarce (strona
główna i kilka podstron).

Przenieś **zasady i klimat** Notion, ale nie kopiuj jego ilustracji, logo ani układów 1:1.
CzyPolskaFirma ma mieć własny, rozpoznawalny styl rysunków. Akcent kolorystyczny może
nawiązywać do czerwieni, ale bez biało-czerwonego kiczu.

**Czego unikać:** stylistyki Vercel, Linear i klonów Stripe'a (ciemne tło, poświaty,
kolorowe gradienty). Na niej opiera się szablon v0/shadcn i to ona daje dziś efekt
„strony z AI”.

## Własne grafiki

Uważam, że dużo autentyczności dają **własne grafiki** widoczne na stronie. To od razu
odróżnia stronę od szablonu z AI. Chcę, żebyś zaprojektował grafiki na stronę które dodadzą autentyczności i orginalności:

- **Nie** używaj generatorów obrazów AI ani stocków. To dokładnie ten efekt, którego
  chcę uniknąć.
- **Oceń uczciwie, czy rysunki wektorowe (SVG) robione kodem osiągają poziom
  „ręcznie rysowanego”.** Jeśli nie, nie wstawiaj na siłę słabych grafik. Przygotuj
  zamiast tego przewodnik po stylu ilustracji (kreska, proporcje, postacie, przykładowe
  szkice koncepcyjne) i listę potrzebnych ilustracji z opisem każdej. Będę mógł je
  wtedy zlecić ilustratorowi albo narysować sam. W makietach użyj wyraźnie oznaczonych
  miejsc na ilustracje.
- **Grafiki z danych**, które są tylko nasze, np. ścieżka od marki do ostatecznego
  właściciela (istnieje już `components/OwnershipDiagram.tsx`), udział polskiego
  kapitału w kategoriach czy mapa krajów pochodzenia kapitału. Dane bierz z bazy.
- Spójność z okładkami bloga (`tools/okladka-szablon.html`, `tools/render-blog-cover.mjs`)
  i szablonami grafik do social mediów (`docs/szablony/`). Jeśli nowy styl ich wymaga,
  zaproponuj zmianę.
- Wskaż miejsca, w których **moje własne** materiały (zdjęcia, ręczne szkice, zdjęcia
  produktów z półek) dałyby najwięcej autentyczności. Napisz krótki brief: co
  sfotografować lub narysować i w jakim formacie.

## Co przeczytać i obejrzeć

- `CLAUDE.md` (zasady pracy, obowiązują bezwzględnie)
- `app/globals.css`, `app/layout.tsx` (fonty: Inter + Playfair Display), `app/page.tsx`
- `components/`: zwłaszcza `hero.tsx`, `header.tsx`, `footer.tsx`, `CompanyCard.tsx`,
  `CompanyHero.tsx`, `CompanyArticle.tsx`, `OwnershipDiagram.tsx`, `global-stats.tsx`,
  `category-list.tsx`, `components/ui/`
- `app/firma/[slug]/`, `app/kategoria/[slug]/`, `app/blog/`
- Działająca strona: podgląd `develop` w przeglądarce
  (https://czypolskafirmalive-git-develop-wiktorow123-3833s-projects.vercel.app/).
  Zrób zrzuty ekranu na desktopie i telefonie: strona główna, profil znanej firmy,
  kategoria, blog.

Nie czytaj `public/logos/` ani dużych plików danych. Budżet jest ograniczony, więc do
masowego przeglądania kodu używaj subagentów na tańszym modelu (Sonnet).

## Etap 1: diagnoza i kierunki

1. **Diagnoza**: konkretna lista tego, co dziś sprawia, że strona wygląda generycznie
   (kolory, typografia, karty, cienie, ikony, układ sekcji, teksty w interfejsie).
2. **Trzy warianty stylu inspirowanego Notion**, wyraźnie różne między sobą (np.
   typografią, kolorem akcentu, stylem ilustracji, gęstością układu). Każdy jako
   statyczna makieta HTML
   **strony głównej i profilu firmy**, w wersji desktop i mobile, na prawdziwych danych
   (np. Wedel, Żabka, Orlen, LPP). Każda makieta pokazuje też przykładową grafikę z
   systemu grafik.
   - Pliki zapisz w `docs/design/kierunki/`. Otwórz je w przeglądarce i sprawdź, czy
     dobrze się renderują.
   - Do każdego kierunku dopisz krótko: nazwę, ideę, paletę, fonty i to, czym różni się
     od reszty.
3. **Zatrzymaj się i poczekaj, aż wybiorę kierunek** (albo połączenie kilku). Nie
   zmieniaj kodu aplikacji.

## Etap 2: wdrożenie wybranego kierunku (tylko po mojej akceptacji)

Kolejność (jeśli zabraknie czasu, ważniejsze jest to, co wyżej):
1. System projektowy: tokeny w `app/globals.css` (tryb jasny i ciemny), typografia
   (`next/font`), promienie, obramowania, odstępy, podstawowe komponenty.
2. **Profil firmy** `/firma/[slug]`, razem z diagramem właścicielskim w nowym stylu.
3. Nagłówek, stopka, strona główna.
4. Strona kategorii, lista i wpis na blogu.
5. Pierwsze grafiki z systemu grafik.
6. Krótki dokument `docs/DESIGN_SYSTEM.md`, żeby dalsze strony mógł dokończyć tańszy
   model w tym samym stylu.

## Ograniczenia

- **Nie zmieniaj niczego, co wpływa na SEO i dane**: adresy URL, metadane, `<title>`,
  hierarchia nagłówków, dane strukturalne JSON-LD, sitemapy, treści opisów.
- Nie zmieniaj ani nie kompresuj logotypów w `public/logos/`.
- Kontrast co najmniej WCAG AA. Strona ma działać bez problemu na telefonie (szerokość
  375 px). Bez ciężkich bibliotek i bez spadku wydajności.
- Stack bez zmian: Next.js 14.2, Tailwind v4, komponenty Radix, lucide-react (ikon
  lucide zostaw w drobnych elementach interfejsu).
- Po każdym większym kroku sprawdź wynik: `npm run lint`, `npm run build` i zrzuty
  ekranu z serwera deweloperskiego (desktop i mobile, jasny i ciemny motyw).
- Pracujesz na gałęzi `develop`. **Nigdy** nie dotykaj `main`. Nie ruszaj `.env.local`.
- W tym samym repozytorium może równolegle pracować inna sesja (audyt procesów).
  Commituj wyłącznie swoje pliki (`git add` konkretnych ścieżek, nigdy `git add .` ani
  `npm run save`) i tylko po mojej zgodzie. Ostateczny efekt sprawdzę na podglądzie
  Vercel.
