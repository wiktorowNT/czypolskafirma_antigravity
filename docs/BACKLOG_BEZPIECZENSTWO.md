# Backlog bezpieczeństwa i higieny API

Co zostało do zrobienia po tym, jak gałąź migracji do **Next.js 15** zostanie
scalona do `develop`. Wszystkie punkty poniżej były świadomie pominięte
w PR-ze „bezpieczeństwo i higiena API", bo wymagają albo nowej zależności
(a więc ruszenia `package.json`, którym zarządza sesja migracji), albo
decyzji i konta po stronie właściciela.

Stan na 2026-11-04.

---

## 1. Przegląd RLS w Supabase (W1) — zadanie dla właściciela, nie dla kodu

Robi się to w panelu Supabase, nie w repozytorium, dlatego nie ma tego
w żadnym commicie.

Serwis czyta bazę publicznym kluczem `anon` prosto przez PostgREST, więc
o tym, czego ten klucz NIE może zrobić, decydują wyłącznie polityki RLS.
Klucz `anon` jest w bundlu przeglądarki, czyli zna go każdy odwiedzający.

Do sprawdzenia w Supabase (Authentication → Policies), tabela po tabeli:

- `companies` — czy `anon` ma **tylko** `SELECT`. Jeśli ma `INSERT`,
  `UPDATE` albo `DELETE`, każdy może podmienić werdykt o pochodzeniu
  kapitału. To największe ryzyko dla wiarygodności serwisu.
- `categories` — jak wyżej, tylko `SELECT`.
- `company_views` — `anon` potrzebuje `INSERT` (licznik odsłon zapisuje
  stamtąd), ale **nie** powinien mieć `SELECT`, `UPDATE` ani `DELETE`.
  Sprawdzić też, czy nie da się wstawić wiersza z dowolną datą
  (`created_at` ustawiane przez `DEFAULT now()`, a nie z ciała żądania) —
  inaczej da się podrzucić odsłony „sprzed miesiąca" i przestawić ranking.
- Funkcje RPC `get_popular_companies` i `get_company_view_counts` — czy są
  `SECURITY INVOKER` (a nie `DEFINER`) i czy nie zwracają niczego poza
  licznikami.
- Czy włączone jest RLS na **każdej** tabeli w schemacie `public`.
  Tabela bez RLS jest w PostgREST otwarta dla `anon` na wszystko.

Jeżeli którakolwiek tabela ma dla `anon` prawo zapisu, które nie jest
niezbędne — odebrać je od razu. To jedyny punkt z tej listy, który może
dotknąć opublikowanych danych.

---

## 2. Rate-limit we wspólnym magazynie (W2)

**Dlaczego pominięte:** wymaga `@upstash/ratelimit` + `@upstash/redis`
(nowe zależności) i konta Upstash.

**Stan dzisiaj:** `lib/rate-limit.ts` trzyma licznik w pamięci instancji.
Na Vercel każda instancja funkcji ma własną mapę, więc:

- realny próg to `maxRequests` × liczba aktywnych instancji,
- zimny start zeruje licznik,
- limiter jest hamulcem na przypadkowe pętle i proste boty, a nie
  zabezpieczeniem przed celowym nadużyciem.

Po scaleniu Next 15 jest to opisane w docblocku `lib/rate-limit.ts`
i w komentarzu przy każdym użyciu.

**Co trzeba zrobić:**

1. Właściciel zakłada darmowe konto na https://upstash.com i tworzy bazę
   Redis w regionie europejskim (najbliżej regionu funkcji Vercela).
2. Właściciel dodaje w Vercel (Settings → Environment Variables), dla
   środowisk Production i Preview:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   Te dwa **nie** mogą mieć prefiksu `NEXT_PUBLIC_` — token daje prawo
   zapisu do Redisa i nie może trafić do przeglądarki.
3. `npm i @upstash/ratelimit @upstash/redis`.
4. Przepisać `lib/rate-limit.ts`, zachowując obecną sygnaturę
   `checkRateLimit(ip, endpoint, config)`, żeby nie ruszać dziesięciu
   route handlerów, które już z niej korzystają.
5. Zostawić obecną wersję in-memory jako zapas na wypadek braku zmiennych
   (lokalny `npm run dev` nie powinien wymagać konta Upstash).
6. Przy okazji przenieść tam deduplikację odsłon z `lib/view-guard.ts`
   (patrz punkt 3).

---

## 3. Deduplikacja odsłon poza pamięcią instancji

**Stan dzisiaj:** `/api/companies/views` odrzuca `companyId`, który nie jest
UUID albo nie istnieje w bazie, i liczy jedną odsłonę na dobę z danego IP
na daną firmę. Ale cache potwierdzonych id oraz dedup siedzą w pamięci
instancji (`lib/view-guard.ts`), więc:

- zimny start zeruje dedup,
- bot rozproszony po wielu adresach IP nadal napompuje licznik.

**Dwie drogi, do wyboru przez właściciela:**

- **A (prostsza, bez nowych zależności, ale wymaga migracji SQL):** dodać
  do `company_views` kolumnę `ip_hash text` (skrót IP z solą, nie samo IP —
  RODO) i unikalny indeks częściowy na `(company_id, ip_hash, date_trunc('day', created_at))`.
  Wtedy duplikat odrzuca baza i nie zależy to od pamięci instancji.
  Trzeba sprawdzić, czy `anon` może wstawiać `ip_hash` i czy nie może go
  czytać.
- **B:** trzymać dedup w Redisie razem z rate-limitem z punktu 2.

---

## 4. ESLint i `npm run lint` w CI

**Dlaczego pominięte:** wymaga nowych devDependencies.

**Stan dzisiaj:** w repo nie ma pliku `.eslintrc*` ani pakietów `eslint`
i `eslint-config-next`. `npm run lint` (`next lint`) wchodzi więc w tryb
interaktywnego kreatora konfiguracji i kończy się kodem 1 niezależnie od
jakości kodu. Dlatego krok „Lint" w `.github/workflows/ci.yml` ma na razie
`continue-on-error: true`.

**Co trzeba zrobić po scaleniu Next 15:**

1. `npm i -D eslint eslint-config-next` (wersja `eslint-config-next`
   musi odpowiadać wersji Next).
2. Dodać `.eslintrc.json` z `{ "extends": "next/core-web-vitals" }`.
3. Usunąć `continue-on-error: true` z kroku „Lint" w `ci.yml`.
4. Rozważyć zdjęcie `eslint.ignoreDuringBuilds` z `next.config.mjs` —
   dziś build przepuszcza wszystko.

Przy okazji: `next.config.mjs` ma też `typescript.ignoreBuildErrors: true`,
a `npx tsc --noEmit` pokazuje na `develop` kilkanaście błędów typów
(głównie `components/ui/*` z szablonu v0 i `lib/supabase/get-categories.ts`).
Build ich nie widzi. Warto je kiedyś posprzątać i zdjąć tę flagę, ale to
osobne zadanie i nie na jeden PR.

---

## 5. Sekrety Supabase dla GitHub Actions

**Zadanie dla właściciela, jednorazowe.**

`npm run build` prerenderuje `/api/categories` i `/api/companies/count`,
czyli **sięga do Supabase w czasie kompilacji**. Bez zmiennych build pada na
eksporcie `/api/categories` (dzieje się tak również na czystym
`origin/develop`, to nie regresja).

Żeby job „Lint i build" w CI przechodził, trzeba dodać w
**Settings → Secrets and variables → Actions → New repository secret**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Oba są publiczne (prefiks `NEXT_PUBLIC_`, i tak trafiają do bundla
przeglądarki), więc nie jest to ujawnienie tajemnicy. Dopóki ich nie ma,
CI zatrzymuje się na kroku „Sprawdz, czy sekrety Supabase sa ustawione"
z komunikatem, co dodać.

---

## 6. Porządki w `package.json`

**Dlaczego pominięte:** `package.json` w sekcji zależności i metadanych
należy do sesji migracji do Next 15.

- `"name": "my-v0-project"` — zostało z szablonu v0, do zmiany na
  `czypolskafirma`.
- Brak `"engines": { "node": "22.x" }` — Vercel i CI używają Node 22,
  warto to zapisać w repo.
- Nie ma żadnych testów. Minimum, które by się tu przydało, to kilka
  przypadków na `lib/search-query.ts` (sanityzacja zapytań),
  `lib/slug-utils.ts` (`slugify`) i `lib/view-guard.ts` (walidacja UUID,
  dedup). To są czyste funkcje, więc test jest tani. Wymaga `vitest`
  w devDependencies i skryptu `test` w `package.json`.

---

## 7. Dwie rzeczy, o których warto pamiętać przy danych, nie w kodzie

Wyszły przy sprawdzaniu wyszukiwarki na żywej bazie i **nie** są błędami
kodu, tylko luką w danych:

- `H&M` — w bazie `slug` to `h-m`, a nazwa prawnej spółki nie zawiera
  ciągu „H&M". Po sanityzacji zapytanie `H&M` szuka wzorca `H*M`, więc
  trafia, ale w szerokim zbiorze (ok. 50 wyników). Dopisanie `H&M` do
  `brand_aliases` tej firmy ustawiłoby ją na pierwszym miejscu.
- `e-obuwie` — w bazie jest `eobuwie.pl`, bez dywizu, więc zapytanie
  z dywizem nie trafia (tak samo przed zmianą i po niej). Też do
  `brand_aliases`.

Ogólniej: `/api/companies/search` nie sortuje wyników po trafności, zwraca
je w kolejności z bazy z `limit=50`. Przy krótkich, ogólnych zapytaniach
właściwa firma może wylądować daleko. Sortowanie po trafności (dokładne
trafienie w `slug`/`display_name` przed trafieniem w środku nazwy) dałoby
się zrobić w samym route handlerze, bez nowych zależności, ale to zmiana
w zachowaniu wyszukiwarki, a nie bezpieczeństwo, więc celowo nie weszła
do PR-a o bezpieczeństwie.

---

## Co z audytu zostało już zrobione

Dla porządku, żeby nie szukać dwa razy:

- **Walidacja licznika odsłon** — `/api/companies/views` wymaga UUID
  istniejącego w bazie, plus dedup per IP i firma na dobę.
- **Sanityzacja filtrów PostgREST** — `lib/search-query.ts`, biała lista
  znaków w `/api/companies/search` i `/api/generator/search`.
- **Rate-limit** — dopięty do 10 z 12 route handlerów. Bez limitera
  zostają świadomie `/api/categories` i `/api/companies/count` (statycznie
  eksportowane, serwowane z CDN, nie dotykają Supabase przy żądaniu — powód
  w komentarzu w obu plikach) oraz `/api/tools/upload-logo` (narzędzie
  lokalne, na produkcji zwraca 404).
- **Logo-proxy** — `app/api/logo/route.ts` już nie istnieje, usunął go
  commit `831eb08f`. Nic w repo się do `/api/logo` nie odwołuje.
- **Logi debug** — usunięte `console.log("[v0]…")` z `lib/` i `app/api/`,
  w tym ten z `lib/supabase/get-companies.ts`, który wypisywał pełną listę
  slugów firm przy każdym wywołaniu. `console.error` zostały.
- **Bezpiecznik `npm run save`** — `tools/save.mjs`, odmawia pracy poza
  `develop` i nie robi `git add .` bez potwierdzenia.
- **CI** — `.github/workflows/ci.yml` (patrz punkty 4 i 5 wyżej co do
  tego, czego mu jeszcze brakuje).
