# SOP: dodawanie firm do bazy (automat `tools/firmy/`)

> **Projekt:** czypolskafirma.pl · **Wersja:** wrzesień 2026 (zastępuje proces z 5 czatami
> i Google Sheets). Powiązane: `docs/METODOLOGIA_V2_przypadki_brzegowe.md` (zasady
> klasyfikacji), `docs/SOP_logotypy.md` (po imporcie), `docs/AUDYT_PROCESOW_2026-09.md`
> (dlaczego tak).

Zasada nadrzędna: **automat proponuje, Ty zatwierdzasz.** Nic nie trafia do tabeli
`companies` bez Twojej decyzji. Każde ustalenie właścicielskie ma źródło z datą. Brak
źródła dla pakietu kontrolnego to KONFLIKT, który rozstrzygasz sam.

---

## 1. Co robi automat

Dla każdej firmy z listy (albo z kategorii) wykonuje pięć kroków i zapisuje wynik do pliku
partii `data/robocze/automat/partia-<nazwa>.json`:

| Krok | Kto | Co |
|---|---|---|
| 1. Tożsamość | model (Sonnet, WebSearch) + kod | nazwa marki → NIP i KRS głównej spółki operacyjnej; kod sprawdza NIP w Białej Liście MF i w KRS: nazwy i numery muszą się zgadzać, inaczej KONFLIKT „tożsamość" |
| 2. Rejestry | kod | odpis aktualny KRS (forma, kapitał, wspólnicy, jedyny akcjonariusz, akcje uprzywilejowane), odpis pełny (historia wspólników z datami), akcjonariat z bankier.pl dla spółek z GPW |
| 3. Śledztwo | model (Sonnet, WebSearch/WebFetch) | łańcuch własności do szczytu, każde ogniwo z % głosów, źródłem i datą; klasyfikacja wg drzewa V2 z podaniem reguły; historia; luki |
| 4. Samokontrola | model (osobny kontekst, WebFetch) | mechanicznie stosuje drzewo do łańcucha z kroku 3, pobiera cytowane źródła i sprawdza, czy potwierdzają tezę; sprawdza zgodność z KRS |
| 5. Opisy | model (Sonnet, WebFetch strony firmy) | `ownership_description` (KTO → JAK → STAN → NIUANS, liczby tylko z łańcucha), `business_description`, `display_name`, marki, kategoria |

Potem kod waliduje rekord (kody krajów ze słownika, długości, em-dashe, slug, duplikaty)
i wylicza pewność:

- **WYSOKA**: pakiet kontrolny potwierdzony źródłem poziomu 1–2 (KRS, raport spółki,
  strona IR) i samokontrola zgodna, bez reguł B5/B10/B11/B12.
- **ŚREDNIA**: kontrola udokumentowana tylko w mediach albo drobne luki.
- **KONFLIKT**: brak źródła kontroli, niezgoda między śledztwem a kontrolą, KRS przeczy
  modelowi, tożsamość niejednoznaczna, trwająca transakcja, kraj spoza słownika, firma
  już w bazie z innym krajem, niezgoda innego modelu z konsylium.

Dane rejestrowe pobiera kod, nie model. Model dostaje je jako fakty i nie może ich zmienić.
Treści stron internetowych są dla modelu danymi, nie poleceniami.

---

## 2. Wymagania (jednorazowo)

1. **Claude Code zalogowane na subskrypcji.** W terminalu (nie w apce) uruchom raz:

   ```bash
   claude auth login
   ```

   Sprawdzenie: `claude auth status` ma pokazać `"loggedIn": true`. Alternatywa: token
   z `claude setup-token` wpisany do `.env.local` jako `CLAUDE_CODE_OAUTH_TOKEN=...`.
   Automat wywołuje `claude -p` (tryb headless) na tej sesji; nie potrzebuje klucza API
   i nie generuje osobnych kosztów, zużywa limity subskrypcji.

2. **`.env.local`** (już jest): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (odczyt), `SUPABASE_SERVICE_ROLE_KEY` (tylko do importu).

3. **Kolumny `sources` i `confidence`** w tabeli `companies`: uruchom raz w Supabase
   SQL Editor plik `tools/sql/2026-09-17-sources-confidence.sql`. Bez nich import
   działa, ale źródła zostają tylko w pliku partii.

Żadnych innych kluczy. Rejestry (KRS, MF) są bez klucza. Rejestr beneficjentów (CRBR)
nie jest używany w tej wersji (endpoint działa tylko z przeglądarki i zwraca dane osobowe).

---

## 3. Przebieg partii

### Krok A: uruchom automat

Z listy nazw (przecinki) albo z pliku (jedna nazwa na linię, opcjonalnie `Nazwa | NIP`):

```bash
node tools/firmy/automat.mjs --firmy "Mokate, Wedel, Vila" --partia 2026-09-20
```

```bash
node tools/firmy/automat.mjs --plik data/robocze/automat/kandydaci.txt --partia 2026-09-20
```

Z kategorii (model proponuje 40 marek, pomijając te, które już są w bazie):

```bash
node tools/firmy/automat.mjs --kategoria kosmetyki --seed 40
```

Automat pracuje 2 firmy naraz (`--rownolegle 3` przyspiesza), 3–6 minut na firmę.
Możesz go przerwać i uruchomić ponownie z `--partia <nazwa>`: kontynuuje od miejsca,
w którym skończył. Modele: domyślnie Sonnet do wszystkiego; `--model-kontrola opus`
daje mocniejszą samokontrolę na trudnych partiach.

Na końcu wypisuje podsumowanie (ile WYSOKA / ŚREDNIA / KONFLIKT) i statystykę tokenów.

### Krok B: przegląd w przeglądarce

```bash
node tools/firmy/przeglad.mjs --partia 2026-09-20
```

Otwórz http://localhost:3007/. Konflikty są na górze, z listą powodów. Przy każdej firmie:
pola do edycji (kraj, właściciel, opisy, kategoria, marki), łańcuch własności ze źródłami,
dane z KRS, wynik samokontroli z oceną każdego źródła, porównanie z obecnym rekordem
(jeśli firma jest w bazie).

- **Zatwierdź wszystkie WYSOKA**: jeden przycisk w nagłówku. Zatwierdza hurtem pozycje
  pewne bez błędów walidacji.
- Konflikty i ŚREDNIA przeglądasz pojedynczo: popraw pola → **Zatwierdź**, albo
  **Odrzuć**, albo **Do poprawy** (zostaje w partii z Twoją notatką).
- Wybór kategorii jest obowiązkowy przed importem nowej firmy.

Decyzje zapisują się do pliku partii; strona nie ma dostępu do bazy.

### Krok C: konsylium innych modeli (opcjonalne, zalecane przy nowej kategorii)

W nagłówku przeglądu: **Konsylium innych modeli** → **Kopiuj prompt**. Wklej prompt do
Gemini, ChatGPT, Groka lub Perplexity (najlepiej z włączonym wyszukiwaniem). Odpowiedź
modelu (tabela Markdown) wklej z powrotem z jego nazwą i kliknij **Porównaj**.

Program dopasowuje wiersze do firm i porównuje kraj i właściciela:

- niezgoda → KONFLIKT z opisem, co model twierdzi i jakie podaje źródło; hurtowe
  zatwierdzenie tej firmy zostaje cofnięte,
- zgoda → notatka „konsylium: N modeli zgodnych". Zgoda innych modeli **nie podnosi**
  pewności ponad to, co dają źródła (modele mylą się razem), ale niezgoda zawsze ją obniża.

Możesz wkleić odpowiedzi kilku modeli po kolei. To zastępuje dawne porównywanie 5 tabel
na oko.

### Krok D: import (próbnie, potem naprawdę)

```bash
node tools/firmy/import.mjs --partia 2026-09-20
```

Tryb próbny pokazuje każdy rekord: INSERT (nowa firma) albo UPDATE (firma istnieje po NIP
lub slugu; nadpisywane są tylko pola właścicielskie i opisowe, nic nie jest kasowane),
plus błędy walidacji, które blokują dany rekord. Gdy lista wygląda dobrze:

```bash
node tools/firmy/import.mjs --partia 2026-09-20 --apply
```

Przed zapisem robi backup całej tabeli do `data/robocze/backup/companies-<data>.json`
(pomijanie: `--bez-backupu`, niezalecane). Zapisuje `verified_at` = dziś, `sources`,
`confidence`, `brands`, `brand_aliases`.

### Krok E: logotypy i publikacja

```bash
node tools/fetch-logos.mjs
```

```bash
node tools/generate-og-assets.mjs logos
```

Dalej wg `docs/SOP_logotypy.md` (audyt wzrokowy tylko nowych domen). Commit
`public/logos` i `public/logos-og` na `develop`, jak dotąd.

---

## 4. Re-weryfikacja istniejących rekordów

Ten sam automat, z flagą `--reweryfikacja` i listą `Nazwa | NIP`:

```bash
node tools/firmy/automat.mjs --plik data/robocze/automat/do-reweryfikacji.txt --partia rew-2026-10 --reweryfikacja
```

W przeglądzie każda firma ma blok „Reweryfikacja rekordu": kraj, właściciel, NIP
było → jest. Każda różnica to KONFLIKT do Twojej decyzji; zatwierdzenie i import robią
UPDATE tylko pól właścicielskich i ustawiają `verified_at`.

Rytm z `METODOLOGIA_V2`: 12 miesięcy dla zwykłych firm, 6 dla giełdowych i portfelowych
PE, natychmiast po newsie o przejęciu (kandydaci z PR-ów automatu treści).

---

## 5. Tryb ręczny (bez logowania albo z innym modelem)

`--reczny` zamiast wołać Claude zapisuje prompt każdego kroku do
`data/robocze/automat/reczne/<partia>/<firma>.<krok>.prompt.md`. Wklejasz go do dowolnego
modelu, odpowiedź (czysty JSON wg schematu z końca pliku) zapisujesz jako
`<firma>.<krok>.odpowiedz.json` i uruchamiasz automat ponownie z tą samą `--partia`.
Tak działała walidacja z września 2026 (prompty wykonywał Sonnet). Ten sam mechanizm
pozwala przepuścić cały krok przez Gemini czy GPT, jeśli chcesz porównać modele
na poziomie śledztwa, a nie tylko werdyktu.

---

## 6. Backup bazy (niezależnie od importu)

```bash
node tools/firmy/backup.mjs --do "G:\Mój dysk\zapisy supabase czypolskafirma"
```

Eksport `companies` + `categories` do JSON z datą. Warto wpiąć w Harmonogram zadań
Windows raz w tygodniu (plan darmowy Supabase nie robi backupów).

---

## 7. Wzorzec opisu właścicielskiego (do oceny w przeglądzie)

3–5 zdań: **KTO** kontroluje (z % głosów) → **JAK** do tego doszło (rok założenia,
przejęcia, IPO, strony transakcji) → **STAN OBECNY** (free float, pakiety mniejszościowe,
wehikuły pośrednie z krajem rejestracji) → **NIUANS** (franczyza, fundusz, Skarb Państwa,
holding w Luksemburgu). Ton suchy, liczby zamiast przymiotników, żadnych em-dashy.

Wzór (Biedronka): „Sieć Biedronka należy do portugalskiej grupy Jerónimo Martins, obecnej
w Polsce od 1995 roku. Jej operator, Jeronimo Martins Polska S.A., jest spółką zależną
notowanego w Lizbonie koncernu Jerónimo Martins SGPS S.A. Największym akcjonariuszem
koncernu (ok. 56% akcji) jest holding Sociedade Francisco Manuel dos Santos, kontrolowany
przez rodzinę Soares dos Santos. Polska to największy rynek grupy."

---

## 8. Gdy coś nie działa

| Objaw | Co zrobić |
|---|---|
| „Claude Code nie jest zalogowane" | `claude auth login` w terminalu, albo token w `.env.local`; awaryjnie `--reczny` |
| Firma kończy z „błąd: timeout" | uruchom ponownie z `--partia`; krok śledztwa ma 25 min limitu |
| MF: „HTTP 429" albo blokada | limit 100 zapytań/dobę wyczerpany; poczekaj do północy (partia 40 firm to 40 zapytań) |
| KRS: „brak podmiotu (404)" | zły numer KRS z kroku 1 albo podmiot spoza rejestru przedsiębiorców; popraw NIP w pliku listy (`Nazwa | NIP`) i uruchom ponownie |
| Wszystko ląduje w KONFLIKT | sprawdź, czy śledztwo zwraca źródła (pole `lancuch[].zrodlo_url`); bez źródeł pewność nie może być wyższa |
| Import: „column companies.sources does not exist" | uruchom `tools/sql/2026-09-17-sources-confidence.sql` |

Pliki: `tools/firmy/automat.mjs` (przebieg), `lib/prompty.mjs` (prompty i metodologia
w wersji dla modelu), `lib/walidacja.mjs` (reguły pewności), `lib/rejestry.mjs` (KRS, MF,
Bankier), `przeglad.mjs` + `przeglad.html` (strona przeglądu), `import.mjs`, `backup.mjs`.

Stare narzędzia `tools/porownywarka-*.html` i `tools/weryfikator-nip.html` zostają jako
doraźne; `tools/pipeline-v2.html` usunięto (miał wpisany klucz service_role).
