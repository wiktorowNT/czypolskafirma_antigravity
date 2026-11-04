# Audyt SEO, listopad 2026 (linkowanie wewnętrzne)

> Stan na 2026-11-04, sprawdzony na produkcji (czypolskafirma.pl) i na lokalnym buildzie
> z atrapą bazy. Nacisk: linkowanie wewnętrzne, metadane, dane strukturalne, robots i sitemapy.
> Wdrożone poprawki: gałąź `claude/sleepy-hamilton-axox4e`, PR do `develop`.

## Próbka

| Typ | Adresy |
|---|---|
| Profile (12) | `zabka`, `biedronka`, `lidl`, `orlen`, `inpost`, `e-wedel`, `zywiec-zdroj` (rozpoznawalne), `ambra` + `cin-cin` (marki tej samej spółki), `kakadu` (puste `name`), `mdd`, `kinderkraft` (niszowe) |
| Kategorie (5) + listy | `banki`, `agd`, `napoje-i-alkohole`, `handel`, `chemia`, `/kategorie`, `/companies`, `/companies?page=2` |
| Blog (5) + lista | `kto-jest-wlascicielem-biedronki`, `kto-jest-wlascicielem-lidla`, `inpost-przejecie-advent-fedex-paczkomaty`, `supermarkety-w-polsce-wlasciciele`, `zabka-7-eleven-koniec-rozmow`, `/blog` |
| Inne | `/`, `/szukaj?q=zabka`, `/ulubione`, `/metodologia`, `/o-projekcie`, `/firma/Zabka` (stary slug) |

Dane pomocnicze z publicznego API i plików repo: 1555 firm, 171 spółek ma w bazie więcej niż
jedną markę (600 profili, do 11 marek na spółkę, np. Decathlon, Estée Lauder), 4 firmy mają puste
`name`, 69 profili jest wymienionych w `relatedCompanies` co najmniej jednego wpisu, 10 z 32 wpisów
nie ma zdjęcia w frontmatterze.

## Co działa dobrze (bez zmian)

- Canonical na każdej sprawdzonej stronie wskazuje samą siebie; `/companies?page=2` kanonizuje się na `/companies`.
- Stare slugi przekierowują 308 na kanoniczny (`/firma/Zabka` → `/firma/zabka`).
- `/szukaj?q=…` ma `noindex, follow`, więc wyniki wyszukiwania nie wchodzą do indeksu jako cienka treść.
- Profile mają werdykt w tytule, Organization + FAQPage + BreadcrumbList, kartę OG z werdyktem.
- Sitemapy są spójne z treścią: 1555 firm, 27 kategorii, 32 wpisy; indeks wskazuje cztery podmapy.
- Stron-sierot nie ma: `/companies` linkuje wszystkie 1555 profili, `/blog` wszystkie wpisy,
  strona główna wszystkie 27 kategorii. Problemem nie jest brak linków, tylko ich rozkład (niżej).

## Ustalenia

Wpływ: **duży** = zmienia to, jak Google odkrywa i wiąże dziesiątki lub setki stron;
**średni** = poprawia snippet, kartę społecznościową albo zrozumienie strony; **mały** = porządek.

### Priorytet wysoki

| # | Ustalenie | Wpływ | Plik | Status |
|---|---|---|---|---|
| W1 | **Profil nie linkuje do wpisów, które o nim piszą.** Na 12 profilach z próbki 0 linków `/blog/…`, choć np. Żabka ma 3 wpisy, a Lidl 2. Wpisy linkują do profili (sekcja „Firmy z tego wpisu”), odwrotnego kierunku nie ma. Dotyczy 69 profili. | duży: wpisy mają najwyższy CTR w serwisie, a profile o markach z bloga są najczęściej wyszukiwane | `app/firma/[slug]/page.tsx`, `lib/blog.ts`, `components/CompanyBlogPosts.tsx` | wdrożone |
| W2 | **Marki tej samej spółki nie linkują między sobą.** Ambra linkuje swoje marki z diagramu własności (pole `brands`), ale Cin&Cin, Fresco, Piccolo itd. nie linkują ani do Ambry, ani do siebie. Brak też linków do innych spółek tego samego właściciela (np. Günther Reh AG). Dotyczy 600 profili w 171 spółkach. | duży: klaster tematyczny „kto jest właścicielem X” i ścieżka crawla między markami | `app/firma/[slug]/page.tsx`, `components/CompanyFamily.tsx` | wdrożone |
| W3 | **Alternatywy to zawsze te same 8 firm na kategorię.** Zapytanie brało 24 firmy kategorii po `name` rosnąco, więc każdy profil linkował do pierwszych alfabetycznie, a reszta kategorii nie dostawała linków z profili wcale. | duży: rozkład linków wewnętrznych na ~1500 profili | `app/firma/[slug]/page.tsx` | wdrożone |
| W4 | **Wpisy bez zdjęcia nie mają `og:image`, a karta na X pokazuje tytuł i opis strony głównej.** Dotyczy 10 z 32 wpisów (np. `zabka-7-eleven-koniec-rozmow`: `twitter:title` = „CzyPolskaFirma — sprawdź pochodzenie kapitału firmy”). | średni do dużego dla ruchu z X i Facebooka | `app/blog/[slug]/page.tsx` | wdrożone |
| W5 | **`og:url` strony głównej na podstronach.** `/blog`, `/metodologia`, `/o-projekcie`, `/companies`, `/ulubione`, `/szukaj` dziedziczą z layoutu `og:url = https://czypolskafirma.pl`, więc Facebook przypisuje udostępnienia tych stron stronie głównej. | średni | `app/layout.tsx`, `app/blog/page.tsx` | wdrożone (rekomendacje R1 i R6 dla stron spoza listy) |

### Priorytet średni

| # | Ustalenie | Wpływ | Plik | Status |
|---|---|---|---|---|
| S1 | Opisy meta wszystkich profili zagranicznych mają em-dash („…z kapitałem zagranicznym — kraj pochodzenia: …”), tak samo `og:title` profili, tytuł domyślny i karty społecznościowe z layoutu, alt karty OG profilu. Snippet Google to widoczny tekst serwisu. | średni | `app/firma/[slug]/page.tsx`, `app/firma/[slug]/opengraph-image.tsx`, `app/layout.tsx` | wdrożone |
| S2 | JSON-LD profilu: `Organization.url` był adresem profilu w serwisie, czyli schema mówiła, że oficjalną stroną Żabki jest czypolskafirma.pl. Brak węzła `WebPage` i identyfikatorów `@id`, przez co Organization, BreadcrumbList i witryna nie były ze sobą powiązane. | średni | `app/firma/[slug]/page.tsx`, `app/layout.tsx` | wdrożone |
| S3 | JSON-LD wpisu: brak `BreadcrumbList`, `dateModified`, `image` dla 10 wpisów (Google zaleca obrazek w Article), brak powiązania z firmami, o których jest wpis. | średni | `app/blog/[slug]/page.tsx` | wdrożone |
| S4 | „Czytaj też” we wpisie to zawsze 2 najnowsze wpisy, więc każdy wpis linkuje do tych samych dwóch, a starsze wpisy mają linki tylko z `/blog`. | średni | `app/blog/[slug]/page.tsx`, `lib/blog.ts` | wdrożone |
| S5 | Tytuły wpisów mają 81 do 95 znaków razem z sufiksem „ \| CzyPolskaFirma.pl”; Google ucina je w połowie słowa. | średni (CTR wpisów) | `app/blog/[slug]/page.tsx` | wdrożone |
| S6 | `/ulubione` jest w sitemapie i ma `index, follow`, a crawler widzi pustą stronę bez H1 (lista żyje w localStorage). | średni (cienka treść) | `lib/sitemap-data.ts`; `app/ulubione/page.tsx` | z sitemapy usunięte; `noindex` w R2 |
| S7 | Opis strony głównej obiecuje „ponad 500 firm” (jest 1555) i „podatki”, których serwis nie pokazuje. | średni | `app/layout.tsx` | wdrożone |
| S8 | Okruszki na profilu pokazują nazwę kategorii zrobioną ze sluga („Napoje I Alkohole”), a JSON-LD ma „Napoje i alkohole”. | mały do średniego | `app/firma/[slug]/CompanyProfileClient.tsx` | wdrożone |
| S9 | Strony kategorii: brak `og:image` (własny openGraph nadpisuje obrazek z layoutu), opis z jednego szablonu z nazwą kategorii dwa razy, brak `BreadcrumbList`, brak linków do innych kategorii i do wpisów o firmach z kategorii. | średni | `app/kategoria/[slug]/**` | rekomendacja R3 (sesja wydajności) |
| S10 | `/companies` (i `?page=2`) ma `og:url` strony głównej i 1555 linków na jednej stronie. Jako hub działa, ale pojedynczy link z takiej strony waży niewiele. | średni | `app/companies/**` | rekomendacja R1, R4 (sesja wydajności) |

### Priorytet niski

| # | Ustalenie | Plik | Status |
|---|---|---|---|
| N1 | `Disallow: /szukaj/` w robots.txt nie blokuje `/szukaj?q=…` (reguła ze slashem pasuje tylko do podścieżek). To akurat dobrze: Google musi wejść na stronę, żeby zobaczyć `noindex`. **Nie zmieniać na `/szukaj`.** Komentarz w `app/szukaj/page.tsx` („zablokowane w robots.txt”) jest mylący. | `app/robots.ts` | bez zmian, opis tutaj |
| N2 | `public/robots.txt` dubluje `app/robots.ts` (ta sama treść). Przy przyszłej zmianie jednego z nich łatwo o rozjazd. | `public/robots.txt` | rekomendacja R5 |
| N3 | `lastmod` kategorii i stron statycznych w sitemapach to stała 2026-07-23, choć kategorie zmieniają się z każdą nową firmą. | `lib/sitemap-data.ts`, `app/sitemap-kategorie.xml/route.ts` | do zrobienia później: `lastmod` kategorii = najnowszy `verified_at`/`created_at` firm w kategorii |
| N4 | Pytanie FAQ „Kto jest właścicielem Żabka?” bez odmiany nazwy. Odmiana nazw marek bez słownika jest ryzykowna; można przeformułować na „Kto jest właścicielem marki Żabka?”. Zmienia tekst FAQ na 1555 profilach, więc osobna decyzja. | `lib/company-faq.ts` | do decyzji właściciela |
| N5 | Tytuły profili mają 58 do 72 znaków z sufiksem; Google ucina sam sufiks, werdykt zostaje widoczny. Zmiana tytułów 1555 stron naraz to ryzyko w GSC, korzyść mała. | `app/firma/[slug]/page.tsx` | bez zmian |
| N6 | FAQPage na profilach nie da rozszerzonych wyników (Google pokazuje je od 2023 r. tylko serwisom rządowym i medycznym). Nie szkodzi, zostaje jako opis treści. | `app/firma/[slug]/page.tsx` | bez zmian |
| N7 | Teksty z formą „my”, em-dashami i frazą „w dobie” w komponentach profilu, bloga i bloku „Dlaczego polskie” na stronie głównej. | `components/CompanyHero.tsx`, `CompanyArticle.tsx`, `PolishAlternatives.tsx`, `WhyPolish.tsx`, `home-blog-section.tsx`, `lib/company-faq.ts`, `app/blog/**`, `CompanyProfileClient.tsx` | wdrożone |

## Co wdrożono (szczegóły)

1. **Sekcja „Więcej o tej firmie na blogu” na profilu** (W1). `getPostsForCompany()` w `lib/blog.ts`
   czyta te same pliki `content/blog/*.md` co lista bloga (frontmatter `relatedCompanies`), bez
   zapytania do bazy. Do 4 wpisów, od najnowszego. Pliki wpisów trafiają do funkcji profilu przez
   śledzenie plików Next (`.next/server/app/firma/[slug]/page.js.nft.json` zawiera 33 pliki
   `content/blog`), więc działa też przy regeneracji ISR na Vercelu. Profil dostaje też
   `subjectOf` (Article) w JSON-LD.
2. **Sekcja „Inne marki z tej samej spółki co X” i „Inne firmy, których właścicielem jest Y”** (W2).
   Jedno zapytanie `or(name.eq…, owner_name.eq…)` zawężone równością (bez pełnego odczytu tabeli),
   do 12 linków w każdej grupie. Puste `name` i ogólnikowi właściciele („Rozproszony akcjonariat”,
   „Inwestorzy…”, „Brak…”) są pomijani. Marki klikalne już w diagramie własności się nie powtarzają.
3. **Rotacja alternatyw** (W3). Kandydaci to cała kategoria (jedno zapytanie, limit 500), polskie
   firmy najpierw; początek listy wyznacza stały hash id profilu, więc każdy profil linkuje do innego
   wycinka kategorii, a wynik jest stabilny między regeneracjami. Marki z sekcji spółki nie zajmują
   miejsc w alternatywach.
4. **Metadane wpisu** (W4, S5). Zawsze `og:image` i `twitter:*` z tytułem wpisu (obrazek zastępczy
   `/og-image.png` dla wpisów bez zdjęcia). Tytuł dłuższy niż 60 znaków idzie bez sufiksu serwisu.
5. **`og:url` z layoutu usunięty** (W5), `/blog` ma własny openGraph.
6. **JSON-LD profilu** (S2): `WebPage` (`about`, `breadcrumb`, `isPartOf`, `dateModified` = data
   weryfikacji), `Organization` z `@id` i `url` = oficjalna strona marki (adres profilu tylko gdy
   strony brak), `legalName` pomijane, gdy puste. `WebSite` i `Organization` serwisu w layoucie
   dostały `@id`.
7. **JSON-LD wpisu** (S3): `@graph` z `Article` (`dateModified`, `image` zawsze, `about` = firmy
   z wpisu przez te same `@id` co na profilach, `isPartOf`) i `BreadcrumbList` (Start, Blog, wpis).
8. **„Czytaj też” po wspólnych firmach** (S4): `getRelatedPosts()` sortuje po liczbie wspólnych
   `relatedCompanies`, potem po dacie.
9. Teksty bez em-dashy i formy „my” (S1, S7, N7), okruszki z nazwą kategorii z bazy (S8),
   `/ulubione` poza sitemapą (S6).

Werdykty, opisy działalności i opisy własnościowe firm są bez zmian: przychodzą z bazy.

## Czego nie wdrożono i dlaczego

- Strony kategorii, `/companies`, `/kategorie`: pliki sesji wydajności (tylko rekomendacje niżej).
- `noindex` dla `/ulubione` i własny openGraph dla strony głównej, `/metodologia`, `/o-projekcie`:
  pliki spoza listy tej sesji (`app/ulubione/page.tsx`, `app/page.tsx`, `app/metodologia/**`,
  `app/o-projekcie/**`).
- `public/robots.txt`: poza listą plików tej sesji.
- N3 (lastmod kategorii), N4 (pytanie FAQ), N5 (tytuły profili): niski priorytet albo decyzja
  właściciela; zmiana tekstu na 1555 profilach naraz zasługuje na osobny PR.

## Rekomendacje dla plików innych sesji

| # | Dla kogo | Plik | Rekomendacja |
|---|---|---|---|
| R1 | wydajność | `app/companies/page.tsx` | Dodać `openGraph: { url: "https://czypolskafirma.pl/companies", … }` (po usunięciu `og:url` z layoutu strona nie ma już złego adresu, ale własny jest lepszy). |
| R2 | właściciel / dowolna sesja | `app/ulubione/page.tsx` | `robots: { index: false, follow: true }`. Strona jest pusta dla crawlera; z sitemapy już zniknęła. |
| R3 | wydajność | `app/kategoria/[slug]/**` | (a) `openGraph.images` (np. `/og-image.png`) albo własna karta OG kategorii; (b) opis bez podwójnej nazwy kategorii, z liczbą firm i liczbą polskich, np. „Banki w Polsce: N firm, w tym M z polskim kapitałem. Sprawdź, które banki należą do zagranicznych grup.” (N i M liczone z danych kategorii); (c) `BreadcrumbList` (Start → Kategorie → kategoria); (d) blok „Inne kategorie” (4 do 6 linków) i „Na blogu o firmach z tej kategorii” (wpisy, których `relatedCompanies` przecina się z firmami kategorii, przez `getAllPosts()` z `lib/blog.ts`, bez zapytania do bazy; trasa jest dynamiczna, więc wynik trzeba policzyć raz na render, nie per firma). |
| R4 | wydajność | `app/companies/**` | Rozważyć podział listy na litery A-Z albo strony po 200 firm z własnymi canonicalami; dziś 1555 linków na jednej stronie. |
| R5 | porządki | `public/robots.txt` | Usunąć: `app/robots.ts` generuje to samo, a dwa źródła prędzej czy później się rozjadą. |
| R6 | właściciel / dowolna sesja | `app/page.tsx`, `app/metodologia/page.tsx`, `app/o-projekcie/page.tsx` | Własny `openGraph` z `url` (strona główna nie ma teraz `og:url`, co jest poprawne, ale jawny adres jest pewniejszy). |
| R7 | porządki | `next.config.mjs` | Nic nie trzeba: profil dostaje `content/blog` z automatycznego śledzenia plików. Gdyby kiedyś `.nft.json` profilu przestał je zawierać, dopisać `'/firma/[slug]': ['./content/blog/**/*']` do `outputFileTracingIncludes`. |

## Weryfikacja techniczna

- `npm run lint`: 0 błędów (same ostrzeżenia sprzed zmian, głównie `<img>`).
- Build na atrapie PostgREST przechodzi; tabela tras: `/firma/[slug]` dalej `●` (SSG, profile
  generowane na żądanie i trzymane w ISR przez dobę), `/blog/[slug]` dalej `●` z `revalidate 1h`.
  Nowe sekcje nie dodają `cookies()`, `headers()` ani `no-store`, więc trasa nie przechodzi w render
  przy każdym wejściu.
- Dodatkowe koszty na profil: jedno zapytanie (rodzina marek) przy regeneracji raz na dobę;
  zapytanie alternatyw pobiera całą kategorię zamiast 24 wierszy (do ~100 wierszy, 6 kolumn).

## Do sprawdzenia na podglądzie (develop)

1. `/firma/cin-cin`: sekcja „Inne marki z tej samej spółki co Cin&Cin” z Ambrą, Fresco, Piccolo,
   Dorato, Cydrem Lubelskim, Winezją i Centrum Wina.
2. `/firma/ambra`: marki z diagramu nie powtarzają się w sekcji spółki.
3. `/firma/zabka`, `/firma/lidl`, `/firma/inpost`: sekcja „Więcej o tej firmie na blogu” z wpisami.
4. Dwa profile z jednej kategorii (np. `/firma/lidl` i `/firma/aldi`) pokazują różne alternatywy.
5. `/firma/kakadu` (puste `name`): brak sekcji spółki, profil działa.
6. Źródło strony profilu: JSON-LD z `WebPage`, `Organization.url` = strona marki; test w
   [Rich Results Test](https://search.google.com/test/rich-results) dla jednego profilu i jednego wpisu.
7. `/blog/zabka-7-eleven-koniec-rozmow`: `og:image` i `twitter:title` z tytułem wpisu
   (np. [opengraph.xyz](https://www.opengraph.xyz/)); „Czytaj też” pokazuje wpisy o Żabce.
8. `/blog`, `/metodologia`: brak `og:url` strony głównej.
9. `/sitemap-strony.xml`: bez `/ulubione`.
