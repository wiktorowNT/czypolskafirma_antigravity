# Audyt procesów i projekt automatu dodawania firm (wrzesień 2026)

> Etap 1 zadania z `docs/prompty-fable/1-audyt-procesow-i-automat-firm.md`.
> Stan na 2026-09-17. Żaden kod nie został zmieniony. Wszystkie testy API wykonane
> na żywo tego dnia (KRS, MF, CRBR, wyszukiwarka KRS, rejestr.io, GUS, Bankier).
> Baza: 750 firm (350 PL / 400 zagranicznych, 36 krajów, 19 kategorii).

---

## 0. Do zrobienia natychmiast, niezależnie od reszty

### 0.1 Klucz `service_role` Supabase leży w publicznym repozytorium

Repozytorium `wiktorowNT/czypolskafirma_antigravity` jest publiczne. W dwóch plikach
jest zahardkodowany pełny klucz `service_role` (rola zdekodowana z tokenu, ważny do 2035):

- `tools/pipeline-v2.html` (linie 237–238), także na `main`,
- `tools/check_duplicates.mjs` (linie 3–4), także na `main`.

Klucz `service_role` omija RLS i daje pełny zapis, odczyt i kasowanie całej bazy.
Każdy, kto znajdzie repo, może wyczyścić lub przepisać tabelę `companies`.
Historia gita też go zawiera, więc samo usunięcie z plików nic nie daje.

**Co zrobić (Ty, w tej kolejności):**
1. Supabase → Project Settings → API → **wygeneruj nowy klucz `service_role`** (stary
   przestaje działać). Wpisz nowy do `.env.local` (`SUPABASE_SERVICE_ROLE_KEY`).
2. Dopiero potem usuwamy klucze z obu plików (to część etapu 2, bo `pipeline-v2.html`
   i tak idzie do przebudowy).
3. Opcjonalnie: przepisać historię (`git filter-repo`) — po rotacji klucza to już tylko
   kosmetyka, można pominąć.

Dodatkowo klucz `anon` jest zahardkodowany w `fetch-logos.mjs` i `generate-logo-audit.mjs`.
To klucz publiczny (i tak jest w bundlu strony), więc nie jest to wyciek, ale skrypty
powinny czytać go z `.env.local` jak pozostałe.

### 0.2 Automat treści pada, bo poprawka nie dotarła na `main`

Od 2026-08-24 do 2026-09-16 na 24 uruchomienia 15 skończyło się błędem. Log z 16.09:
„Claude reported a successful result after 97 turns, exceeding the configured maximum
of 80". Commit `6adfa85` (limit 80 → 130, timeout 40 → 60 min) jest na `develop`, ale
GitHub czyta plik workflow z `main`. Dopóki nie scalisz `develop → main`, automat
będzie padał w większość dni. To jest jednoklikowa naprawa 60% awarii.

---

## 1. Mapa obecnych procesów

Legenda: 🔴 ręczne · 🟡 półautomatyczne (narzędzie + Twoja ręka) · 🟢 automatyczne.
Kolumna „czas" to mój szacunek na partię ~40 firm; proszę o korektę w sekcji 7.

### 1.1 Dodawanie firm (`docs/SOP_dodawanie_firm.md`)

| Krok | Jak dziś | Tryb | Szac. czas / 40 firm | Gdzie ginie czas |
|---|---|---|---|---|
| 1. Seed listy | prompt do 5 czatów, ręczne scalenie powtórzeń, wklejenie do Sheets | 🔴 | 15–20 min | porównywanie 5 list na oko |
| 2. NIP | prompt do AI → NIP-y z pamięci modelu → Sheets | 🔴 | 30–45 min | modele zmyślają NIP-y; `weryfikator-nip.html` sprawdza tylko, czy NIP istnieje, nie czy to właściwa spółka |
| 3. Śledztwo kapitałowe | Master Prompt w 5 czatach, 5 tabel Markdown | 🔴 | 20–30 min | kopiuj-wklej ×5, żadnych źródeł w wyniku |
| 3b. Synteza | sesja Claude wg Kroku 3b albo `porownywarka-ownership.html` (głosowanie + najdłuższy opis) | 🟡 | 60–90 min | tu jest największa ręczna praca: czytanie 5 wersji, rozstrzyganie konfliktów bez źródeł |
| 4. Opis działalności | nowy czat, prompt, tabela → Sheets (`porownywarka-business.html`) | 🔴 | 20–30 min | kolejny kopiuj-wklej |
| 5. Import | Sheets → CSV → Supabase Table Editor, albo `pipeline-v2.html` (bezpośredni POST z kluczem service_role w HTML) | 🟡 | 20–30 min | ręczne mapowanie kolumn, brak dry-run, brak walidacji |
| 6. Po imporcie | `fetch-logos` → `cleanup-logos` → `generate-logo-audit` → Logo Fixer → `generate-og-assets` → commit | 🟡 | 30–60 min | audyt wzrokowy 40 logo, naprawy ręczne |
| 7. Marki (`brands`) | partie 25 firm z `docs/marki-partie.md` → prompt → SQL do SQL Editora | 🔴 | 20–30 min | osobny obieg, poza SOP |
| 8. `display_name` | jednorazowa migracja z lipca; nowe firmy dostają `display_name` tylko, jeśli wpiszesz ręcznie | 🔴 | — | nowe firmy prawdopodobnie bez `display_name` |

Razem: **ok. 4–5 h na 40 firm**, z czego decyzja o klasyfikacji (to, co ma zostać
u Ciebie) to może 30–45 min. Reszta to transport danych między oknami.

Rzeczy, których proces dziś w ogóle nie robi: nie zapisuje **źródeł**, nie zapisuje
**daty stanu** („stan na"), nie zapisuje **pewności**, nie sprawdza zgodności z drzewem
decyzyjnym V2 (Master Prompt w SOP jest w starszej wersji niż Prompt B
z `PROMPTY_OPERACYJNE.md`), nie odpytuje KRS ani CRBR.

### 1.2 Logotypy (`docs/SOP_logotypy.md`)

| Krok | Tryb | Uwagi |
|---|---|---|
| fetch (Brandfetch → Clearbit → Google → icon.horse → …) | 🟢 | działa, kaskada 7 źródeł |
| cleanup duplikatów | 🟢 | dry-run domyślnie, dobrze |
| audyt wzrokowy (`audyt-logo.html`, 1,35 MB) | 🔴 | jedyny naprawdę ręczny krok; audyt z 11.07 pokazuje 0 brakujących na 750 |
| Logo Fixer (`/narzedzia/logo-fixer` + `/api/tools/upload-logo`) | 🟡 | endpoint nadal bez sprawdzania `ADMIN_SECRET_KEY` (punkt K1 audytu technicznego, wciąż otwarty) |
| kopie PNG do OG (`generate-og-assets`) | 🟢 | |
| commit `public/logos` | 🔴 | |

Proces jest w porządku. Jedyne usprawnienie z sensem: po każdej partii automat firm
sam odpala fetch + og-assets i zostawia Ci tylko audyt wzrokowy nowych logo (40, nie 750).

### 1.3 Treści i social

| Element | Tryb | Stan faktyczny |
|---|---|---|
| Codzienna paczka (blog + X + FB) przez GitHub Actions | 🟢 generowanie, 🔴 publikacja | 37 PR-ów od 27.07. **13 otwartych PR-ów z 10–25.08 nigdy nie scalonych**, 8 zamkniętych z 1–9.08 (osiem dni z rzędu ten sam temat Couche-Tard/Żabka, zanim wszedł bezpiecznik „tematy zużyte"). Od 24.08: 9 sukcesów / 15 porażek (patrz 0.2) |
| Lint treści | 🟢 | dobrze zaprojektowany, 19 KB reguł |
| Okładka wpisu | 🟢 | puppeteer w CI, działa |
| Skill `generator-postow` (paczka niedzielna) | 🟡 | ostatnie użycie w `stan-generatora.json`: 2026-07-23; `firmy-cache.json` pokrywa 4 z 19 kategorii |
| Skill `komentator-x` (poranny przegląd X) | 🟡 wymaga Chrome i Ciebie | ostatni wpis w `stan-komentarzy.json`: 2026-07-31 |
| Skill `lowca-newsow` | 🟢 | używany przez automat jako źródło zasad |
| Publikacja na X i FB | 🔴 | kopiuj-wklej z opisu PR-a; świadoma decyzja (wiarygodność), zostaje |

Wniosek: automat treści **produkuje więcej, niż jesteś w stanie przejrzeć**. Kolejka 13
nieprzejrzanych paczek to sygnał, że wąskim gardłem jest Twoje 3 minuty rano, nie
generowanie. Harmonogram tygodniowy ze `STRATEGIA_WZROSTU.md` (niedzielna paczka,
poranne komentarze) w praktyce ustał w sierpniu.

### 1.4 SEO

| Element | Tryb | Stan |
|---|---|---|
| Sitemapa (podzielona, commit `fc922af`) | 🟢 | Google widzi 778 stron |
| Werdykt w tytułach profili | 🟢 | zrobione |
| Ręczne zgłaszanie w GSC (`docs/seo-kolejka-indeksacji.md`) | 🔴 | 22 z ~106 zgłoszone, 7 tygodni przerwy; limit 11/dzień |
| Tytuły wpisów „Kto jest właścicielem X" | 🟢 | wniosek z GSC (CTR 5,7% vs 0,1–0,8% profili) wpisany w prompt automatu, dobrze |

### 1.5 Backup (`docs/BACKUP_STRATEGY.md`)

Ręczny zrzut z TablePlus na Google Drive, bez harmonogramu i bez śladu, kiedy ostatnio
zrobiony. Ostatni eksport w repo (`data/robocze/companies_raw.csv`) ma `created_at`
z grudnia 2025. Przy wycieku klucza `service_role` (0.1) to jest realne ryzyko:
gdyby ktoś skasował tabelę dziś, nie wiadomo, do jakiego stanu dałoby się wrócić.

---

## 2. Wąskie gardła i ryzyka jakości

Uporządkowane od najgroźniejszego dla wiarygodności bazy.

1. **NIP-y z pamięci modeli, bez sprawdzenia tożsamości.** Krok 2 SOP bierze NIP-y
   od AI. `weryfikator-nip.html` potwierdza tylko, że NIP istnieje w Białej Liście,
   nie że należy do właściwej spółki (np. NIP spółki-córki dystrybucyjnej zamiast
   operatora marki). Błędny NIP → błędny `registry_url` → błędne „twarde dane".
2. **Synteza przez głosowanie i „najdłuższy opis".** `porownywarka-ownership.html`
   wybiera kraj większością głosów, a opis: najdłuższy z tych zgodnych z krajem.
   `pipeline-v2.html` robi to samo w super-prompcie. Pięć modeli uczonych na tym samym
   internecie myli się **razem** (ten sam nieaktualny artykuł z Wikipedii), więc
   zgodność 5/5 nie jest dowodem. Długość opisu nagradza gadatliwość, nie prawdę.
3. **Brak źródeł i dat w rekordach.** Kolumny `sources`, `confidence` nie istnieją.
   `verified_at` istnieje i jest pokazywane na profilu, ale nie wiem, ile rekordów
   ma je wypełnione (pytanie w sekcji 7). Bez tego re-weryfikacja (Prompt F) nie ma
   od czego zacząć, a `METODOLOGIA_V2` słusznie mówi, że „baza bez dat gnije w ciszy".
4. **Struktury się zmieniają, a baza nie.** Przykłady z ostatnich tygodni z Twojego
   własnego automatu treści: Couche-Tard/Żabka, Deutsche Telekom/Inea, Avallon/Inglot,
   Mitsubishi Electric/Medcom, Grupa Pracuj/No Fluff Jobs. Sekcja „Kandydaci do bazy"
   w PR-ach nigdzie nie trafia automatycznie.
5. **Ręczne kopiowanie między 5 czatami, Sheets i Supabase.** Każde przejście to
   miejsce na przesunięty wiersz, zgubiony diakrytyk, obcięty opis. Import przez
   Table Editor nie ma dry-run ani walidacji `country_code` względem `lib/countries.ts`
   (baza nie ma constraintu; kod ma słownik 38 kodów, reszta wyświetli się bez nazwy).
6. **Dwie wersje metodologii w obiegu.** SOP Krok 3 ma Master Prompt V1 (bez reguł
   brzegowych, „ponad 50% udziałów"), `PROMPTY_OPERACYJNE.md` ma Prompt B V2 (głosy,
   fundusze pasywne, B1–B12). Jeśli wklejasz prompt z SOP, klasyfikujesz po staremu.
7. **Nazwy kolumn nie zgadzają się między dokumentami a bazą.** `CLAUDE.md` i SOP
   mówią o `ultimate_owner`; w bazie i w `pipeline-v2.html` jest `owner_name`.
   W SOP Krok 5 lista nagłówków CSV (7 kolumn) różni się od „Schematu kolumn" (10
   kolumn A–J) w tym samym pliku. `DEVELOPMENT_WORKFLOW.md` nadal każe używać
   `/firma/[id]`. Model, który czyta te dokumenty jako instrukcję, dostaje sprzeczne dane.
8. **`pipeline-v2.html` wpisuje `name` jako title-case ze sluga**, nie nazwę z modelu
   (linia ~462). Stąd w bazie `name` bywa puste lub sztuczne, a `display_name` trzeba
   uzupełniać osobno.
9. **Prompt injection przez cudze strony** jest dobrze obsłużony w automacie treści
   (dane, nie polecenia; tylko pliki treści; jeden Bash). Automat firm musi odziedziczyć
   te same bezpieczniki, bo będzie czytał strony spółek i media.

---

## 3. Przegląd narzędzi w `tools/`

| Plik | Werdykt | Uzasadnienie |
|---|---|---|
| `pipeline-v2.html` | **DO PRZEBUDOWY / WYCOFANIA** | klucz `service_role` w HTML (0.1); synteza głosowaniem; import bez dry-run. Zastępuje go automat z sekcji 4 |
| `porownywarka-ownership.html` | wycofać po wdrożeniu automatu | heurystyka „najdłuższy opis"; dobre UI konfliktów warto przenieść do nowego przeglądu partii |
| `porownywarka-business.html` | wycofać po wdrożeniu automatu | jw.; generator promptu wchłania automat |
| `weryfikator-nip.html` | zostaje jako narzędzie doraźne | jedyne dziś wywołanie MF; logika przechodzi do skryptu automatu |
| `fetch-logos.mjs`, `cleanup-logos.mjs`, `generate-logo-audit.mjs`, `generate-og-assets.mjs` | **AKTYWNE** | rdzeń SOP logotypów; tylko przenieść klucz anon do `.env.local` |
| `audyt-logo.html`, `missing-logos.json` | artefakty generowane | `missing-logos.json` nieaktualny (7 domen z 6.07, audyt z 11.07 mówi 0); do `.gitignore` |
| `fixer-server.mjs` + `logo-fixer-standalone.html` + `logo-fixer-start.bat` (root) | **MARTWE, dublują** `/narzedzia/logo-fixer` + `/api/tools/upload-logo` | usunąć; zostaje `otworz-logo-fixer.bat` |
| `lint-tresci.mjs`, `okladka-wpisu.mjs`, `okladka-szablon.html` | **AKTYWNE** (CI) | |
| `render-blog-cover.mjs` | dubluje `okladka-wpisu.mjs` | zostawić tylko, jeśli używasz do makiet; inaczej usunąć |
| `render-makiety.mjs` | nowy, niezacommitowany | należy do równoległej sesji „nowy wygląd", nie ruszam |
| `apply-brands-json.mjs`, `fetch-companies-without-brands.mjs`, `mark-checked-no-brands.mjs`, `check-brands-status.mjs` | aktywne, ale poza SOP | obieg marek działa równolegle do SOP firm; automat powinien wypełniać `brands` od razu |
| `check-partial.mjs` | **MARTWY** | ścieżka do scratchpada innej sesji Claude zaszyta w kodzie |
| `check_duplicates.mjs` | **MARTWY + klucz service_role** | usunąć po rotacji klucza; dedup robi automat |
| `normalizuj-slugi.mjs`, `fill-display-names.mjs`, `gen-display-name-sql.mjs`, `apply-display-names.mjs`, `add-display-name.sql`, `optimize-site-assets.mjs` | JEDNORAZOWE, wykonane (lipiec) | przenieść do `tools/archiwum/` albo usunąć; `gen-display-name-sql.mjs` ma cenny słownik `CORRECTIONS` (~150 poprawnych nazw marek), który automat może wykorzystać do `display_name` |
| `tools/sql/*.sql` | wykonane migracje | zostają jako dokumentacja schematu |
| `temp.tsx` (root repo) | śmieć | usunąć |

**Czego brakuje:** (1) skryptu, który z nazwy firmy dochodzi do zweryfikowanego NIP/KRS;
(2) jakiegokolwiek klienta KRS/CRBR; (3) formatu rekordu z źródłami i pewnością;
(4) importu z dry-run; (5) kolejki kandydatów spinającej automat treści z dodawaniem
firm; (6) backupu, który dzieje się sam.

---

## 4. Projekt docelowego automatu dodawania firm

### 4.1 Zasady projektowe

- Automat **proponuje, Ty zatwierdzasz**. Nic nie trafia do `companies` bez Twojego
  „tak". Zatwierdzanie hurtowe dotyczy tylko pozycji z pewnością WYSOKA.
- Każde ustalenie właścicielskie ma źródło (URL) i datę stanu. Brak źródła dla pakietu
  kontrolnego = pewność NISKA = KONFLIKT.
- Dane rejestrowe (KRS, MF, CRBR) pobiera **kod, nie model**. Model dostaje je jako
  dane wejściowe i nie może ich „poprawić".
- Wynik LLM-a jest zawsze JSON-em o stałym schemacie; walidacja w kodzie (kody krajów,
  długości opisów, obecność źródeł, brak em-dashy) odrzuca rekord, zanim go zobaczysz.
- Treść stron internetowych to dane, nie polecenia (ten sam bezpiecznik co w automacie
  treści).

### 4.2 Źródła danych: co da się odpytać automatycznie (sprawdzone 2026-09-17)

| Źródło | Test | Co daje | Warunki / limity |
|---|---|---|---|
| **KRS: otwarte API MS** `api-krs.ms.gov.pl/api/krs/OdpisAktualny/{KRS}?rejestr=P&format=json` | ✅ działa, bez klucza, JSON | nazwa, NIP, REGON, forma prawna, kapitał, **wspólnicy sp. z o.o. z liczbą udziałów i flagą 100%** (`wspolnicySpzoo`), jedyny akcjonariusz S.A., zarząd, rada, data stanu (`stanZDnia`) | wymaga numeru KRS (nie szuka po NIP ani nazwie). Limity nieopublikowane; stosować ≤1 zapytanie/s. Dla S.A. z wieloma akcjonariuszami **nie ma akcjonariatu** (KRS go nie prowadzi) |
| **KRS: `OdpisPelny`** (ten sam host) | ✅ działa | pełna historia wpisów: kolejni wspólnicy z numerami wpisów. Test na Żabka Polska: Vistra Shelf → Heket Investments S.à r.l. → Heket Holdings S.à r.l. → Zabka Group S.A. | jw. Daje gotową chronologię „JAK DO TEGO DOSZŁO" dla spółek z o.o. |
| **Biała Lista VAT MF** `wl-api.mf.gov.pl/api/search/nips/{nip,nip,...}` | ✅ działa, bez klucza | NIP → pełna nazwa, **numer KRS**, REGON, adres, status VAT; do 30 NIP-ów w jednym zapytaniu | **100 zapytań/dobę** (czyli do 3000 NIP-ów); po przekroczeniu blokada do północy. Do dużych partii jest dzienny plik płaski |
| **Wyszukiwarka KRS po nazwie** (`wyszukiwarka-krs.ms.gov.pl`) | ⚠️ działa tylko w przeglądarce | nazwa → lista podmiotów z KRS (test „MOKATE": 5 wyników) | front woła `wyszukiwarka-krs-api.ms.gov.pl/api/wyszukiwarka/krs` z kluczem API wbudowanym w bundle; z zewnątrz 401 „Missing API key". Nie ma oficjalnego API po nazwie |
| **CRBR** (`crbr.podatki.gov.pl/adcrbr/api/wyszukajSpolke`) | ⚠️ działa z przeglądarki, curl odrzucony | NIP → lista beneficjentów rzeczywistych: obywatelstwo, kraj zamieszkania, rodzaj uprawnień, % (gdy podany). Test Żabka Polska: 6 beneficjentów, wszyscy „wyższe stanowisko kierownicze" (czyli brak osoby fizycznej z >25%) | endpoint nieoficjalny; ten sam JSON z curl zwraca „Niepoprawny NIP" (prawdopodobnie sesja/reCAPTCHA po stronie serwera). W automacie: przez puppeteera (już jest w repo) albo w ogóle pominąć w MVP. **Odpowiedź zawiera numery PESEL** — automat nie może ich zapisywać; przechowujemy tylko zagregowany wniosek |
| **GUS BIR 1.1** | klucz wymagany (nie testowany z kluczem) | dane REGON: nazwa, adres, PKD, forma | darmowy klucz na wniosek e-mail przez `api.stat.gov.pl`, SOAP. Dubluje MF + KRS, **niepotrzebny w MVP** |
| **rejestr.io API** | 🔒 401 bez klucza | wyszukiwanie po nazwie, powiązania kapitałowe i osobowe, historia | płatne: **0,5 zł za zapytanie**, 1000 zapytań/min. Przy 40 firmach i ~3 zapytaniach/firmę to 60 zł na partię. Opcja na później, gdy wyszukiwanie nazwa→KRS przez model okaże się za słabe |
| **Akcjonariat spółek giełdowych: Bankier** `bankier.pl/gielda/notowania/akcje/{TICKER}/akcjonariat` | ✅ curl zwraca HTML z danymi (Dino: Tomasz Biernacki 50,99%) | najwięksi akcjonariusze z % | scraping HTML, kruchy; traktować jako trop, a źródłem finalnym jest raport bieżący/IR spółki (model dochodzi do niego WebSearch/WebFetch) |
| **CEIDG API** | nie testowane (wymaga tokenu JWT) | JDG | rzadko potrzebne (marki jako JDG to wyjątek) |
| Strony IR spółek, ESPI, PB/Parkiet/Reuters | przez model (WebSearch/WebFetch) | pakiety akcji z datą | hierarchia źródeł z `METODOLOGIA_V2` wpisana w prompt i w self-check |

**Wniosek o tożsamości (nazwa → NIP/KRS).** Nie ma darmowego API po nazwie. Rozwiązanie:
model z WebSearch proponuje NIP/KRS głównej spółki operacyjnej w Polsce, a **kod
weryfikuje**: MF (NIP → nazwa, KRS) i KRS API (KRS → nazwa, NIP) muszą się zgadzać
ze sobą i z nazwą marki (podobieństwo nazw + `wspolnicySpzoo` ma sens). Rozjazd →
KONFLIKT „tożsamość" z listą kandydatów. Jeśli po tygodniu użycia okaże się, że model
myli spółki, dokładamy rejestr.io (60 zł/partię) albo puppeteera na wyszukiwarkę KRS.

### 4.3 Przepływ

```
wejście: lista nazw  |  kategoria (→ krok 0)  |  kolejka kandydatów z automatu treści
   │
   0. SEED (opcjonalny, model tani): kategoria → 40 nazw; dedup z bazą (slug, brand_aliases)
   │
   1. TOŻSAMOŚĆ (model + kod): nazwa → NIP/KRS kandydat → MF ↔ KRS ↔ nazwa; rozjazd = KONFLIKT
   │
   2. FAKTY REJESTROWE (kod, bez modelu):
   │     KRS OdpisAktualny + OdpisPelny (wspólnicy, historia, forma, stanZDnia)
   │     Bankier akcjonariat (jeśli spółka giełdowa)  ·  CRBR (etap 2, puppeteer)
   │
   3. ŚLEDZTWO (model średni, WebSearch/WebFetch, wynik JSON):
   │     łańcuch własności do szczytu: [{podmiot, kraj, % głosów, źródło URL, data stanu}],
   │     klasyfikacja wg drzewa V2 (reguła, która zadecydowała), luki = [DO WERYFIKACJI]
   │
   4. SAMOKONTROLA (osobny kontekst, inny prompt, może inny model):
   │     mechanicznie stosuje drzewo V2 do łańcucha z kroku 3; porównuje z faktami z kroku 2;
   │     sprawdza, czy każdy % ma źródło; wylicza pewność; niezgodność = KONFLIKT
   │
   5. OPISY (model tani, czysty kontekst): ownership_description wg wzorca KTO→JAK→STAN→NIUANS
   │     z liczbami tylko z łańcucha; business_description bez wątków właścicielskich
   │
   6. WALIDACJA W KODZIE: kody krajów, długości, em-dashe, źródła, slug, duplikaty
   │
   7. PLIK PARTII  data/robocze/automat/partia-RRRR-MM-DD.json  (+ przegląd HTML)
   │
   8. TWÓJ PRZEGLĄD: konflikty na górze; „zatwierdź wszystkie WYSOKA" jednym klikiem
   │
   9. IMPORT  node tools/firmy/import.mjs partia.json   (dry-run domyślnie, --apply zapisuje)
   │
  10. PO IMPORCIE: fetch-logos → generate-og-assets → lista nowych domen do audytu wzrokowego
```

Modele zgodnie z Twoim wymogiem: krok 3 i 4 na **Sonnet 5**, krok 0 i 5 na **Haiku 4.5**
lub Sonnet 5. Fable/Opus tylko do jednorazowego dostrojenia promptów i do ręcznych
przypadków, które sam wskażesz.

### 4.4 Rekord wyjściowy (szkic)

```json
{
  "wejscie": "Mokate",
  "status": "WYSOKA | SREDNIA | KONFLIKT",
  "konflikty": ["brak źródła dla pakietu kontrolnego", "KRS: wspólnik X ≠ ustalenie modelu"],
  "tozsamosc": { "nip": "…", "krs": "…", "nazwa_krs": "…", "forma": "S.A.", "zgodnosc_mf_krs": true },
  "rejestr": { "stan_z_dnia": "2026-08-27", "wspolnicy": [ { "nazwa": "…", "udzialy": "…", "calosc": true } ],
               "historia": [ { "wpis": 5, "wspolnik": "…" } ] },
  "lancuch": [ { "podmiot": "…", "kraj": "PL", "proc_glosow": 100, "zrodlo": "https://…", "stan_na": "2026-06" } ],
  "regula": "1 (>50% głosów)  |  2 (największy pakiet)  |  B1…B12",
  "rekord": { "name": "…", "display_name": "…", "slug": "…", "nip": "…", "krs": "…",
              "country_code": "PL", "owner_name": "…", "ownership_description": "…",
              "business_description": "…", "website_url": "…", "registry_url": "…",
              "category_slug": "…", "brands": [ { "name": "…", "domain": "…" } ] },
  "zrodla": [ { "url": "…", "tytul": "…", "data": "…", "czego_dotyczy": "…" } ],
  "verified_at": "2026-09-17",
  "decyzja": null
}
```

Do tabeli `companies` proponuję dodać dwie kolumny: `sources jsonb` i `confidence text`
(`verified_at` już jest). Bez tego źródła zostaną tylko w plikach partii. To Twoja decyzja
(pytanie w sekcji 7).

### 4.5 Reguły pewności (mechaniczne, w kodzie)

- **WYSOKA**: pakiet kontrolny potwierdzony w źródle poziomu 1–2 (KRS `wspolnicySpzoo`
  100%, raport bieżący, IR) **i** self-check zgadza się z krokiem 3 co do `country_code`
  i `owner_name` **i** żadna reguła B5/B10/B11/B12 nie została użyta.
- **ŚREDNIA**: kontrola udokumentowana tylko w mediach (poziom 3) albo łańcuch ma jedno
  ogniwo bez %, ale z jednoznacznym opisem („spółka zależna w 100%" w raporcie rocznym).
- **KONFLIKT** (zawsze do Ciebie): brak źródła dla pakietu kontrolnego; różnica między
  krokiem 3 a 4; KRS przeczy modelowi; tożsamość niejednoznaczna (kilka spółek pod
  nazwą); B5 (JV), B10 (dwie centrale), B11 (RU/BY), B12 (trwająca transakcja); kraj
  spoza słownika `lib/countries.ts`; firma już w bazie z innym `country_code`.

### 4.6 Gdzie ma działać: rekomendacja

**Lokalny skrypt ESM w `tools/firmy/` + `claude -p` (Claude Code w trybie headless)
na Twojej subskrypcji.** Uzasadnienie:

1. **Koszt zero.** Automat treści już działa na tokenie subskrypcji (`claude setup-token`);
   lokalnie `claude -p --model sonnet` używa zalogowanej sesji. Nie potrzeba klucza API
   ani osobnego billingu. Zużywa limity subskrypcji, ale partia 40 firm to rząd wielkości
   jednej dłuższej sesji pracy.
2. **Sekrety i puppeteer zostają na Twoim komputerze.** Import wymaga `service_role`
   z `.env.local`, CRBR wymaga przeglądarki. W GitHub Actions trzeba by dodać sekret
   Supabase do publicznego repo (kolejna powierzchnia ryzyka) i chrome w CI.
3. **Przegląd partii i tak jest lokalny.** Plik JSON + strona przeglądu na `localhost`.
4. **Bez zależności od `main`.** Workflow w GitHub Actions działa dopiero po scaleniu
   na `main` (patrz 0.2); lokalny skrypt działa od pierwszego commita na `develop`.
5. **Czas.** Partia 40 firm × 3–6 min pracy modelu, 3–4 firmy równolegle, to 40–80 min
   bez Twojego udziału. Limit 60 min joba w Actions byłby na styk.

Agent SDK (`@anthropic-ai/claude-agent-sdk`) to ten sam harness co `claude -p`, tylko
wywoływany z TypeScriptu. Można na niego przejść później bez zmiany projektu (prompty,
schematy JSON i walidacja zostają). Na MVP `claude -p --output-format json
--allowedTools "WebSearch,WebFetch,Read"` wystarcza i jest prostsze w debugowaniu.

Etap późniejszy: **GitHub Actions dla re-weryfikacji** (Prompt F z `PROMPTY_OPERACYJNE.md`)
na wzór automatu treści: co noc 10 najstarszych rekordów wg `verified_at`, wynik jako PR
z propozycjami zmian, tylko odczyt bazy (anon key jest publiczny, więc bez nowych sekretów).

### 4.7 Koszt na firmę i model do codziennej pracy

Cennik Anthropic (API, za 1 mln tokenów): Sonnet 5 $2 wej. / $10 wyj.; Haiku 4.5 $1 / $5;
Opus 5 $5 / $25; Fable 5.1 $10 / $50. Web search ok. $10 za 1000 wyszukiwań (do
potwierdzenia w aktualnym cenniku).

Szacunek na jedną firmę (kroki 1, 3, 4, 5 na Sonnet 5; 10–15 wyszukiwań, ~150 tys.
tokenów wejścia łącznie z pobranymi stronami, ~8 tys. wyjścia):

| Pozycja | Koszt |
|---|---|
| tokeny wejściowe ~150k × $2/M | $0,30 |
| tokeny wyjściowe ~8k × $10/M | $0,08 |
| web search ~12 × $0,01 | $0,12 |
| self-check osobno (Sonnet, ~20k/3k) | $0,07 |
| **razem, API** | **≈ $0,55–0,70 (2,2–2,8 zł)** |

Partia 40 firm przez API: ok. 25–30 $ (100–120 zł). Z Batch API (−50% na tokeny)
ok. 15–18 $. **Przez subskrypcję (`claude -p`): 0 zł dodatkowo.** Fable byłby ~5×,
Opus 5 ~2,5× droższy i nie ma powodu ich używać w rutynie; Sonnet 5 z narzuconym
drzewem decyzyjnym i self-checkiem jest wystarczający, bo decyzja i tak jest Twoja.

Rekomendacja: MVP na subskrypcji; przełącznik na klucz API (`ANTHROPIC_API_KEY`)
w skrypcie od razu, gdybyś chciał puszczać partie nocą bez otwartego Claude Code.

### 4.8 Sprawdzanie na prawdziwych danych (plan na etap 2)

Pięć firm z bazy, w tym trudne: Żabka (złota klatka + Luksemburg + trwające wezwanie
Couche-Tard = B12), LPP (polski założyciel, znaki towarowe na Cyprze i w Dubaju = B7),
Orlen (Skarb Państwa <50% = B2), Dino (założyciel 50,99%, reszta rozproszona), Biedronka
(zagraniczna grupa giełdowa z rodzinnym holdingiem). Plus trzy nowe z kolejki kandydatów
automatu treści (np. Inea/Fiberhost, Medcom, KIDS&Co.). Rozbieżności z obecnymi rekordami
opiszę w raporcie z etapu 2.

---

## 5. Treści: co uprościć

1. **Scal `develop → main`** (0.2). Bez tego nic innego nie ma znaczenia.
2. **Rytm pod Twój czas, nie pod cron.** 13 nieprzejrzanych paczek to dowód, że codziennie
   to za dużo. Propozycja: 3 paczki/tydzień (pn, śr, pt), a workflow **zamyka automatycznie
   PR-y starsze niż 14 dni** z komentarzem (nieaktualny news i tak nie nadaje się do
   publikacji). Alternatywa: jeden tygodniowy PR-digest z 3 paczkami do wyboru.
3. **Kandydaci do bazy → kolejka automatu firm.** Automat treści już wypisuje kandydatów
   w PR-ach; wystarczy, że dopisuje ich do `data/robocze/automat/kandydaci.md`, a automat
   firm bierze stamtąd wejście. Zamyka to lukę „news mówi o przejęciu, baza tego nie wie".
4. **Re-weryfikacja rekordów, o których pisze automat.** Skoro paczka jest o Żabce, w tym
   samym PR-ze powinna być propozycja aktualizacji rekordu Żabki (Prompt F). To ta sama
   praca modelu, tylko z dodatkowym plikiem wyjściowym.
5. **`generator-postow` i `komentator-x`.** Oba nieużywane od końca lipca. Paczki X/FB
   powstają teraz w automacie treści, więc `generator-postow` jest zbędny; zostawić skill,
   ale wykreślić z harmonogramu w `STRATEGIA_WZROSTU.md`. `komentator-x` wymaga Ciebie
   i Chrome, więc to narzędzie „gdy masz 15 minut", nie proces; `firmy-cache.json`
   (4 z 19 kategorii) powinien być generowany skryptem z bazy, nie ręcznie.
6. **Jakość:** dorzucić do `lint-tresci.mjs` sprawdzenie, że każda liczba z okładki
   (`staty`) występuje w tekście (dziś prompt o tym mówi, lint nie sprawdza), oraz że
   każda firma z `relatedCompanies` istnieje w bazie (zapytanie do `/api/companies/search`).
7. **SEO:** po dokończeniu ~50 najpopularniejszych marek w GSC przestać klikać ręcznie.
   Sitemapa robi resztę. Zaoszczędzone 10 min dziennie lepiej wydać na przegląd paczek.

---

## 6. Ranking pomysłów

Kryterium: (oszczędzony czas × wpływ na jakość) / nakład. Skala 1–5, posortowane od
najlepszego wyniku. Poza rankingiem, bo to nie jest pomysł, tylko obowiązek: **rotacja
klucza `service_role`** (0.1) idzie jako pierwsza niezależnie od punktów.

| # | Pomysł | Czas | Jakość | Nakład | Wynik | Uzasadnienie |
|---|---|---|---|---|---|---|
| 1 | Scalenie workflow (limit 130 tur) na `main` | 3 | 3 | 1 (XS) | 9,0 | naprawia 15 z 24 ostatnich uruchomień; jeden merge |
| 2 | Automat dodawania firm (MVP z sekcji 4) | 5 | 5 | 4 (L) | 6,3 | 4–5 h → ~45 min na partię; źródła i daty w każdym rekordzie; jedyny punkt o dużym nakładzie, ale to jest cel projektu |
| 3 | Automat treści: 3/tydzień + auto-zamykanie PR-ów starszych niż 14 dni | 3 | 2 | 1 (XS) | 6,0 | zmiana crona i 10 linii w workflow; kończy narastanie kolejki |
| 4 | Kolejka kandydatów: automat treści → automat firm | 3 | 4 | 2 (S) | 6,0 | zamyka lukę między newsem a bazą; zależy od #2 |
| 5 | Sprzątanie `tools/` i dokumentów (martwe skrypty, `ultimate_owner`→`owner_name`, SOP V2, `/firma/[id]`) | 2 | 3 | 1 (XS) | 6,0 | mniej sprzecznych instrukcji dla modeli = mniej błędów; robi się przy okazji #2 |
| 6 | Backup automatyczny (tygodniowy eksport `companies` do JSON na Drive; skrypt + Harmonogram zadań Windows) | 1 | 4 | 1 (XS) | 4,0 | 30 min pracy, chroni jedyny aktyw projektu |
| 7 | Re-weryfikacja nocna 10 najstarszych rekordów (Prompt F w Actions) | 2 | 5 | 3 (M) | 3,3 | jakość bazy w czasie; dopiero po #2, bo używa tych samych klocków |
| 8 | K1 (autoryzacja `/api/tools/upload-logo`) i K2 (40 zależności na `latest`) z audytu lipcowego | 1 | 3 | 1 (XS) | 3,0 | wciąż otwarte; osobne zadanie dla taniego modelu wg Promptu A |
| 9 | Kolumny `sources`, `confidence` w Supabase + „źródła" na profilu | 1 | 4 | 2 (S) | 2,0 | wiarygodność i ochrona prawna z `METODOLOGIA_V2`; wymaga Twojej decyzji o schemacie |
| 10 | Koniec ręcznego GSC po top 50 | 2 | 1 | 1 | 2,0 | oddaje 10 min dziennie |
| 11 | Wykreślenie `generator-postow` z rytuału, skryptowy `firmy-cache.json` | 1 | 1 | 1 | 1,0 | porządek, nie priorytet |

Kolejność wykonania, którą proponuję: **rotacja klucza → 1 → 6 → 2 (etap 2 tego
zadania) → 3 → 5 → 4 → 9 → 7**. Backup (6) przed automatem, bo automat będzie pisał
do bazy.

---

## 7. Pytania do Ciebie

1. **Czas.** Ile realnie trwa dziś partia 40 firm i który krok najdłużej? Moje szacunki
   z 1.1 to zgadywanie z dokumentów. Jak duże partie robisz (40? 25?) i jak często?
2. **`verified_at`.** Czy wszystkie 750 rekordów ma wypełnione `verified_at`, czy tylko
   część? Nie mam dostępu do bazy z tej sesji (i nie chcę czytać `.env.local`).
3. **Schemat.** Zgoda na dwie nowe kolumny `sources jsonb` i `confidence text`? Jeśli nie,
   źródła zostaną wyłącznie w plikach partii w repo.
4. **Subskrypcja czy API.** Czy automat ma chodzić na Twojej subskrypcji (`claude -p`,
   0 zł, zużywa limity), czy masz klucz API z billingiem i wolisz osobny rachunek
   (~2,5 zł/firmę)? Mogę wspierać oba, ale domyślny trzeba wybrać.
5. **rejestr.io.** Czy 0,5 zł/zapytanie (ok. 60 zł na partię) to akceptowalny wydatek,
   gdyby wyszukiwanie nazwa→KRS przez model okazało się za słabe? Na MVP go nie zakładam.
6. **CRBR w MVP.** Endpoint działa tylko z przeglądarki i zwraca PESEL-e. Wolisz, żebym
   w MVP go pominął (KRS + źródła wystarczą dla większości), a dołożył przez puppeteera
   w drugim kroku tylko dla reguły B7 (polski założyciel przez zagraniczny wehikuł)?
7. **Kategorie.** Źródłem prawdy jest tabela `categories` w Supabase (19), a `data/categories.json`
   to osobny, statyczny zbiór z polami `sources`/`verificationDate`, którego kod profili
   nie używa. Czy `categories.json` jest jeszcze do czegoś potrzebny?
8. **13 otwartych PR-ów z sierpnia.** Zamknąć hurtem, czy chcesz je jeszcze przejrzeć?
9. **Przegląd partii.** Wolisz stronę na `localhost` z przyciskami (zatwierdź/odrzuć/edytuj,
   „zatwierdź wszystkie pewne"), czy plik Markdown z checkboxami edytowany w edytorze?
   Strona jest wygodniejsza, Markdown prostszy i działa z telefonu przez GitHub.
10. **Supabase plan.** Darmowy czy Pro? Na Pro są automatyczne backupy dzienne, wtedy #4
    z rankingu spada do „sprawdź, czy włączone".

---

## 8. Sprzeczności i nieaktualności w dokumentach (do poprawienia w etapie 2)

| Gdzie | Co | Stan faktyczny |
|---|---|---|
| `CLAUDE.md` §5, `SOP` Schemat kolumn | pole `ultimate_owner` | w bazie i w `pipeline-v2.html` jest `owner_name` |
| `SOP` Krok 5 vs „Schemat kolumn" | 7 nagłówków CSV vs 10 kolumn A–J | dwa różne schematy w jednym pliku |
| `SOP` Krok 3 Master Prompt | wersja V1 („ponad 50% udziałów") | `PROMPTY_OPERACYJNE.md` Prompt B (V2: głosy, fundusze pasywne, B1–B12) ma go zastępować, SOP tego nie mówi |
| `SOP` Krok 3b | „sesja Claude / Cowork" | brak narzędzia; `porownywarka-ownership.html` robi coś innego (głosowanie) |
| `DEVELOPMENT_WORKFLOW.md` | `/firma/[id]`, „Antigravity" | routing to `/firma/[slug]`; CLAUDE.md już to prostuje |
| `METODOLOGIA_V2` §Świeżość | „dodać pole `verified_at`" | kolumna istnieje i jest wyświetlana na profilu (`app/firma/[slug]/page.tsx:166`) |
| `AUDYT_TECHNICZNY_2026-07` | K1, K2, W4, S1 jako „do zrobienia natychmiast" | K1 nadal otwarte (brak sprawdzenia klucza), K2 nadal 40 × `latest`, `npm run save` bez bezpiecznika |
| `AUTOMATYZACJA_TRESCI.md` | „75–110 tur, limit 130" | na `main` limit to 80; skutek w 0.2 |
| `STRATEGIA_WZROSTU.md` §5 | niedzielna paczka + poranne komentarze | nieaktywne od końca lipca; automat treści przejął blog+X+FB |
| `SOP_logotypy` Krok 7 | Logo Fixer „Auto z Brandfetch CDN" | działa, ale endpoint uploadu bez autoryzacji (K1) |
| `docs/social/firmy-cache.json` | indeks firm dla skilli | 4 z 19 kategorii, z 12.07 |

---

**Zatrzymuję się tutaj.** Etap 2 (MVP automatu) zaczynam po Twojej akceptacji tego
projektu i odpowiedziach na pytania 3, 4, 6 i 9, które zmieniają, co dokładnie buduję.
Punkty 0.1 i 0.2 możesz zrobić od razu, niezależnie od reszty.
