# Odczyt tabeli `companies` a limit 1000 wierszy

**Dotyczy:** każdego miejsca w kodzie, które chce „wszystkie firmy".
**Helper:** `lib/companies-paged.ts`. **SQL agregatu:** `tools/sql/2026-11-04-statystyki-rpc.sql`.

## Na czym polega pułapka

Instancja Supabase ma ustawione **`db-max-rows = 1000`**. PostgREST zwraca więc maksymalnie
1000 wierszy na zapytanie i robi to **cicho**: bez błędu, bez ostrzeżenia, bez niczego
w odpowiedzi, co pokazywałoby obcięcie. Kod dostaje poprawnie wyglądającą tablicę.

Dwie rzeczy, które zwykle myli się przy tym limicie:

- **Własny `limit=` go nie podnosi.** Serwer bierze `min(limit, db-max-rows)`, więc
  `.limit(20000)` kończy się na 1000 wierszach. Tak było w liczniku firm na `/kategorie`:
  liczby przy kategoriach sumowały się do 1000 zamiast do 1555.
- **`count` jest bezpieczny.** `Prefer: count=exact` i `{ count: "exact", head: true }`
  liczą po całej tabeli i nie podlegają limitowi — dlatego `/api/companies/count` zawsze
  pokazywał prawidłowe 1555, podczas gdy `/api/stats` publikował `total: 1000`.

Przy 1555 firmach każde „pobierz wszystkie i policz" bez stronicowania liczyło na próbce
~2/3 bazy. Trafiło to kolejno: sitemapę firm (commit `68862d5`), potem `/api/stats`
i liczniki na `/kategorie`.

## Jak to robić poprawnie

Pełny odczyt `companies` idzie przez `lib/companies-paged.ts`:

- `pobierzWszystkieFirmy(supabase, select, opcje)` — klient supabase-js
  (filtr `published` dokłada sam `lib/supabase/server.ts`),
- `pobierzWszystkieFirmyRest(select, opcje)` — trasy wołające PostgREST `fetch`em
  (filtr dokładany ręcznie przez `FILTR_PUBLIKACJI`, stronicowanie nagłówkiem `Range`).

Dwie zasady przy użyciu:

1. **Tiebreaker w sortowaniu.** Przy własnym `.order()` dodaj `.order("id")`. Bez unikalnego
   klucza wiersze o równej wartości mogą się między stronami powtórzyć albo zgubić.
2. **Sprawdzaj `complete`.** Oba warianty zwracają `{ rows, complete }`. `complete: false`
   znaczy, że któraś strona padła i `rows` jest niepełne — wtedy **nie publikuj liczb**
   policzonych z tej próbki. `/api/stats` oddaje w tej sytuacji 500 (sekcja statystyk się
   nie renderuje), a sitemapa pustą mapę. Zafałszowana liczba jest gorsza niż jej brak.

## Czego stronicować NIE trzeba

Zapytania, które z definicji nie zbliżają się do 1000 wierszy — i nie powinny przechodzić
przez helper, bo to tylko dodatkowe zapytania:

- zawężone listą id lub slugiem (`/api/companies/by-ids` — do 50 id),
- zawężone `category_id` (`lib/supabase/category-cache.ts`, „podobne firmy" — największa
  kategoria ma 179 firm),
- wyszukiwarki z `limit` 20–50 (`/api/companies/search`, `/api/generator/search`),
- liczniki przez `count` (patrz wyżej).

## Statystyki: agregat w bazie

`/api/stats` liczy docelowo **po stronie Postgresa** przez RPC `get_company_stats`
(`tools/sql/2026-11-04-statystyki-rpc.sql`) — jedno zapytanie, jeden wiersz w odpowiedzi,
zero sumowania 1555 wierszy JSON na Vercelu przy każdym odświeżeniu. Dopóki właściciel nie
wklei SQL-a w Supabase, trasa schodzi na stronicowany fallback w Node: liczby są poprawne
w obu wariantach, RPC jest tańszy w CPU. Metodologia jest w obu identyczna (polska firma =
`country_code = 'PL'`, kategorie od 3 firm, firmy bez kategorii w kubełku „Inne").

## Gdzie helper jest użyty (stan 2026-11-04)

- `/api/stats` (fallback), `/api/companies`, `/kategorie`, `lib/home-data.ts`,
  `lib/sitemap-data.ts`, `lib/blog-companies.ts`, `lib/supabase/get-categories.ts`,
  `lib/supabase/get-companies.ts` (PR #74).
- `/companies`: HTML listy wszystkich firm, czyli to, co widzi Google. Wcześniej 1000 z 1555;
  resztę dociągała dopiero przeglądarka. Przy `complete: false` strona pokazuje to, co
  udało się pobrać, zamiast pustej listy na dobę ISR (lista to nie statystyka).
- Fallback po `slugify` w profilu firmy (`app/firma/[slug]/page.tsx`) i w karcie OG
  (`app/firma/[slug]/opengraph-image.tsx`). Wcześniej firma spoza pierwszego tysiąca pod
  niekanonicznym URL-em (wielkie litery, nawiasy, polskie znaki w slugu z bazy) dostawała 404,
  a jej karta OG grafikę zastępczą. Dołożone po scaleniu migracji do Next 15.

Sprawdzone na atrapie PostgREST z 2500 firmami i twardym limitem 1000 wierszy na odpowiedź:
`/api/stats` daje `total: 2500`, `/kategorie` liczniki sumujące się do 2500, `/companies`
2500 linków w HTML, a profil i karta OG firmy nr 2100 z surowym slugiem renderują się z jej
danymi.
