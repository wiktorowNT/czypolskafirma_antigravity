# Zadanie: audyt procesów CzyPolskaFirma i automat dodawania firm

## Kontekst i cel

Prowadzę CzyPolskaFirma sam, po godzinach. Chcę **dodawać więcej firm, szybciej i
lepiej**, a na treści (blog, X, Facebook) poświęcać mniej czasu. Najwięcej czasu i
ręcznej roboty zabiera mi dodawanie firm: kopiuję prompty do 5 czatów AI, scalam
wyniki, uzupełniam Google Sheets i importuję CSV do Supabase.

Od Ciebie chcę dwóch rzeczy, w tej kolejności:
1. **Audytu**, czyli rzetelnej oceny tego, jak dziś działa cały projekt od strony
   procesów i narzędzi, i projektu docelowego rozwiązania.
2. **Wdrożenia** najważniejszej części, czyli automatu dodawania firm, **dopiero po
   mojej akceptacji**.

Najważniejsza jest wiarygodność danych. Błędna klasyfikacja znanej marki szkodzi
bardziej niż 50 niedodanych firm. Automatyzacja ma odbierać mi żmudną robotę, a nie
decyzję o klasyfikacji.

## Co przeczytać

- `CLAUDE.md` (zasady pracy, obowiązują bezwzględnie)
- `docs/SOP_dodawanie_firm.md`: obecny proces dodawania firm, krok po kroku
- `docs/METODOLOGIA_V2_przypadki_brzegowe.md`: drzewo decyzyjne, hierarchia źródeł, świeżość danych
- `docs/SOP_logotypy.md`, `docs/AUTOMATYZACJA_TRESCI.md`, `docs/STRATEGIA_WZROSTU.md`,
  `docs/PROMPTY_OPERACYJNE.md`, `docs/AUDYT_TECHNICZNY_2026-07.md`, `docs/BACKUP_STRATEGY.md`
- `.github/workflows/codzienna-tresc.yml`: istniejący automat treści (Claude w GitHub Actions)
- `tools/`: wszystkie narzędzia (m.in. `pipeline-v2.html`, `weryfikator-nip.html`,
  `porownywarka-*.html`, `fetch-logos.mjs`, `lint-tresci.mjs`, `apply-brands-json.mjs`)
- `tools/skills/`: skille do treści (generator-postow, komentator-x, lowca-newsow)
- `lib/supabase/*`, `tools/sql/*`: model danych i dostęp do bazy
- `docs/social/`: tylko struktura i pliki stanu, bez czytania całych paczek

**Nie czytaj** `public/logos/`, `node_modules/` ani całych dużych plików danych
(`data/robocze/*.csv|json`, `docs/social/firmy-cache.json`). Wystarczą nagłówki lub
kilka pierwszych rekordów. Budżet na tę pracę jest ograniczony. Do masowego
przeglądania plików używaj subagentów na tańszym modelu (Sonnet), a sam skup się na
analizie i projekcie.

## Etap 1: audyt (wynik: `docs/AUDYT_PROCESOW_2026-09.md`)

Chcę dostać:

1. **Mapę obecnych procesów**: dodawanie firm, logotypy, treści i social media,
   indeksacja SEO, backup. Przy każdym kroku zaznacz, co jest ręczne, co zautomatyzowane
   i gdzie ginie najwięcej mojego czasu.
2. **Wąskie gardła i ryzyka jakości.** Gdzie mogą przedostać się błędy (halucynacje
   modeli, nieaktualne dane, brak źródeł, ręczne kopiowanie)?
3. **Przegląd narzędzi.** Które narzędzia z `tools/` są nadal potrzebne, które się
   dublują, a które są martwe? Czego brakuje?
4. **Projekt docelowego automatu dodawania firm.** Wejście: lista nazw albo kategoria.
   Wyjście: szkice rekordów gotowe do mojej akceptacji. Ma obejmować wyszukanie NIP i
   KRS, ustalenie struktury właścicielskiej ze źródłami i datami (wg metodologii i
   hierarchii źródeł), opis właścicielski i opis działalności, samokontrolę zgodności z
   metodologią, oznaczenie pewności i listę KONFLIKTÓW do mojej decyzji, a na końcu
   import do Supabase.
   - Sprawdź w praktyce, które źródła da się odpytywać automatycznie (np. otwarte API
     KRS, CRBR, rejestr.io, GUS BIR) i na jakich warunkach. Nie zakładaj z pamięci.
   - Zarekomenduj, gdzie automat ma działać: lokalny skrypt, `claude -p` lub Agent SDK
     czy GitHub Actions na wzór automatu treści. Podaj uzasadnienie.
   - Podaj szacowany koszt na firmę i model do codziennej pracy. Do rutynowej pracy
     automatu przewiduj tańszy model niż Fable.
5. **Treści**: co jeszcze da się uprościć lub poprawić w automacie treści i skillach.
   Chodzi i o mój czas, i o jakość.
6. **Ranking pomysłów** według kryterium: (oszczędzony czas × wpływ na jakość) / nakład
   pracy. Z krótkim uzasadnieniem, zaczynając od najlepszych.
7. **Pytania do mnie**, np. ile realnie trwa dziś który krok, jeśli nie da się tego
   wywnioskować.

Pisz konkretnie, bez korporacyjnej waty. **Po etapie 1 zatrzymaj się i poczekaj na moją
akceptację.** Nie zmieniaj żadnego kodu.

## Etap 2: wdrożenie (tylko po akceptacji)

Zbuduj MVP automatu dodawania firm według zatwierdzonego projektu. Wymagania:

- **Nic nie trafia do tabeli `companies` bez mojego zatwierdzenia.** Wyniki idą do pliku
  roboczego albo tabeli roboczej. Import zatwierdzonych rekordów to osobny krok, który
  domyślnie uruchamia się w trybie próbnym (dry-run) i pokazuje, co zmieni.
- Każde ustalenie właścicielskie ma źródło z datą. Brak źródła = niska pewność = KONFLIKT.
- Przegląd wyników ma być dla mnie szybki: widzę sporne pozycje, zatwierdzam resztę
  hurtem. Możesz rozbudować `tools/pipeline-v2.html` albo zaproponować coś prostszego.
- **Walidacja na prawdziwych danych:**
  - Uruchom automat na 5 firmach, które już są w bazie, w tym na co najmniej jednym
    trudnym przypadku (spółka przez Cypr lub Holandię, złota klatka, spółka giełdowa z
    rozproszonym akcjonariatem). Porównaj wyniki z obecnymi rekordami i opisz
    rozbieżności.
  - Uruchom go też na 3 nowych firmach.
- Zaktualizuj `docs/SOP_dodawanie_firm.md`, tak żeby opisywał nowy proces.
- Nowe skrypty to ESM `.mjs` w `tools/`.

## Zasady

- Pracujesz na gałęzi `develop`. **Nigdy** nie dotykaj `main`.
- Nie ruszaj `.env.local` i nie wypisuj kluczy. Jeśli automat potrzebuje nowego klucza
  (np. GUS), opisz, jak go zdobyć i gdzie go wpisać.
- W tym samym repozytorium może równolegle pracować inna sesja (nowy wygląd strony).
  Commituj wyłącznie swoje pliki (`git add` konkretnych ścieżek, nigdy `git add .` ani
  `npm run save`) i tylko po mojej zgodzie.
- Jeśli coś w obecnych dokumentach jest sprzeczne albo nieaktualne, wskaż to. Nie
  zgaduj po cichu.
