# Audyt jakości danych firm, listopad 2026

> Stan na **2026-11-04**, na podstawie żywej strony https://czypolskafirma.pl (bez dostępu do bazy).
> Skrypt: `tools/audyt-danych/audyt-danych.mjs` (powtarzalny, opis na końcu).
> Propozycje SQL: `tools/audyt-danych/poprawki-wlasciciele.sql` (nie uruchamiane, do decyzji właściciela).
> Wszystko poniżej to **podejrzenia do ręcznej weryfikacji**. Audyt niczego nie rozstrzyga i niczego nie zmienia w bazie.

## Zakres i metoda

- **Źródła:** `/sitemap-firmy.xml` (1555 profili), HTML każdego profilu `/firma/<slug>`, `/api/companies`,
  `/api/stats`. `/companies/lista.json` jeszcze nie jest wdrożone (zwraca HTML), skrypt sprawdza je przy każdym uruchomieniu.
- **Dane z profilu:** obiekt `company` z payloadu RSC strony (to prawie 1:1 wiersz tabeli `companies`: `owner_name`,
  `parent_company_name`, `name`, opisy, `country_code`, `website_url`, `nip`, data weryfikacji) oraz JSON-LD
  (`Organization`, `legalName`, `parentOrganization`, FAQ) jako kontrola krzyżowa. Oba źródła są zgodne
  (0 rozbieżności `legalName` vs `name`).
- **Pobieranie:** maks. 3 zapytania naraz, pauza 250 ms, User-Agent `audyt-danych.mjs (...)`, cache w `.tmp/audyt-danych/`.
- **Spójność źródeł:** sitemap 1555, sparsowane 1555, błędy 0, `/api/companies` 1555, `/api/stats` total 1555,
  `polishCount` 705 = 705 profili z `country_code = PL`. Brak profili w API spoza sitemapy i odwrotnie.
- **Ważne:** sekcja „Inne firmy, których właścicielem jest …” (`getCompanyFamily` w `app/firma/[slug]/page.tsx`) jest na
  `develop`, ale **jeszcze nie na produkcji** (0 profili z tą sekcją). Problemy z punktu 1 i 2 ujawnią się dopiero po
  wdrożeniu, więc to dobry moment na porządki.

### Ograniczenia

- Profil pokazuje `verified_at ?? created_at`, więc daty weryfikacji nie da się odczytać wprost. Pomaga sitemap:
  `lastmod` to ta sama kolejność dat, a `verified_at` jest typu `date` (północ UTC), `created_at` ma pełny czas.
  Podział jest ostry: 807 profili ma `lastmod` o 00:00:00 (miesiące 2026-09 i 2026-10), 748 ma pełny czas
  (2025-12 do 2026-07). Te 748 traktuję jako „brak `verified_at`”.
- Logo: sprawdzam pliki w `/logos/` (repo i HEAD na stronie) tak jak `components/company-logo.tsx`. Fallbacku Brandfetch
  nie sprawdzam (ładuje się w przeglądarce), więc „brak pliku” znaczy „Brandfetch albo litera”.
- Heurystyki werdyktu czytają tylko tekst profilu. Mają odsiewać, nie rozstrzygać.

## Podsumowanie liczbowe

| # | Obszar | Liczba |
|---|---|---|
| 1 | Grupy właścicieli różniące się tylko zapisem (SQL, sekcja A) | 4 grupy, 14 profili (3 UPDATE + 1 pominięta celowo) |
| 1 | Literówki w `owner_name` (SQL, sekcja A2) | 1 („Akconariat rozproszony”, 4 profile) |
| 1 | Grupy właścicieli różniące się dopiskiem w nawiasie | 45 grup (36 w SQL, sekcja B, zakomentowane; reszta to ogólniki i Skarb Państwa) |
| 1 | Grupy do przeglądu: z formą prawną i bez, Group/Grupa, holding vs spółka | 11 grup |
| 1 | Właściciele „ogólni”, których nie łapie `OGOLNI_WLASCICIELE` | 17 zapisów, w tym 8 łączących **różne** spółki (44 profile) |
| 1 | „Rodzina X” wspólna dla różnych spółek | 9 (1 do sprawdzenia) |
| 2 | Grupy nazwy spółki różniące się zapisem (`'X'` vs `"X"` vs bez cudzysłowu) | 18 grup |
| 2 | Ten sam NIP, różne nazwy spółki | 20 NIP-ów |
| 2 | Nazwa spółki z `"` (wypada z sekcji „inne marki tej spółki”) | 192 profile, w tym 57 ze spółką wielomarkową |
| 2 | Profile bez nazwy spółki (`name = ''`) | 4 |
| 2 | Podwójne spacje w `name` | 8 |
| 3 | Ten sam NIP, różny `country_code` | 8 NIP-ów |
| 3 | Ten sam właściciel, różny `country_code` | 1 (CVC: GB ×6, LU ×1) |
| 3 | Podejrzenia z tekstu opisu/nazwy właściciela | 2 |
| 3 | `ownership_type` spoza słownika | 7 |
| 4 | Bez strony www (logo od razu litera) | 3 (2 bez żadnego logo) |
| 4 | Logo: brak pliku w `/logos` (Brandfetch albo litera) | 10 |
| 4 | Bez opisu działalności / bez opisu własności | 0 / 0 |
| 4 | Krótki opis działalności (<80 znaków) | 2 |
| 4 | Krótki opis własności (<100 znaków) | 126 (29 poniżej 70) |
| 4 | Bez `verified_at` (data z `created_at`) | 748 |
| 4 | Data na profilu starsza niż 12 miesięcy | 0 (najstarsza: 2025-12) |
| 4 | Bez `ownership_type` | 741 |
| 4 | Bez `owner_name` / bez NIP | 0 / 0 |
| 4 | NIP niepoprawny (format lub suma kontrolna) | 1 |
| 5 | Duplikaty: mocne / średnie / słabe | 10 / 9 / 8 |
| 6 | Profile z em-dashem („—”) | 14 |
| 6 | Profile z en-dashem jako pauzą („ – ”) | 47 |
| 6 | Forma „my” w opisach | 0 |

## Priorytety

**P1. Przed wdrożeniem sekcji „Inne firmy właściciela” na produkcję**

1. **Właściciele „ogólni” łączą niepowiązane firmy** (1e). „Polscy właściciele” ma 22 profile z 22 różnych spółek, „Polscy
   założyciele” 8 z 8. Po wdrożeniu np. [bell](https://czypolskafirma.pl/firma/bell) pokaże „Inne firmy, których właścicielem
   jest Polscy właściciele” z 21 przypadkowymi markami. Poprawka w kodzie (poza zakresem tej sesji): rozszerzyć
   `OGOLNI_WLASCICIELE` o początki `polsc|polski|polska|prywatn|założyciele|trzech|dwoje|dwóch` i literówkę `akconariat`
   (wzorzec w `tools/audyt-danych/lib/analiza.mjs`, `czyOgolny`). Alternatywa w danych: zastąpić ogólniki nazwiskami.
2. **Literówka „Akconariat rozproszony”** ([adidas](https://czypolskafirma.pl/firma/adidas), [nike](https://czypolskafirma.pl/firma/nike),
   [ibm](https://czypolskafirma.pl/firma/ibm), [michelin](https://czypolskafirma.pl/firma/michelin)): omija `OGOLNI_WLASCICIELE`,
   więc te 4 firmy pokażą się sobie nawzajem jako „ten sam właściciel”. Poprawka w SQL, sekcja A2: po niej zapis
   trafia w filtr i sekcja przestaje się pokazywać.
3. **Sekcje A i A2 w SQL** (4 UPDATE: kosmetyka i literówka) oraz przegląd sekcji B (grupy z dopiskiem w nawiasie).
4. **Nazwy spółek z `"`** (2f): 57 profili spółek wielomarkowych nie pokaże innych marek tej spółki, a ich siostry nie
   pokażą ich. Propozycje w sekcji C pliku SQL (zakomentowane).

**P2. Dane do ręcznej weryfikacji (możliwy zły werdykt albo zły NIP)**

1. [dekoral](https://czypolskafirma.pl/firma/dekoral): PL, „Grupa Śnieżka”, `owner_name` „Polscy właściciele”, ale `name` i NIP
   to PPG DECO POLSKA (8951760602), wspólne z [progold](https://czypolskafirma.pl/firma/progold), [bondex](https://czypolskafirma.pl/firma/bondex),
   [drewnochron](https://czypolskafirma.pl/firma/drewnochron) (US). Albo zły werdykt, albo zły NIP i nazwa spółki.
2. [beckers](https://czypolskafirma.pl/firma/beckers): SE (Lindéngruppen), ale `name` i NIP PPG DECO POLSKA.
3. [fakt](https://czypolskafirma.pl/firma/fakt) i [ringier-axel-springer-polska](https://czypolskafirma.pl/firma/ringier-axel-springer-polska):
   CH, ale `name` = POLKOMTEL SP. Z O.O. i NIP Polkomtela (5271037727, jak [plus](https://czypolskafirma.pl/firma/plus)). Błędna tożsamość spółki.
4. [santander-bank-polska](https://czypolskafirma.pl/firma/santander-bank-polska) (ES, Banco Santander) i
   [erste-bank](https://czypolskafirma.pl/firma/erste-bank) (AT) mają ten sam NIP 8960005673. Opis Erste mówi o przejęciu
   w 2026 r., więc profil Santandera wygląda na nieaktualny (albo jest duplikatem po zmianie nazwy).
5. [hugo-boss](https://czypolskafirma.pl/firma/hugo-boss) DE („Hugo Boss AG (akcjonariat rozproszony)”) vs
   [boss](https://czypolskafirma.pl/firma/boss) i [hugo](https://czypolskafirma.pl/firma/hugo) GB („Mike Ashley (Frasers Group)”),
   ta sama spółka (oddział HUGO BOSS AG). Jeden z werdyktów jest niespójny.
6. CVC Capital Partners: [comarch](https://czypolskafirma.pl/firma/comarch) ma LU, pozostałe 6 profili CVC ma GB.
7. [zywiec-zdroj](https://czypolskafirma.pl/firma/zywiec-zdroj): NIP = „Zgodny” (to nie NIP) i pusta nazwa spółki.

**P3. Porządki**

1. Duplikaty mocne (sekcja 5): 10 par, do scalenia albo świadomego rozdzielenia (np. Gazeta Wyborcza vs Wyborcza.pl).
2. 748 profili bez `verified_at` (najstarsze z 2025-12), czyli kolejka dla `tools/firmy/automat.mjs --najstarsze N --reweryfikacja`.
   Za ok. miesiąc (2026-12) pierwsze 7 przekroczy 12 miesięcy od dodania.
3. Krótkie opisy własności (126) i em-dashe/en-dashe (14 + 47 profili): przy najbliższej reweryfikacji.
4. `ownership_type`: 741 pustych i 7 spoza słownika.

---

## 1. Właściciel zapisany różnie (`owner_name`)

Sekcja „Inne firmy, których właścicielem jest …” dopasowuje po **dokładnej równości** `owner_name` (po `trim()`), więc
każdy wariant zapisu tworzy osobnego właściciela. Normalizacja w skrypcie ma dwa poziomy: **ścisły** (wielkość liter,
cudzysłowy, ogonki, interpunkcja, zapis formy prawnej: „S.A.” = „SA” = „Spółka Akcyjna”) i **luźny** (dodatkowo bez formy
prawnej, kraju, słów Group/Grupa/Holding).

### 1a. Różnice czysto kosmetyczne (SQL, sekcja A)

| Warianty (liczba profili) | Profile | Różnica | W SQL |
|---|---|---|---|
| „Agora S.A.” (3)<br>„Agora SA” (1) | [tok-fm](https://czypolskafirma.pl/firma/tok-fm), [gazeta-wyborcza](https://czypolskafirma.pl/firma/gazeta-wyborcza), [helios](https://czypolskafirma.pl/firma/helios)<br>[radio-zet](https://czypolskafirma.pl/firma/radio-zet) | kropki | tak |
| „Rodzina Kwiecień (grupa Wistil)” (2)<br>„Rodzina Kwiecień (Grupa Wistil)” (2) | [chodziez](https://czypolskafirma.pl/firma/chodziez), [cmielow-design-studio](https://czypolskafirma.pl/firma/cmielow-design-studio)<br>[cmielow](https://czypolskafirma.pl/firma/cmielow), [lubiana](https://czypolskafirma.pl/firma/lubiana) | wielkość liter | tak |
| „Kontoor Brands, Inc.” (1)<br>„Kontoor Brands Inc.” (1) | [lee](https://czypolskafirma.pl/firma/lee)<br>[wrangler](https://czypolskafirma.pl/firma/wrangler) | przecinek | tak |
| „Polscy wspólnicy (osoby fizyczne)” (2)<br>„Polscy wspólnicy, osoby fizyczne” (2) | [eldom](https://czypolskafirma.pl/firma/eldom), [zpc-milanowek](https://czypolskafirma.pl/firma/zpc-milanowek)<br>[radaway](https://czypolskafirma.pl/firma/radaway), [olewnik](https://czypolskafirma.pl/firma/olewnik) | nawias vs przecinek | **nie**: ogólnik, ujednolicenie połączyłoby 4 niepowiązane firmy |

Wniosek: zapis właścicieli jest w bazie bardzo spójny. Czysto kosmetycznych rozjazdów są tylko 3.
Główny problem to dopiski w nawiasach (1b) i ogólniki (1e).

### 1b. Ten sam podmiot, różnica tylko w dopisku w nawiasie (SQL, sekcja B, zakomentowane)

Kanoniczny w SQL = najczęstszy wariant (pierwszy w komórce). Dopisek bywa informacją (pośredni holding, „akcjonariat
rozproszony”), wtedy lepiej przenieść go do `ownership_description` niż trzymać dwa zapisy. W pliku SQL pominięto grupy
ogólników i „Skarb Państwa” (tam dopisek „przez PZU/PFR” niesie treść i wymaga decyzji redakcyjnej).

| Warianty (liczba profili) | Profile w wariancie mniejszościowym |
|---|---|
| „Akcjonariat rozproszony” (36)<br>„Akcjonariat rozproszony (spółka giełdowa, GPW)” (3)<br>„Akcjonariat rozproszony (największy blok: porozumienie założycieli)” (2)<br>„Akcjonariat rozproszony (największe pakiety: Venture FIZ i założyciele)” (1)<br>„Akcjonariat rozproszony (największe pakiety: założyciele)” (1)<br>„Akcjonariat rozproszony (założyciele i fundusze VC)” (1)<br>„Akcjonariat rozproszony (założyciele i inwestorzy)” (1)<br>„Akcjonariat rozproszony (centrala w Skawinie)” (1) | [multisport](https://czypolskafirma.pl/firma/multisport), [benefit-systems](https://czypolskafirma.pl/firma/benefit-systems), [zdrofit](https://czypolskafirma.pl/firma/zdrofit), [artifex-mundi](https://czypolskafirma.pl/firma/artifex-mundi), [unsolved](https://czypolskafirma.pl/firma/unsolved), [green-hell](https://czypolskafirma.pl/firma/green-hell) (+4) |
| „Skarb Państwa” (20)<br>„Skarb Państwa (przez PZU)” (2)<br>„Skarb Państwa (przez Polski Fundusz Rozwoju)” (1)<br>„Skarb Państwa (przez PFR)” (1)<br>„Skarb Państwa (NFOŚiGW)” (1)<br>„Skarb Państwa (PGL)” (1) | [armatura-krakow](https://czypolskafirma.pl/firma/armatura-krakow), [kfa-armatura](https://czypolskafirma.pl/firma/kfa-armatura), [pesa](https://czypolskafirma.pl/firma/pesa), [polskie-koleje-linowe](https://czypolskafirma.pl/firma/polskie-koleje-linowe), [izera](https://czypolskafirma.pl/firma/izera), [lot](https://czypolskafirma.pl/firma/lot) |
| „Akcjonariat giełdowy” (14)<br>„Akcjonariat giełdowy (fundusze inwestycyjne)” (1) | [bausch-health](https://czypolskafirma.pl/firma/bausch-health) |
| „Rodzina Mulliez” (12)<br>„Rodzina Mulliez (Association Familiale Mulliez)” (1)<br>„Rodzina Mulliez (ADEO)” (1) | [bricoman](https://czypolskafirma.pl/firma/bricoman), [leroy-merlin](https://czypolskafirma.pl/firma/leroy-merlin) |
| „Zygmunt Solorz (Fundacja TiVi / Reddev)” (9)<br>„Zygmunt Solorz” (1) | [plus-bank](https://czypolskafirma.pl/firma/plus-bank) |
| „Rodzina Lauder” (9)<br>„Rodzina Lauder (The Estée Lauder Companies)” (1) | [bumble-and-bumble](https://czypolskafirma.pl/firma/bumble-and-bumble) |
| „Danone S.A. (akcjonariat rozproszony)” (7)<br>„Danone S.A.” (1) | [nutricia](https://czypolskafirma.pl/firma/nutricia) |
| „Luis Amaral” (5)<br>„Luis Amaral (Grupa Eurocash)” (2) | [delikatesy-centrum](https://czypolskafirma.pl/firma/delikatesy-centrum), [lewiatan](https://czypolskafirma.pl/firma/lewiatan) |
| „Alphabet Inc. (kontrola: Larry Page i Sergey Brin)” (6)<br>„Alphabet Inc.” (1) | [google-cloud](https://czypolskafirma.pl/firma/google-cloud) |
| „Rodzina Persson” (5)<br>„Rodzina Persson (Ramsbury Invest)” (1) | [h-m](https://czypolskafirma.pl/firma/h-m) |
| „Polscy wspólnicy (osoby fizyczne)” (2)<br>„Polscy wspólnicy (CRBR)” (2)<br>„Polscy wspólnicy (rodzina założycieli)” (1) | [ingrid-cosmetics](https://czypolskafirma.pl/firma/ingrid-cosmetics), [vollare](https://czypolskafirma.pl/firma/vollare), [pol-skone](https://czypolskafirma.pl/firma/pol-skone) |
| „Rodzina Furmanów” (4)<br>„Rodzina Furmanów (Aflofarm)” (1) | [trec-nutrition](https://czypolskafirma.pl/firma/trec-nutrition) |
| „Rodzina Aleotti (Menarini)” (4)<br>„Rodzina Aleotti” (1) | [berlin-chemie-menarini](https://czypolskafirma.pl/firma/berlin-chemie-menarini) |
| „Spółdzielnia (rolnicy)” (4)<br>„Spółdzielnia (członkowie)” (1) | [skok-kasa-stefczyka](https://czypolskafirma.pl/firma/skok-kasa-stefczyka) |
| „Sandro Veronesi (Oniverse)” (2)<br>„Sandro Veronesi” (2) | [tezenis](https://czypolskafirma.pl/firma/tezenis), [falconeri](https://czypolskafirma.pl/firma/falconeri) |
| „Polscy akcjonariusze prywatni” (3)<br>„Polscy akcjonariusze prywatni (CRBR)” (1) | [polana](https://czypolskafirma.pl/firma/polana) |
| „Rodzina Quandt (Stefan Quandt, Susanne Klatten)” (3)<br>„Rodzina Quandt” (1) | [bmw](https://czypolskafirma.pl/firma/bmw) |
| „Rodzina af Jochnick” (2)<br>„Rodzina af Jochnick (Celox Holding AB)” (1)<br>„Rodzina af Jochnick (Celox Holding)” (1) | [synevo](https://czypolskafirma.pl/firma/synevo), [centrum-medyczne-damiana](https://czypolskafirma.pl/firma/centrum-medyczne-damiana) |
| „Avallon MBO” (3)<br>„Avallon MBO (fundusz PE)” (1) | [clovin](https://czypolskafirma.pl/firma/clovin) |
| „Jan Kolański (Colian)” (3)<br>„Jan Kolański” (1) | [colian](https://czypolskafirma.pl/firma/colian) |
| „MCI Capital (Tomasz Czechowicz)” (2)<br>„MCI Capital” (2) | [esky](https://czypolskafirma.pl/firma/esky), [nice-to-fit-you](https://czypolskafirma.pl/firma/nice-to-fit-you) |
| „Lars Wingefors (Embracer Group)” (3)<br>„Lars Wingefors” (1) | [rebel](https://czypolskafirma.pl/firma/rebel) |
| „Pfeifer & Langen (grupa rodzinna)” (2)<br>„Pfeifer & Langen (rodziny właścicielskie z Kolonii)” (1)<br>„Pfeifer & Langen” (1) | [diamant](https://czypolskafirma.pl/firma/diamant), [przysnacki](https://czypolskafirma.pl/firma/przysnacki) |
| „Trzech polskich wspólników (osoby fizyczne)” (2)<br>„Trzech polskich wspólników (firma rodzinna)” (1) | [woseba](https://czypolskafirma.pl/firma/woseba) |
| „Polscy wspólnicy prywatni” (2)<br>„Polscy wspólnicy prywatni (osoby fizyczne)” (1) | [vobro](https://czypolskafirma.pl/firma/vobro) |
| „Rodzina Reimann (JAB)” (2)<br>„Rodzina Reimann (JAB Holding)” (1) | [coty](https://czypolskafirma.pl/firma/coty) |
| „Fundacja Rodzinna Irena Eris (rodzina Eris-Orfinger)” (2)<br>„Fundacja Rodzinna Irena Eris” (1) | [dr-irena-eris](https://czypolskafirma.pl/firma/dr-irena-eris) |
| „Toyota Motor Corporation” (2)<br>„Toyota Motor Corporation (rozproszony akcjonariat)” (1) | [toyota](https://czypolskafirma.pl/firma/toyota) |
| „ZMB Capital (Michał Bożek)” (1)<br>„ZMB Capital (Ustronianka)” (1) | [kofola-hoop-cola](https://czypolskafirma.pl/firma/kofola-hoop-cola) |
| „Restaurant Brands International (akcjonariat rozproszony)” (1)<br>„Restaurant Brands International” (1) | [burger-king](https://czypolskafirma.pl/firma/burger-king) |
| „Rodzina Komorowskich (BZK Group)” (1)<br>„Rodzina Komorowskich (Grupa BZK)” (1) | [polskie-mlyny](https://czypolskafirma.pl/firma/polskie-mlyny) |
| „Lars Larsen Group (Actona Group)” (1)<br>„Lars Larsen Group” (1) | [jysk](https://czypolskafirma.pl/firma/jysk) |
| „Rodzina Szynaka (Szynaka-Meble, właściciel Wolsztyńskiej Fabryki Mebli)” (1)<br>„Rodzina Szynaka” (1) | [szynaka-meble](https://czypolskafirma.pl/firma/szynaka-meble) |
| „Allegro (akcjonariat rozproszony)” (1)<br>„Allegro” (1) | [ebilet-pl](https://czypolskafirma.pl/firma/ebilet-pl) |
| „Osoba prywatna z Polski (95% udziałów)” (1)<br>„Osoba prywatna z Polski” (1) | [termy-chocholowskie](https://czypolskafirma.pl/firma/termy-chocholowskie) |
| „Amazon.com, Inc. (akcjonariat rozproszony)” (1)<br>„Amazon.com, Inc.” (1) | [amazon-web-services](https://czypolskafirma.pl/firma/amazon-web-services) |
| „Rodzina Herz (Maxingvest / Beiersdorf)” (1)<br>„Rodzina Herz (maxingvest AG)” (1) | [tchibo](https://czypolskafirma.pl/firma/tchibo) |
| „Polska osoba fizyczna (wspólnik większościowy)” (1)<br>„Polska osoba fizyczna (jedyny wspólnik)” (1) | [ovovita](https://czypolskafirma.pl/firma/ovovita) |
| „Ringier Axel Springer (Axel Springer SE i Ringier AG)” (1)<br>„Ringier Axel Springer” (1) | [fakt](https://czypolskafirma.pl/firma/fakt) |
| „Groupe LDC (Drosed Holding)” (1)<br>„Groupe LDC” (1) | [drosed](https://czypolskafirma.pl/firma/drosed) |
| „Ewa Szmidt-Belcarz (Grupa Empik)” (1)<br>„Ewa Szmidt-Belcarz” (1) | [empik](https://czypolskafirma.pl/firma/empik) |
| „Rodzina Chung (Hyundai Motor Group)” (1)<br>„Rodzina Chung” (1) | [hyundai](https://czypolskafirma.pl/firma/hyundai) |
| „Tata Motors (rodzina Tata)” (1)<br>„Tata Motors” (1) | [jaguar](https://czypolskafirma.pl/firma/jaguar) |
| „Krzysztof Tokarz (GK Specjał)” (1)<br>„Krzysztof Tokarz” (1) | [nasz-sklep](https://czypolskafirma.pl/firma/nasz-sklep) |
| „Sebastian Kulczyk (Kulczyk Investments)” (1)<br>„Sebastian Kulczyk” (1) | [ciech-qemetica](https://czypolskafirma.pl/firma/ciech-qemetica) |

### 1c. Do przeglądu: z formą prawną i bez, Group/Grupa, holding vs spółka

Tu łączenie nie jest oczywiste. Np. „Agora-Holding sp. z o.o.” to inny podmiot niż „Agora S.A.”, a „Grupa Hisense”,
„Hisense” i „Hisense Co., Ltd.” to raczej jeden.

| Warianty (liczba profili) | Profile |
|---|---|
| „Agora S.A.” (3)<br>„Agora-Holding sp. z o.o.” (2)<br>„Agora-Holding” (1)<br>„Agora SA” (1) | [tok-fm](https://czypolskafirma.pl/firma/tok-fm), [gazeta-wyborcza](https://czypolskafirma.pl/firma/gazeta-wyborcza), [helios](https://czypolskafirma.pl/firma/helios), [radio-zlote-przeboje](https://czypolskafirma.pl/firma/radio-zlote-przeboje), [chillizet](https://czypolskafirma.pl/firma/chillizet), [wyborcza-pl](https://czypolskafirma.pl/firma/wyborcza-pl) (+1) |
| „Polscy wspólnicy (osoby fizyczne)” (2)<br>„Polscy wspólnicy, osoby fizyczne” (2) | [eldom](https://czypolskafirma.pl/firma/eldom), [zpc-milanowek](https://czypolskafirma.pl/firma/zpc-milanowek), [radaway](https://czypolskafirma.pl/firma/radaway), [olewnik](https://czypolskafirma.pl/firma/olewnik) |
| „PPG Industries” (3)<br>„PPG Industries, Inc.” (1) | [progold](https://czypolskafirma.pl/firma/progold), [bondex](https://czypolskafirma.pl/firma/bondex), [drewnochron](https://czypolskafirma.pl/firma/drewnochron), [tikkurila](https://czypolskafirma.pl/firma/tikkurila) |
| „Bielenda Group (Innova Capital)” (2)<br>„Bielenda Group SA / Innova Capital” (1) | [soraya](https://czypolskafirma.pl/firma/soraya), [dermika](https://czypolskafirma.pl/firma/dermika), [kanani-europe](https://czypolskafirma.pl/firma/kanani-europe) |
| „Hisense Co., Ltd.” (1)<br>„Grupa Hisense” (1)<br>„Hisense” (1) | [hisense](https://czypolskafirma.pl/firma/hisense), [asko](https://czypolskafirma.pl/firma/asko), [gorenje](https://czypolskafirma.pl/firma/gorenje) |
| „Danone S.A.” (1)<br>„Danone” (1) | [nutricia](https://czypolskafirma.pl/firma/nutricia), [zywiec-zdroj](https://czypolskafirma.pl/firma/zywiec-zdroj) |
| „3i Group plc” (1)<br>„3i Group” (1) | [boconcept](https://czypolskafirma.pl/firma/boconcept), [action](https://czypolskafirma.pl/firma/action) |
| „DXC Technology Company” (1)<br>„DXC Technology” (1) | [dxc-technology](https://czypolskafirma.pl/firma/dxc-technology), [luxoft](https://czypolskafirma.pl/firma/luxoft) |
| „Grupa Theo Müller” (1)<br>„Theo Müller” (1) | [graal](https://czypolskafirma.pl/firma/graal), [muller](https://czypolskafirma.pl/firma/muller) |
| „Tengelmann Group (rodzina Haub)” (1)<br>„Tengelmann (rodzina Haub)” (1) | [obi](https://czypolskafirma.pl/firma/obi), [kik](https://czypolskafirma.pl/firma/kik) |
| „Ringier AG / Axel Springer SE” (1)<br>„Ringier Axel Springer” (1) | [onet](https://czypolskafirma.pl/firma/onet), [fakt](https://czypolskafirma.pl/firma/fakt) |

### 1d. Literówki (SQL, sekcja A2)

| Wariant błędny | Poprawny | Profile |
|---|---|---|
| „Akconariat rozproszony” | „Akcjonariat rozproszony” (36 profili) | [adidas](https://czypolskafirma.pl/firma/adidas), [nike](https://czypolskafirma.pl/firma/nike), [ibm](https://czypolskafirma.pl/firma/ibm), [michelin](https://czypolskafirma.pl/firma/michelin) |

Drugie trafienie („Skarb Państwa RP” vs „Skarb Państwa RS” przy [krka](https://czypolskafirma.pl/firma/krka)) to nie literówka:
RS = Republika Słowenii. Warto jednak zapisać to jednoznacznie („Republika Słowenii”), bo „Skarb Państwa RS” łatwo pomylić z polskim.

### 1e. Właściciele „ogólni”, których nie łapie `OGOLNI_WLASCICIELE`

`OGOLNI_WLASCICIELE` (w `page.tsx`) wyłącza sekcję dla zapisów zaczynających się od „brak”, „akcjonariat”, „osoby fizyczne” itd.
Poniższe zapisy przechodzą przez filtr. Kolumna „Różnych spółek” > 1 oznacza, że po wdrożeniu sekcja połączy niepowiązane firmy.
Wiersze z 1 spółką są nieszkodliwe (to marki tej samej spółki), ale i tak lepiej, żeby dopasowanie nie opierało się na ogólniku.

| owner_name | Profili | Różnych spółek | Przykłady |
|---|---|---|---|
| „Polscy właściciele” | 22 | 22 | [bell](https://czypolskafirma.pl/firma/bell), [ceramika-paradyz](https://czypolskafirma.pl/firma/ceramika-paradyz), [dre](https://czypolskafirma.pl/firma/dre), [marion](https://czypolskafirma.pl/firma/marion), [tubadzin](https://czypolskafirma.pl/firma/tubadzin) (+17) |
| „Polscy założyciele” | 8 | 8 | [autopay](https://czypolskafirma.pl/firma/autopay), [boldare](https://czypolskafirma.pl/firma/boldare), [cda-pl](https://czypolskafirma.pl/firma/cda-pl), [erli](https://czypolskafirma.pl/firma/erli), [euvic](https://czypolskafirma.pl/firma/euvic) (+3) |
| „Akconariat rozproszony” | 4 | 4 | [adidas](https://czypolskafirma.pl/firma/adidas), [nike](https://czypolskafirma.pl/firma/nike), [ibm](https://czypolskafirma.pl/firma/ibm), [michelin](https://czypolskafirma.pl/firma/michelin) |
| „Polscy wspólnicy (osoby fizyczne)” | 2 | 2 | [eldom](https://czypolskafirma.pl/firma/eldom), [zpc-milanowek](https://czypolskafirma.pl/firma/zpc-milanowek) |
| „Polscy wspólnicy prywatni” | 2 | 2 | [chorten](https://czypolskafirma.pl/firma/chorten), [koleo](https://czypolskafirma.pl/firma/koleo) |
| „Polscy wspólnicy, osoby fizyczne” | 2 | 2 | [radaway](https://czypolskafirma.pl/firma/radaway), [olewnik](https://czypolskafirma.pl/firma/olewnik) |
| „Prywatny wspólnik większościowy (osoba fizyczna)” | 2 | 2 | [drogerie-polskie](https://czypolskafirma.pl/firma/drogerie-polskie), [organique](https://czypolskafirma.pl/firma/organique) |
| „Założyciele Wirtualnej Polski (Świderski, Brański, Sierota)” | 2 | 2 | [pudelek](https://czypolskafirma.pl/firma/pudelek), [travelplanet-pl](https://czypolskafirma.pl/firma/travelplanet-pl) |
| „Założyciele Maspeksu i ich rodziny” | 7 | 1 | [kubus](https://czypolskafirma.pl/firma/kubus), [cremona](https://czypolskafirma.pl/firma/cremona), [decomorreno](https://czypolskafirma.pl/firma/decomorreno), [lowicz](https://czypolskafirma.pl/firma/lowicz), [tymbark](https://czypolskafirma.pl/firma/tymbark) (+2) |
| „Polski właściciel prywatny (osoba fizyczna)” | 4 | 1 | [bopon](https://czypolskafirma.pl/firma/bopon), [bros](https://czypolskafirma.pl/firma/bros), [microbec](https://czypolskafirma.pl/firma/microbec), [happs](https://czypolskafirma.pl/firma/happs) |
| „Polscy akcjonariusze prywatni” | 3 | 1 | [black-boss](https://czypolskafirma.pl/firma/black-boss), [browar-witnica](https://czypolskafirma.pl/firma/browar-witnica), [boss-beer](https://czypolskafirma.pl/firma/boss-beer) |
| „Trzech polskich wspólników (osoby fizyczne)” | 2 | 1 | [kormoran](https://czypolskafirma.pl/firma/kormoran), [imperium-prunum](https://czypolskafirma.pl/firma/imperium-prunum) |
| „Polscy beneficjenci rzeczywiści (CRBR)” | 2 | 1 | [coalition](https://czypolskafirma.pl/firma/coalition), [diverse-extreme-team](https://czypolskafirma.pl/firma/diverse-extreme-team) |
| „Prywatni właściciele z Polski (2 beneficjentów wg CRBR)” | 2 | 1 | [vittorio-bellucci](https://czypolskafirma.pl/firma/vittorio-bellucci), [revia](https://czypolskafirma.pl/firma/revia) |
| „Polscy wspólnicy (CRBR)” | 2 | 1 | [ingrid-cosmetics](https://czypolskafirma.pl/firma/ingrid-cosmetics), [vollare](https://czypolskafirma.pl/firma/vollare) |
| „Polski beneficjent rzeczywisty (CRBR)” | 2 | 1 | [rafi](https://czypolskafirma.pl/firma/rafi), [piper](https://czypolskafirma.pl/firma/piper) |
| „Polscy inwestorzy prywatni” | 2 | 1 | [cisowianka-naleczow-zdroj](https://czypolskafirma.pl/firma/cisowianka-naleczow-zdroj), [cisowianka](https://czypolskafirma.pl/firma/cisowianka) |

### 1f. „Rodzina X” wspólna dla kilku różnych spółek

Większość to faktycznie ta sama rodzina w różnych spółkach grupy (Mulliez: Auchan i Decathlon, Porsche-Piëch: VW, Seat,
Audi, Škoda). Do sprawdzenia: **„Rodzina Kaczorowski”** ([benix](https://czypolskafirma.pl/firma/benix) i
[wersal](https://czypolskafirma.pl/firma/wersal)): dwie fabryki mebli w powiecie kępińskim, różne NIP-y i różni wspólnicy
(Bernard i Damian vs Zbigniew i Łukasz). Jeśli to osobne gałęzie rodziny, sekcja „ten sam właściciel” będzie myląca.

| owner_name | Profile | Spółek |
|---|---|---|
| „Rodzina Mulliez” | [auchan](https://czypolskafirma.pl/firma/auchan), [btwin](https://czypolskafirma.pl/firma/btwin), [kalenji](https://czypolskafirma.pl/firma/kalenji), [quechua](https://czypolskafirma.pl/firma/quechua), [tribord](https://czypolskafirma.pl/firma/tribord), [decathlon](https://czypolskafirma.pl/firma/decathlon) (+6) | 2 |
| „Rodzina Porsche-Piëch (Volkswagen AG)” | [seat](https://czypolskafirma.pl/firma/seat), [lamborghini](https://czypolskafirma.pl/firma/lamborghini), [audi](https://czypolskafirma.pl/firma/audi), [skoda](https://czypolskafirma.pl/firma/skoda) | 3 |
| „Rodzina Bahlsen” | [bahlsen](https://czypolskafirma.pl/firma/bahlsen), [leibniz](https://czypolskafirma.pl/firma/leibniz), [pick-up](https://czypolskafirma.pl/firma/pick-up), [lorenz](https://czypolskafirma.pl/firma/lorenz) | 2 |
| „Rodzina Balcerkiewicz” | [balma](https://czypolskafirma.pl/firma/balma), [noti](https://czypolskafirma.pl/firma/noti) | 2 |
| „Rodzina Kaczorowski” | [benix](https://czypolskafirma.pl/firma/benix), [wersal](https://czypolskafirma.pl/firma/wersal) | 2 |
| „Rodzina Gołębiewskich” | [hotele-golebiewski](https://czypolskafirma.pl/firma/hotele-golebiewski), [tago](https://czypolskafirma.pl/firma/tago) | 2 |
| „Rodzina af Jochnick” | [medicover](https://czypolskafirma.pl/firma/medicover), [oriflame](https://czypolskafirma.pl/firma/oriflame) | 2 |
| „Rodzina Kwiecień (Grupa Wistil)” | [cmielow](https://czypolskafirma.pl/firma/cmielow), [lubiana](https://czypolskafirma.pl/firma/lubiana) | 2 |
| „Rodzina Sarantis” | [sarantis](https://czypolskafirma.pl/firma/sarantis), [stella-pack](https://czypolskafirma.pl/firma/stella-pack) | 2 |

## 2. Nazwa spółki zapisana różnie (`name` / `legalName`)

Sekcja „inne marki tej spółki” dopasowuje po równości `name`, a `getCompanyFamily` **pomija** nazwy zawierające `"`
(ochrona składni filtra PostgREST). Stąd dwa skutki: warianty `'X'` / `"X"` / `X` rozbijają jedną spółkę na kilka, a
nazwy z `"` w ogóle nie dostają tej sekcji. Większość bazy ma już zapis z apostrofami (`'DANONE' SPÓŁKA ...`).

### 2a. Warianty zapisu jednej spółki (wszystkie potwierdzone tym samym NIP-em)

| Warianty (liczba profili) | Profile |
|---|---|
| „'DANONE' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (7)<br>„DANONE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [actimel](https://czypolskafirma.pl/firma/actimel), [alpro](https://czypolskafirma.pl/firma/alpro), [activia](https://czypolskafirma.pl/firma/activia), [volvic](https://czypolskafirma.pl/firma/volvic), [danonki](https://czypolskafirma.pl/firma/danonki), [evian](https://czypolskafirma.pl/firma/evian) (+2) |
| „'DAX COSMETICS' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (5)<br>„"DAX COSMETICS" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [celia](https://czypolskafirma.pl/firma/celia), [cashmere](https://czypolskafirma.pl/firma/cashmere), [perfecta](https://czypolskafirma.pl/firma/perfecta), [yoskine](https://czypolskafirma.pl/firma/yoskine), [hada-labo-tokyo](https://czypolskafirma.pl/firma/hada-labo-tokyo), [dax-cosmetics](https://czypolskafirma.pl/firma/dax-cosmetics) |
| „'PRZEDSIĘBIORSTWO PRODUKCJI FARMACEUTYCZNEJ HASCO - LEK' SPÓŁKA AKCYJNA” (5)<br>„"PRZEDSIĘBIORSTWO PRODUKCJI FARMACEUTYCZNEJ HASCO - LEK" SPÓŁKA AKCYJNA” (1) | [hascovir](https://czypolskafirma.pl/firma/hascovir), [mensil](https://czypolskafirma.pl/firma/mensil), [juvit](https://czypolskafirma.pl/firma/juvit), [ulgix](https://czypolskafirma.pl/firma/ulgix), [ibum](https://czypolskafirma.pl/firma/ibum), [hasco-lek](https://czypolskafirma.pl/firma/hasco-lek) |
| „'USTRONIANKA' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (3)<br>„"USTRONIANKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (2) | [arctic](https://czypolskafirma.pl/firma/arctic), [paola](https://czypolskafirma.pl/firma/paola), [hoop-cola](https://czypolskafirma.pl/firma/hoop-cola), [kofola-hoop-cola](https://czypolskafirma.pl/firma/kofola-hoop-cola), [ustronianka](https://czypolskafirma.pl/firma/ustronianka) |
| „CALZ POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (2)<br>„'CALZ POLSKA' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (2) | [intimissimi](https://czypolskafirma.pl/firma/intimissimi), [calzedonia](https://czypolskafirma.pl/firma/calzedonia), [tezenis](https://czypolskafirma.pl/firma/tezenis), [falconeri](https://czypolskafirma.pl/firma/falconeri) |
| „DEICHMANN-OBUWIE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (3)<br>„"DEICHMANN-OBUWIE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ"” (1) | [graceland](https://czypolskafirma.pl/firma/graceland), [venice](https://czypolskafirma.pl/firma/venice), [vty](https://czypolskafirma.pl/firma/vty), [deichmann](https://czypolskafirma.pl/firma/deichmann) |
| „'ELECTROLUX POLAND' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (2)<br>„"ELECTROLUX POLAND" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [zanussi](https://czypolskafirma.pl/firma/zanussi), [aeg](https://czypolskafirma.pl/firma/aeg), [electrolux](https://czypolskafirma.pl/firma/electrolux) |
| „'ETOS' SPÓŁKA AKCYJNA” (2)<br>„"ETOS" SPÓŁKA AKCYJNA” (1) | [coalition](https://czypolskafirma.pl/firma/coalition), [diverse-extreme-team](https://czypolskafirma.pl/firma/diverse-extreme-team), [diverse](https://czypolskafirma.pl/firma/diverse) |
| „EUROCASH SPÓŁKA AKCYJNA” (2)<br>„"EUROCASH" SPÓŁKA AKCYJNA” (1) | [groszek](https://czypolskafirma.pl/firma/groszek), [abc](https://czypolskafirma.pl/firma/abc), [eurocash](https://czypolskafirma.pl/firma/eurocash) |
| „HOCHLAND POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (2)<br>„"HOCHLAND POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [valbon](https://czypolskafirma.pl/firma/valbon), [almette](https://czypolskafirma.pl/firma/almette), [hochland](https://czypolskafirma.pl/firma/hochland) |
| „'ASUS POLSKA' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1)<br>„"ASUS POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [asus-rog](https://czypolskafirma.pl/firma/asus-rog), [asus](https://czypolskafirma.pl/firma/asus) |
| „HARIBO SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1)<br>„'HARIBO' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [haribo](https://czypolskafirma.pl/firma/haribo), [maoam](https://czypolskafirma.pl/firma/maoam) |
| „'ITM POLSKA' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1)<br>„"ITM POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [intermarche](https://czypolskafirma.pl/firma/intermarche), [bricomarche](https://czypolskafirma.pl/firma/bricomarche) |
| „DAWTONA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1)<br>„"DAWTONA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [dawtona](https://czypolskafirma.pl/firma/dawtona), [drugie-sniadanie](https://czypolskafirma.pl/firma/drugie-sniadanie) |
| „DELIA COSMETICS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1)<br>„"DELIA COSMETICS" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [cameleo](https://czypolskafirma.pl/firma/cameleo), [delia-cosmetics](https://czypolskafirma.pl/firma/delia-cosmetics) |
| „HYUNDAI MOTOR POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1)<br>„"HYUNDAI MOTOR POLAND" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” (1) | [hyundai](https://czypolskafirma.pl/firma/hyundai), [genesis](https://czypolskafirma.pl/firma/genesis) |
| „Bridgestone Europe NV/SA Spółka Akcyjna Oddział w Polsce” (1)<br>„BRIDGESTONE EUROPE NV/SA SPÓŁKA AKCYJNA ODDZIAŁ W POLSCE” (1) | [firestone](https://czypolskafirma.pl/firma/firestone), [bridgestone](https://czypolskafirma.pl/firma/bridgestone) |
| „ZAKŁADY FARMACEUTYCZNE POLPHARMA SPÓŁKA AKCYJNA” (1)<br>„ZAKŁADY FARMACEUTYCZNE "POLPHARMA" SPÓŁKA AKCYJNA” (1) | [acidolac](https://czypolskafirma.pl/firma/acidolac), [polpharma](https://czypolskafirma.pl/firma/polpharma) |

Dodatkowo „TOYA SPÓŁKA AKCYJNA” ([yato](https://czypolskafirma.pl/firma/yato)) vs „"TOYA"-SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ”
([toya](https://czypolskafirma.pl/firma/toya)): różna forma prawna, sprawdzić w KRS, która jest aktualna.

### 2b. Ten sam NIP, nazwa pusta albo inna spółka

| NIP | Profil bez nazwy | Nazwa na pozostałych profilach |
|---|---|---|
| 7822463563 | [seat](https://czypolskafirma.pl/firma/seat) | VOLKSWAGEN GROUP POLSKA SP. Z O.O. ([audi](https://czypolskafirma.pl/firma/audi), [skoda](https://czypolskafirma.pl/firma/skoda), [volkswagen](https://czypolskafirma.pl/firma/volkswagen)) |
| 9720865431 | [bp](https://czypolskafirma.pl/firma/bp) | BP EUROPA SE EUROPAISCHE AKTIENGESELLSCHAFT ([wild-bean-cafe](https://czypolskafirma.pl/firma/wild-bean-cafe)) |

Pozostałe profile bez nazwy spółki: [kakadu](https://czypolskafirma.pl/firma/kakadu) i [zywiec-zdroj](https://czypolskafirma.pl/firma/zywiec-zdroj)
(tu dodatkowo NIP = „Zgodny”).

### 2c. Podobne nazwy różnych spółek (sprawdzone, to nie warianty)

HELIO vs HELIOS, MABION vs MARION, PAYPO vs PAYPRO, STOCK POLSKA vs STORCK, WELLA POLAND vs XELLA POLSKA: różne podmioty,
bez działania. Przy okazji: „"MARION"  SPÓŁKA ...” ma podwójną spację.

### 2d. Podwójne spacje w `name` (8)

[compensa](https://czypolskafirma.pl/firma/compensa), [marion](https://czypolskafirma.pl/firma/marion), [sniezka](https://czypolskafirma.pl/firma/sniezka),
[indigo-nails](https://czypolskafirma.pl/firma/indigo-nails), [rossmann](https://czypolskafirma.pl/firma/rossmann),
[opel](https://czypolskafirma.pl/firma/opel), [peugeot](https://czypolskafirma.pl/firma/peugeot), [citroen](https://czypolskafirma.pl/firma/citroen).
`trim()` w kodzie ich nie usuwa (spacje są w środku). Stellantis jest spójny między sobą, ale jeśli inna marka Stellantisa
ma nazwę bez podwójnej spacji, rozjadą się.

## 3. Niespójności werdyktu (tylko podejrzenia)

Heurystyki tekstowe celowo pomijają przypadki zgodne z metodologią: holding polskiego założyciela na Cyprze,
w Luksemburgu czy Holandii (Zasada Ostatecznego Właściciela), pakiety mniejszościowe, zdania historyczne („kupiła od
czeskiej grupy”), przymiotnik przy marce, a nie właścicielu („duńska marka Gram należy do Amica S.A.”). Po tych
wyłączeniach zostaje mało trafień tekstowych, a najmocniejsze sygnały daje kontrola krzyżowa po NIP.

### 3a. Ten sam NIP (ta sama polska spółka), różny `country_code`

Część to normalny przypadek licencji/dystrybucji (Coty dystrybuuje Gucci i Burberry, CCC sprzedaje Reebok, Burda wydaje
ELLE i Glamour na licencji), ale część wskazuje na błędny NIP albo nieaktualny werdykt.

| NIP | Profile (`country_code`, `owner_name`) | Ocena wstępna |
|---|---|---|
| 8951760602 | [dekoral](https://czypolskafirma.pl/firma/dekoral) **PL** (Polscy właściciele), [beckers](https://czypolskafirma.pl/firma/beckers) SE, [progold](https://czypolskafirma.pl/firma/progold), [tikkurila](https://czypolskafirma.pl/firma/tikkurila), [bondex](https://czypolskafirma.pl/firma/bondex), [drewnochron](https://czypolskafirma.pl/firma/drewnochron) US | **pilne**: dekoral i beckers z NIP i nazwą PPG DECO POLSKA |
| 5271037727 | [fakt](https://czypolskafirma.pl/firma/fakt), [ringier-axel-springer-polska](https://czypolskafirma.pl/firma/ringier-axel-springer-polska) CH; [plus](https://czypolskafirma.pl/firma/plus), [plush](https://czypolskafirma.pl/firma/plush), [aero2](https://czypolskafirma.pl/firma/aero2), [wrodzinie](https://czypolskafirma.pl/firma/wrodzinie) PL | **pilne**: profile RASP mają nazwę i NIP Polkomtela |
| 8960005673 | [erste-bank](https://czypolskafirma.pl/firma/erste-bank) AT, [santander-bank-polska](https://czypolskafirma.pl/firma/santander-bank-polska) ES | profil Santandera prawdopodobnie nieaktualny po przejęciu przez Erste |
| 1080027271 | [hugo-boss](https://czypolskafirma.pl/firma/hugo-boss) DE, [boss](https://czypolskafirma.pl/firma/boss) GB, [hugo](https://czypolskafirma.pl/firma/hugo) GB | ta sama spółka, dwa różne werdykty |
| 8971411483 | [burda-media](https://czypolskafirma.pl/firma/burda-media), [viva](https://czypolskafirma.pl/firma/viva), [wizaz-pl](https://czypolskafirma.pl/firma/wizaz-pl) DE; [elle](https://czypolskafirma.pl/firma/elle) FR; [glamour](https://czypolskafirma.pl/firma/glamour) US | licencja, zgodne z opisem; do świadomej decyzji, czy werdykt idzie za licencjodawcą |
| 5242787101 | [coty](https://czypolskafirma.pl/firma/coty) i marki JAB DE; [gucci](https://czypolskafirma.pl/firma/gucci) FR; [burberry](https://czypolskafirma.pl/firma/burberry) GB; [davidoff](https://czypolskafirma.pl/firma/davidoff) CH | licencja zapachów, j.w. |
| 6922200609 | marki CCC PL; [reebok](https://czypolskafirma.pl/firma/reebok) US | CCC jako dystrybutor, j.w. |
| 5262100142 | [relay](https://czypolskafirma.pl/firma/relay) FR, [costa-coffee](https://czypolskafirma.pl/firma/costa-coffee) US | franczyza Costa w Lagardère, j.w. |

### 3b. Ten sam właściciel, różny `country_code`

„CVC Capital Partners”: [comarch](https://czypolskafirma.pl/firma/comarch) **LU**, a [douglas](https://czypolskafirma.pl/firma/douglas),
[stock-polska](https://czypolskafirma.pl/firma/stock-polska), [maczfit](https://czypolskafirma.pl/firma/maczfit), [saga](https://czypolskafirma.pl/firma/saga),
[recordati](https://czypolskafirma.pl/firma/recordati), [zabka](https://czypolskafirma.pl/firma/zabka) **GB**. LU to dodatkowo jurysdykcja
holdingowa, którą metodologia każe pomijać.

### 3c. Podejrzenia z tekstu

| Profil | `country_code` | Sygnał |
|---|---|---|
| [comarch](https://czypolskafirma.pl/firma/comarch) | LU | kraj = jurysdykcja holdingowa (patrz 3b) |
| [lajt-mobile](https://czypolskafirma.pl/firma/lajt-mobile) | PL | `owner_name` „Jacek Lichota / Cathetel Limited”: sprawdzić, czy Cathetel to wehikuł polskiego właściciela (wtedy OK, ale lepiej sama osoba w `owner_name`) |

Sprawdzone ręcznie i odrzucone jako fałszywe alarmy (zgodne z metodologią): spółki Dworczaka i Przybyły (Forsmart Limited, Cypr),
Esotiq i Henderson (Patronado Limited), Inter Cars (OK Automotive Investments B.V.), Qemetica (KI Chemistry S.à r.l.),
Tytan (Syrius Investments S.à r.l.), Enter Air, 5.10.15, CDA i Gram (zagraniczne marki Amiki).

### 3d. `ownership_type` spoza słownika

Słownik: `osoba/rodzina`, `korporacja_gieldowa`, `korporacja_prywatna`, `rozproszony`, `fundusz_pe_vc`, `fundacja`,
`spoldzielnia`, `skarb_panstwa`, `inny`.

| Profil | Wartość |
|---|---|
| [atlas-ward](https://czypolskafirma.pl/firma/atlas-ward) | Własność prywatna |
| [aldesa](https://czypolskafirma.pl/firma/aldesa) | Spółka zależna |
| [elektrotim](https://czypolskafirma.pl/firma/elektrotim) | Spółka publiczna |
| [hochtief](https://czypolskafirma.pl/firma/hochtief) | Spółka zależna |
| [mirbud](https://czypolskafirma.pl/firma/mirbud) | Spółka publiczna (Kontrola założycielska) |
| [pekabex](https://czypolskafirma.pl/firma/pekabex) | Spółka publiczna |
| [torpol](https://czypolskafirma.pl/firma/torpol) | Kontrola Państwowa |

Poza tym 741 profili ma `ownership_type` puste. Automat `--najstarsze` dobiera typy własności, więc uzupełni je przy reweryfikacji.

## 4. Braki

### Logo i strona www

- **Bez www, więc od razu litera:** [ciechan](https://czypolskafirma.pl/firma/ciechan), [lwowek](https://czypolskafirma.pl/firma/lwowek).
  [ingrid](https://czypolskafirma.pl/firma/ingrid) też nie ma www, ale logo bierze z domeny marki (ingridcosmetics.com).
- **Brak pliku w `/logos` (wyświetla się Brandfetch albo litera):**

| Profil | `website_url` |
|---|---|
| [progold](https://czypolskafirma.pl/firma/progold) | https://www.progold.eu/pl-PL |
| [bondex](https://czypolskafirma.pl/firma/bondex) | https://www.ppg.com/#bondex |
| [drewnochron](https://czypolskafirma.pl/firma/drewnochron) | https://www.drewnochron.pl |
| [you-can-drive](https://czypolskafirma.pl/firma/you-can-drive) | https://www.youcandrive.pl |
| [mtu](https://czypolskafirma.pl/firma/mtu) | https://www.mtu.pl |
| [pixar](https://czypolskafirma.pl/firma/pixar) | https://www.pixar.com |
| [national-geographic](https://czypolskafirma.pl/firma/national-geographic) | https://www.nationalgeographic.com |
| [star-wars](https://czypolskafirma.pl/firma/star-wars) | https://www.starwars.com |
| [marvel](https://czypolskafirma.pl/firma/marvel) | https://www.marvel.com |
| [znanylekarz](https://czypolskafirma.pl/firma/znanylekarz) | https://www.znanylekarz.pl |

Wspólny wzorzec: marki Disneya (Pixar, Marvel, Star Wars, National Geographic) i PPG. Do uzupełnienia przez Logo Fixer
(`docs/SOP_logotypy.md`).

### Opisy

- Bez opisu działalności: 0. Bez opisu własności: 0.
- Krótki opis działalności (<80 znaków): [rmf-fm](https://czypolskafirma.pl/firma/rmf-fm) (78), [pz-cussons-luksja](https://czypolskafirma.pl/firma/pz-cussons-luksja) (74).
- Krótki opis własności (<100 znaków): 126 profili. Typowy wzorzec to jedno zdanie bez nazwy właściciela
  („Należy w 100% do polskich właścicieli.”), czyli najczęściej te same profile co ogólniki z 1e. 25 najkrótszych:

| Profil | Znaków | Tekst |
|---|---|---|
| [cinema-city](https://czypolskafirma.pl/firma/cinema-city) | 45 | Należy w 100% do brytyjskiej grupy Cineworld. |
| [biofarm](https://czypolskafirma.pl/firma/biofarm) | 50 | Firma rodzinna Waldemara i Grażyny Szwarczyńskich. |
| [lexus](https://czypolskafirma.pl/firma/lexus) | 52 | Japońska marka należąca do Toyota Motor Corporation. |
| [modecom](https://czypolskafirma.pl/firma/modecom) | 53 | Przedsiębiorstwo ze 100% polskim kapitałem prywatnym. |
| [multikino](https://czypolskafirma.pl/firma/multikino) | 53 | W 100% należy do brytyjskiej grupy Vue International. |
| [platinet](https://czypolskafirma.pl/firma/platinet) | 53 | Przedsiębiorstwo ze 100% polskim kapitałem prywatnym. |
| [polskie-radio](https://czypolskafirma.pl/firma/polskie-radio) | 53 | Publiczna radiofonia. W 100% własność Skarbu Państwa. |
| [provident](https://czypolskafirma.pl/firma/provident) | 53 | W 100% należy do brytyjskiej grupy IPF plc z Londynu. |
| [fresenius-kabi](https://czypolskafirma.pl/firma/fresenius-kabi) | 55 | Kontrolowana przez niemiecki koncern Fresenius SE & Co. |
| [ceneo](https://czypolskafirma.pl/firma/ceneo) | 58 | W 100% należy do polskiej grupy Allegro, notowanej na GPW. |
| [gilead-sciences](https://czypolskafirma.pl/firma/gilead-sciences) | 58 | Amerykańska spółka publiczna o rozproszonym akcjonariacie. |
| [payback](https://czypolskafirma.pl/firma/payback) | 59 | Należy w 100% do amerykańskiej korporacji American Express. |
| [apis-natural-cosmetics](https://czypolskafirma.pl/firma/apis-natural-cosmetics) | 61 | Polska firma kosmetyczna ze 100% polskim kapitałem prywatnym. |
| [helios](https://czypolskafirma.pl/firma/helios) | 61 | Największa polska sieć kin. W 100% należy do grupy Agora S.A. |
| [dre](https://czypolskafirma.pl/firma/dre) | 62 | Polski producent drzwi. Należy w 100% do polskich właścicieli. |
| [tvp-telewizja-polska](https://czypolskafirma.pl/firma/tvp-telewizja-polska) | 62 | Publiczny nadawca telewizyjny. W 100% własność Skarbu Państwa. |
| [porta-kmi-poland](https://czypolskafirma.pl/firma/porta-kmi-poland) | 62 | Polski producent drzwi. Firma prywatna, w 100% polski kapitał. |
| [dekoral](https://czypolskafirma.pl/firma/dekoral) | 62 | Marka farb należąca do polskiej Grupy Śnieżka. Polski kapitał. |
| [relpol](https://czypolskafirma.pl/firma/relpol) | 64 | Spółka notowana na GPW z polskim kapitałem (Adam Ambroziak 33%). |
| [kernau](https://czypolskafirma.pl/firma/kernau) | 64 | Polska marka sprzętu AGD. Należy w 100% do polskich właścicieli. |
| [erli](https://czypolskafirma.pl/firma/erli) | 65 | Polska platforma zakupowa. Należy w 100% do polskich założycieli. |
| [wakacje-pl](https://czypolskafirma.pl/firma/wakacje-pl) | 65 | Należy w 100% do notowanej na GPW grupy Wirtualna Polska Holding. |
| [gazeta-wyborcza](https://czypolskafirma.pl/firma/gazeta-wyborcza) | 66 | Dziennik wydawany przez polską spółkę Agora S.A., notowaną na GPW. |
| [jbb-baldyga](https://czypolskafirma.pl/firma/jbb-baldyga) | 66 | Polski zakład mięsny. Należy w 100% do założyciela Józefa Bałdygi. |
| [bonito-pl](https://czypolskafirma.pl/firma/bonito-pl) | 69 | Polska księgarnia internetowa. Należy w 100% do polskich właścicieli. |

Pełna lista w `.tmp/audyt-danych/raport.md` po uruchomieniu skryptu.

### Daty weryfikacji

| Miesiąc dodania (`created_at`) | Profili bez `verified_at` |
|---|---|
| 2025-12 | 7 |
| 2026-03 | 289 |
| 2026-04 | 173 |
| 2026-05 | 80 |
| 2026-07 | 199 |
| **razem** | **748** |

Żadna data na profilu nie jest starsza niż 12 miesięcy. Profile z `verified_at` (807) są z 2026-09 i 2026-10.

### Inne

- Bez `owner_name`: 0. Bez NIP: 0. NIP niepoprawny: [zywiec-zdroj](https://czypolskafirma.pl/firma/zywiec-zdroj) („Zgodny”).

## 5. Duplikaty

Konwencja serwisu: marka bez własnej strony ma www grupy z fragmentem (`https://www.decathlon.pl/#kalenji`), więc ten sam
host z różnymi fragmentami **nie** jest duplikatem i skrypt go nie zgłasza.

### Mocne (ten sam dokładny URL, ten sam NIP, zbieżne nazwy marki)

| Profile | Marki | NIP | www |
|---|---|---|---|
| [armatura-krakow](https://czypolskafirma.pl/firma/armatura-krakow) / [kfa-armatura](https://czypolskafirma.pl/firma/kfa-armatura) | Armatura Kraków / KFA Armatura | 6750001320 | kfa.pl |
| [astra](https://czypolskafirma.pl/firma/astra) / [kawa-astra](https://czypolskafirma.pl/firma/kawa-astra) | Astra / Kawa Astra | 7781005348 | astra.com.pl |
| [barwa](https://czypolskafirma.pl/firma/barwa) / [barwa-cosmetics](https://czypolskafirma.pl/firma/barwa-cosmetics) | Barwa / Barwa Cosmetics | 6772152003 | barwa.com.pl |
| [kormoran](https://czypolskafirma.pl/firma/kormoran) / [browar-kormoran](https://czypolskafirma.pl/firma/browar-kormoran) | Kormoran / Browar Kormoran | 7391016344 | browarkormoran.pl |
| [qemetica](https://czypolskafirma.pl/firma/qemetica) / [ciech-qemetica](https://czypolskafirma.pl/firma/ciech-qemetica) | Qemetica / Ciech (Qemetica) | 1180019377 | qemetica.com |
| [cisowianka](https://czypolskafirma.pl/firma/cisowianka) / [cisowianka-naleczow-zdroj](https://czypolskafirma.pl/firma/cisowianka-naleczow-zdroj) | Cisowianka / Cisowianka Nałęczów Zdrój | 7162351041 | cisowianka.pl |
| [drogerie-polskie](https://czypolskafirma.pl/firma/drogerie-polskie) / [dp-drogerie-polskie](https://czypolskafirma.pl/firma/dp-drogerie-polskie) | Drogerie Polskie / DP Drogerie Polskie | 6332214711 | drogeriepolskie.pl |
| [fermy-wozniak](https://czypolskafirma.pl/firma/fermy-wozniak) / [fermy-drobiu-wozniak](https://czypolskafirma.pl/firma/fermy-drobiu-wozniak) | Fermy Woźniak / Fermy Drobiu Woźniak | 6991819714 | fdw.pl |
| [gazeta-wyborcza](https://czypolskafirma.pl/firma/gazeta-wyborcza) / [wyborcza-pl](https://czypolskafirma.pl/firma/wyborcza-pl) | Gazeta Wyborcza / Wyborcza.pl | 5260305644 | wyborcza.pl |
| [piatnica](https://czypolskafirma.pl/firma/piatnica) / [osm-piatnica](https://czypolskafirma.pl/firma/osm-piatnica) | Piątnica / OSM Piątnica | 7180000240 | piatnica.com.pl |

Uwaga: część par ma różny `owner_name` mimo tej samej spółki (np. `drogerie-polskie` „Prywatny wspólnik większościowy (osoba fizyczna)”).
Przy scalaniu warto ujednolicić też właściciela.

### Średnie (ten sam URL i NIP, różne marki)

| Profile | Uwagi |
|---|---|
| [american-heart-of-poland](https://czypolskafirma.pl/firma/american-heart-of-poland) / [polsko-amerykanskie-kliniki-serca](https://czypolskafirma.pl/firma/polsko-amerykanskie-kliniki-serca) | ta sama sieć (ahop.pl) pod dwiema nazwami, prawie na pewno duplikat |
| [kanani-europe](https://czypolskafirma.pl/firma/kanani-europe) / [miya-cosmetics](https://czypolskafirma.pl/firma/miya-cosmetics) | ta sama spółka, Kanani Europe to nazwa spółki, nie marka konsumencka |
| [electromobility-poland](https://czypolskafirma.pl/firma/electromobility-poland) / [izera](https://czypolskafirma.pl/firma/izera) | spółka i jej marka, rozdzielenie zasadne; Izera mogłaby mieć `#izera` |
| [ccc](https://czypolskafirma.pl/firma/ccc), [lasocki](https://czypolskafirma.pl/firma/lasocki), [badura](https://czypolskafirma.pl/firma/badura), [gino-rossi](https://czypolskafirma.pl/firma/gino-rossi) | wszystkie `https://ccc.eu/pl/`; to marki, nie duplikaty, ale bez fragmentu `#marka` mają to samo logo |

### Słabe (do szybkiego odsiania, prawie na pewno różne firmy)

[cda](https://czypolskafirma.pl/firma/cda) vs [cda-pl](https://czypolskafirma.pl/firma/cda-pl), [dino-polska](https://czypolskafirma.pl/firma/dino-polska) vs
[kino-polska](https://czypolskafirma.pl/firma/kino-polska), [mabion](https://czypolskafirma.pl/firma/mabion) vs [marion](https://czypolskafirma.pl/firma/marion),
[morpol](https://czypolskafirma.pl/firma/morpol) vs [torpol](https://czypolskafirma.pl/firma/torpol): różne firmy.
Ten sam URL, różne NIP-y (spółki jednej grupy): [cellnex](https://czypolskafirma.pl/firma/cellnex) / [polkomtel-infrastruktura](https://czypolskafirma.pl/firma/polkomtel-infrastruktura),
[com40](https://czypolskafirma.pl/firma/com40) / [correct](https://czypolskafirma.pl/firma/correct), [netia](https://czypolskafirma.pl/firma/netia) /
[telefonia-dialog](https://czypolskafirma.pl/firma/telefonia-dialog), [inmedio](https://czypolskafirma.pl/firma/inmedio) PT / [relay](https://czypolskafirma.pl/firma/relay) FR.

## 6. Styl opisów z bazy: pauzy i forma „my”

- **Forma „my”: 0.** Jedyne trafienia to nazwy własne („My Little Pony”, „Fundacja Nasze Dzieci”), skrypt je pomija.
- **„ - ” jako pauza:** 1 trafienie ([krosno](https://czypolskafirma.pl/firma/krosno)), ale to fragment nazwy spółki („Środowisko i Innowacje - Składowisko”), bez działania.
- **en-dash bez spacji** (zakresy „A3–A8”, „X1–X7”) nie jest liczony.

### Em-dash („—”), 14 profili

| Profil | Pole | Fragment |
|---|---|---|
| [boldare](https://czypolskafirma.pl/firma/boldare) | business_description | …jalizujący się w tworzeniu i rozwijaniu produktów cyfrowych [em-dash] od etapu strategii produktowej, przez design, po rozwój ap… |
| [cellnex](https://czypolskafirma.pl/firma/cellnex) | business_description | Operator pasywnej infrastruktury telekomunikacyjnej [em-dash] zarządza wieżami, masztami i obiektami small cells. Wynajm… |
| [emitel](https://czypolskafirma.pl/firma/emitel) | business_description | Operator naziemnej infrastruktury nadawczej [em-dash] zarządza siecią wież i masztów do emisji sygnału telewizji… |
| [fiberhost](https://czypolskafirma.pl/firma/fiberhost) | ownership_description | Własność Odin Holdings S.à r.l. (Luksemburg [em-dash] wehikuł inwestycyjny), kontrolowana przez australijską gru… |
| [profim](https://czypolskafirma.pl/firma/profim) | ownership_description | … Grupę Flokk. Flokk jest kontrolowany przez Triton Partners [em-dash] europejski fundusz private equity z siedzibą operacyjną w … |
| [inea](https://czypolskafirma.pl/firma/inea) | ownership_description | Własność Odin Holdings S.à r.l. (Luksemburg [em-dash] wehikuł inwestycyjny). Ostateczny właściciel: australijska… |
| [kontakt-simon](https://czypolskafirma.pl/firma/kontakt-simon) | ownership_description | …t oddał 50% udziałów hiszpańskiej grupie Simon Holding S.L. [em-dash] od ok. 2005 r. oba podmioty (IT/ES) posiadają po 50% akcji… |
| [merixstudio](https://czypolskafirma.pl/firma/merixstudio) | business_description | …re house specjalizujący się w tworzeniu produktów cyfrowych [em-dash] aplikacji webowych i mobilnych na zamówienie. Oferuje usłu… |
| [multimedia](https://czypolskafirma.pl/firma/multimedia) | ownership_description | … Zintegrowana operacyjnie z Vectrą. Beneficjent rzeczywisty [em-dash] polski przedsiębiorca Tomasz Węgrzyński.… |
| [wrodzinie](https://czypolskafirma.pl/firma/wrodzinie) | business_description | …bilnego skierowane do rodzin. Aktualnie w trybie wygaszania [em-dash] obsługuje wyłącznie istniejących klientów.… |
| [blik](https://czypolskafirma.pl/firma/blik) | ownership_description | Polski Standard Płatności S.A. [em-dash] spółka powołana przez konsorcjum sześciu największych pols… |
| [primark](https://czypolskafirma.pl/firma/primark) | ownership_description | …tórego właścicielem w 79,2% jest Garfield Weston Foundation [em-dash] brytyjska fundacja założona przez rodzinę Weston.… |
| [promax](https://czypolskafirma.pl/firma/promax) | ownership_description | …kim. Wspólnikami są Zofia Fórmanek-Okrój oraz Wiesław Okrój [em-dash] polscy przedsiębiorcy. Przedsiębiorstwo ze 100% polskim ka… |
| [mobile-vikings](https://czypolskafirma.pl/firma/mobile-vikings) | business_description | …operator komórkowy (MVNO) działający w modelu digital-first [em-dash] zarządzanie usługami odbywa się wyłącznie przez aplikację … |

### En-dash jako pauza („ – ”), 47 profili

[bakoma](https://czypolskafirma.pl/firma/bakoma) (działalność), [brembo](https://czypolskafirma.pl/firma/brembo) (działalność), [deichmann](https://czypolskafirma.pl/firma/deichmann) (działalność), [rtv-euro-agd](https://czypolskafirma.pl/firma/rtv-euro-agd) (własność), [bricomarche](https://czypolskafirma.pl/firma/bricomarche) (własność), [kler](https://czypolskafirma.pl/firma/kler) (własność), [poczta-polska](https://czypolskafirma.pl/firma/poczta-polska) (własność), [moya](https://czypolskafirma.pl/firma/moya) (własność), [pekao](https://czypolskafirma.pl/firma/pekao) (działalność), [bnp-paribas](https://czypolskafirma.pl/firma/bnp-paribas) (działalność), [com40](https://czypolskafirma.pl/firma/com40) (własność), [emitel](https://czypolskafirma.pl/firma/emitel) (własność), [fiat](https://czypolskafirma.pl/firma/fiat) (działalność), [frosta](https://czypolskafirma.pl/firma/frosta) (działalność), [rmf-fm](https://czypolskafirma.pl/firma/rmf-fm) (własność), [hagi](https://czypolskafirma.pl/firma/hagi) (własność), [iglotex](https://czypolskafirma.pl/firma/iglotex) (działalność), [ing](https://czypolskafirma.pl/firma/ing) (własność), [inglot](https://czypolskafirma.pl/firma/inglot) (własność), [inpost](https://czypolskafirma.pl/firma/inpost) (własność), [lidl](https://czypolskafirma.pl/firma/lidl) (własność), [lycamobile](https://czypolskafirma.pl/firma/lycamobile) (własność), [mk-foam-kolo](https://czypolskafirma.pl/firma/mk-foam-kolo) (własność), [madej-wrobel](https://czypolskafirma.pl/firma/madej-wrobel) (działalność), [mattel](https://czypolskafirma.pl/firma/mattel) (działalność), [mazda](https://czypolskafirma.pl/firma/mazda) (działalność), [meble-vox](https://czypolskafirma.pl/firma/meble-vox) (własność), [meble-wojcik](https://czypolskafirma.pl/firma/meble-wojcik) (własność), [michelin](https://czypolskafirma.pl/firma/michelin) (własność), [mieszko](https://czypolskafirma.pl/firma/mieszko) (działalność), [mostostal-zabrze](https://czypolskafirma.pl/firma/mostostal-zabrze) (własność), [muller](https://czypolskafirma.pl/firma/muller) (działalność), [oshee](https://czypolskafirma.pl/firma/oshee) (działalność), [people-can-fly](https://czypolskafirma.pl/firma/people-can-fly) (własność), [polmlek](https://czypolskafirma.pl/firma/polmlek) (własność), [polregio](https://czypolskafirma.pl/firma/polregio) (własność), [pkp](https://czypolskafirma.pl/firma/pkp) (własność), [lot](https://czypolskafirma.pl/firma/lot) (własność), [premium-mobile](https://czypolskafirma.pl/firma/premium-mobile) (własność), [pudliszki-heinz](https://czypolskafirma.pl/firma/pudliszki-heinz) (działalność), [mlekovita](https://czypolskafirma.pl/firma/mlekovita) (własność), [volkswagen](https://czypolskafirma.pl/firma/volkswagen) (działalność), [wawel](https://czypolskafirma.pl/firma/wawel) (działalność), [wyborowa-pernod-ricard](https://czypolskafirma.pl/firma/wyborowa-pernod-ricard) (działalność), [onet](https://czypolskafirma.pl/firma/onet) (własność), [zabka](https://czypolskafirma.pl/firma/zabka) (własność), [zott](https://czypolskafirma.pl/firma/zott) (działalność)

Poprawka mechaniczna istnieje: `usunMyslniki` w `tools/firmy/lib/tekst.mjs` (zamienia pauzę na przecinek). Lepiej jednak
poprawić ręcznie przy reweryfikacji, bo część zdań po zamianie na przecinek wymaga przeredagowania.

---

## Jak powtórzyć audyt

```bash
node tools/audyt-danych/audyt-danych.mjs
```

- Pierwsze uruchomienie pobiera 1555 profili (ok. 15 minut przy 3 zapytaniach naraz), kolejne korzystają z cache
  w `.tmp/audyt-danych/` (poza gitem). `--odswiez` pobiera wszystko od nowa, `--bez-sieci` liczy tylko z cache.
- Wynik: `.tmp/audyt-danych/raport.md` (wszystkie tabele, pełne listy), `wyniki.json`, `firmy.json`
  i wygenerowany `poprawki-wlasciciele.sql`. Plik w repo (`tools/audyt-danych/poprawki-wlasciciele.sql`) to ta sama
  generacja z 2026-11-04.
- Skrypt nie używa kluczy do bazy i niczego nie zapisuje w Supabase.
