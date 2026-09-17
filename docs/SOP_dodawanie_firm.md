# SOP: dodawanie firm do bazy (Panel firm)

> **Projekt:** czypolskafirma.pl · **Wersja:** wrzesień 2026 (panel klikany zastępuje
> wiersz poleceń; ten z kolei zastąpił proces z 5 czatami i Google Sheets). Powiązane:
> `docs/METODOLOGIA_V2_przypadki_brzegowe.md` (zasady klasyfikacji), `docs/SOP_logotypy.md`
> (po imporcie), `docs/AUDYT_PROCESOW_2026-09.md` (dlaczego tak).

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

Między krokiem 2 a 3 jest **przystanek na NIP**: automat pokazuje, w jakie spółki trafił,
i czeka na Twoje potwierdzenie. Dzięki temu nie marnuje czasu i limitu zapytań na firmę
ze złym numerem. Przystanek można wyłączyć przy zakładaniu partii.

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

## 2. Jak uruchomić panel

Na pulpicie jest skrót **„CzyPolskaFirma - Panel firm"**. Dwa kliknięcia otwierają panel
w przeglądarce (`http://localhost:3010/`), bez okna terminala. Drugie kliknięcie w ikonę
nie uruchamia drugiego panelu, tylko otwiera ten, który już działa.

Panel działa wyłącznie na tym komputerze i tylko lokalnie. Musi tak być: korzysta
z subskrypcji Claude zalogowanej na tej maszynie i z klucza `service_role` do bazy.

Zamykanie: przycisk **Zamknij panel** w lewym dolnym rogu strony. Samo zamknięcie karty
przeglądarki nie zatrzymuje panelu (i nie przerywa pracy automatu, co jest celowe).

Skrót wskazuje na `tools/firmy/panel.vbs`, ten uruchamia `tools/firmy/panel.cmd`,
a ten `node tools/firmy/panel.mjs`. Gdyby skrót zginął, odtworzysz go, przeciągając
`panel.vbs` na pulpit z wciśniętym Alt (albo poproś o to model).

### Wymagania (jednorazowo)

1. **Claude Code zalogowane na subskrypcji.** W terminalu (nie w panelu) uruchom raz:

   ```bash
   claude auth login
   ```

   Panel pokazuje to na ekranie „Gotowość" jako pierwszą lampkę. Alternatywa: token
   z `claude setup-token` wpisany do `.env.local` jako `CLAUDE_CODE_OAUTH_TOKEN=...`.
   Automat wywołuje `claude -p` (tryb headless) na tej sesji; nie potrzebuje klucza API
   i nie generuje osobnych kosztów, zużywa limity subskrypcji.

2. **`.env.local`** (już jest): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (odczyt), `SUPABASE_SERVICE_ROLE_KEY` (tylko do importu).

3. **Kolumny `sources` i `confidence`** w tabeli `companies`: uruchom raz w Supabase
   SQL Editor plik `tools/sql/2026-09-17-sources-confidence.sql`. Bez nich import
   działa, ale źródła zostają tylko w pliku partii. Panel sygnalizuje brak lampką.

Żadnych innych kluczy. Rejestry (KRS, MF) są bez klucza. Rejestr beneficjentów (CRBR)
jest opcjonalny (pole „Sprawdź beneficjentów w CRBR"): automat steruje wtedy przeglądarką
(puppeteer, ok. 3 s na firmę) i zapisuje wyłącznie dane zagregowane (liczba beneficjentów,
obywatelstwa, rodzaj uprawnień, procenty), bez nazwisk i numerów PESEL. Przydaje się przy
spółkach akcyjnych niepublicznych (KRS nie pokazuje akcjonariatu, CRBR pokazuje osoby
z >25%) i przy regule B7.

---

## 3. Przebieg partii (klikany)

### Ekran 1: Gotowość

Pięć lampek: logowanie Claude, połączenie z bazą, kolumny `sources`/`confidence`, limit
zapytań do Białej Listy MF na dziś (100 na dobę, jedno zapytanie na firmę) i data
ostatniego backupu. Czerwona lampka mówi, co zrobić.

### Ekran 2: Nowa partia

Dwa tryby wejścia:

- **Wpisuję nazwy firm** — każda w osobnej linii. Jeśli znasz NIP, dopisz go po kresce:
  `Nałęczowianka | 7160001594`. Wtedy krok 1 jest pomijany.
- **Wybieram kategorię** — model proponuje N marek z kategorii, pomijając te, które
  już są w bazie.

Opcje: przystanek na NIP (domyślnie włączony), dokładniejsza kontrola (Opus zamiast
Sonneta w kroku 4), CRBR, re-weryfikacja. Pod przyciskiem widać liczbę firm, szacowany
czas i zużycie limitu MF.

Automat pracuje 2 firmy naraz, 3–6 minut na firmę.

### Ekran „Praca w toku"

Pasek postępu, lista firm z numerem kroku (1–5), szacowany czas do końca, przycisk
**Zatrzymaj** i podgląd logu („Pokaż szczegóły techniczne"). Możesz zamknąć przeglądarkę
— automat pracuje dalej. Przerwaną partię zawsze da się dokończyć: otwórz ją z „Moich
partii" i kliknij dalej.

### Ekran „Przystanek na NIP"

Tabela: marka, znaleziony NIP (pole do edycji), nazwa spółki z rejestru, wynik
sprawdzenia. Trzy stany: *zgadza się*, *do sprawdzenia* (np. nazwa marki nie występuje
w nazwie spółki, co przy spółkach-matkach jest normalne), *nie zgadza się*.

- poprawiasz numer → **Zapisz poprawki i sprawdź ponownie** (sprawdza tylko poprawione),
- odznaczasz firmę, która ma nie iść dalej,
- **Sprawdzaj dalej** uruchamia kroki 3–5.

### Ekran 3: Moje partie

Lista partii z licznikami (pewne / do obejrzenia / konflikty / zatwierdzone) i stanem.
Kliknięcie „Otwórz" prowadzi tam, gdzie trzeba: do przystanku, do pracy w toku albo
do przeglądu.

### Ekran 4: Przegląd

Konflikty na górze, z listą powodów. Przy każdej firmie: pola do edycji (kraj, właściciel,
opisy, kategoria, marki), łańcuch własności ze źródłami, dane z KRS, wynik samokontroli
z oceną każdego źródła, porównanie z obecnym rekordem (jeśli firma jest w bazie).

- **Zatwierdź wszystkie WYSOKA**: jeden przycisk w nagłówku. Zatwierdza hurtem pozycje
  pewne bez błędów walidacji.
- **Zatwierdź ŚREDNIA zgodne z bazą** (re-weryfikacja): hurtem pozycje ŚREDNIA bez
  konfliktów, u których kraj i właściciel nie zmieniły się względem obecnego rekordu.
- Konflikty i ŚREDNIA przeglądasz pojedynczo: popraw pola → **Zatwierdź**, albo
  **Odrzuć**, albo **Do poprawy** (zostaje w partii z Twoją notatką).
- Wybór kategorii jest obowiązkowy przed importem nowej firmy.

Decyzje zapisują się do pliku partii; strona nie ma dostępu do bazy.

### Ekran „Konsylium modeli" (opcjonalne, zalecane przy nowej kategorii)

Trzy kroki na jednej stronie: **Kopiuj pytanie** (z wyborem: wszystkie firmy czy tylko
niezatwierdzone) → przyciski otwierające Gemini, ChatGPT, Groka i Perplexity (najlepiej
z włączonym wyszukiwaniem) → pole, do którego wklejasz odpowiedź, i **Porównaj**.

Program dopasowuje wiersze do firm i porównuje kraj i właściciela:

- niezgoda → KONFLIKT z opisem, co model twierdzi i jakie podaje źródło; hurtowe
  zatwierdzenie tej firmy zostaje cofnięte, a firma pojawia się na dole ekranu konsylium
  w zestawieniu „moje ustalenie ↔ twierdzenie modelu",
- zgoda → notatka „konsylium: N modeli zgodnych". Zgoda innych modeli **nie podnosi**
  pewności ponad to, co dają źródła (modele mylą się razem), ale niezgoda zawsze ją obniża.

Możesz wkleić odpowiedzi kilku modeli po kolei. To zastępuje dawne porównywanie 5 tabel
na oko.

### Ekran 5: Import do bazy

**Pokaż, co się zmieni** — tabela: zielone „nowa firma", niebieskie „aktualizacja"
(z zapisem *było → jest* dla kraju i właściciela), czerwone „zablokowana" z powodem
(np. brak kategorii). Przy aktualizacji nadpisywane są tylko pola właścicielskie
i opisowe; nic nie jest kasowane.

**Zapisz do bazy** pyta o potwierdzenie, robi backup całej tabeli, a potem zapisuje
`verified_at` = dziś, `sources`, `confidence`, `brands`, `brand_aliases`. Postęp widać
w oknie logu pod tabelą.

### Ekran 6: Logotypy

- **Pobierz logotypy** — tylko dla firm, które ich nie mają.
- **Przygotuj obrazki** — obrazki OG do udostępniania w mediach społecznościowych.
- **Wyślij logotypy na podgląd** — commit i push plików `public/logos` oraz
  `public/logos-og` na gałąź `develop`. Przycisk jest aktywny tylko na `develop`
  i tylko gdy są nowe pliki. Produkcja (`main`) się nie zmienia.

Audyt wzrokowy nowych znaków: wg `docs/SOP_logotypy.md` (Logo Fixer).

### Ekran 7: Backup

Lista ostatnich kopii (Dysk Google i dysk lokalny) oraz przycisk **Zrób backup teraz**.

---

## 4. Re-weryfikacja istniejących rekordów

W „Nowej partii" zaznacz **„To firmy, które już są w bazie"** i wklej listę
`Nazwa | NIP`. W przeglądzie każda firma ma blok „Reweryfikacja rekordu": kraj,
właściciel, NIP było → jest. Każda różnica to KONFLIKT do Twojej decyzji; zatwierdzenie
i import robią UPDATE tylko pól właścicielskich i ustawiają `verified_at`.

Rytm z `METODOLOGIA_V2`: 12 miesięcy dla zwykłych firm, 6 dla giełdowych i portfelowych
PE, natychmiast po newsie o przejęciu (kandydaci z PR-ów automatu treści).

---

## 5. Tryb ręczny (bez logowania albo z innym modelem)

`--reczny` (z wiersza poleceń, patrz dodatek) zamiast wołać Claude zapisuje prompt każdego
kroku do `data/robocze/automat/reczne/<partia>/<firma>.<krok>.prompt.md`. Wklejasz go do
dowolnego modelu, odpowiedź (czysty JSON wg schematu z końca pliku) zapisujesz jako
`<firma>.<krok>.odpowiedz.json` i uruchamiasz automat ponownie z tą samą partią.
Tak działała walidacja z września 2026 (prompty wykonywał Sonnet). Ten sam mechanizm
pozwala przepuścić cały krok przez Gemini czy GPT, jeśli chcesz porównać modele
na poziomie śledztwa, a nie tylko werdyktu.

---

## 6. Backup bazy (niezależnie od importu)

Poza przyciskiem w panelu backup robi się sam: zadanie „CzyPolskaFirma backup bazy"
w Harmonogramie zadań Windows uruchamia w niedziele o 10:00 (albo przy najbliższym
włączeniu komputera) `tools/firmy/backup-tygodniowy.cmd`, który zapisuje plik na
`G:\Mój dysk\zapisy supabase czypolskafirma` (log: `data/robocze/backup/backup.log`).
Podgląd: Harmonogram zadań → Biblioteka → „CzyPolskaFirma backup bazy".

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
| Ikona z pulpitu nic nie robi | uruchom `tools/firmy/panel.cmd` dwuklikiem — pokaże błąd w oknie terminala |
| Panel otwiera się, ale lampka „Claude" jest czerwona | `claude auth login` w terminalu, albo token w `.env.local` |
| Firma kończy z „błąd: timeout" | otwórz partię ponownie i kliknij dalej; krok śledztwa ma 25 min limitu |
| MF: „HTTP 429" albo blokada | limit 100 zapytań/dobę wyczerpany; poczekaj do północy (partia 40 firm to 40 zapytań) |
| KRS: „brak podmiotu (404)" | zły numer KRS z kroku 1 albo podmiot spoza rejestru przedsiębiorców; popraw NIP na przystanku i sprawdź ponownie |
| Wszystko ląduje w KONFLIKT | sprawdź, czy śledztwo zwraca źródła (pole `lancuch[].zrodlo_url`); bez źródeł pewność nie może być wyższa |
| Import: „column companies.sources does not exist" | uruchom `tools/sql/2026-09-17-sources-confidence.sql` |
| „Automat już pracuje" | trwa inna partia; zatrzymaj ją na ekranie „Praca w toku" albo poczekaj |

Pliki: `tools/firmy/panel.mjs` + `panel.html` (panel), `panel.vbs` i `panel.cmd`
(uruchamianie z pulpitu), `automat.mjs` (przebieg), `lib/prompty.mjs` (prompty
i metodologia w wersji dla modelu), `lib/walidacja.mjs` (reguły pewności),
`lib/rejestry.mjs` (KRS, MF, Bankier, licznik zapytań), `lib/przeglad-api.mjs`
(decyzje i konsylium), `lib/import-lib.mjs` (plan i zapis importu), `przeglad.mjs`
+ `przeglad.html` (osobna strona przeglądu), `import.mjs`, `backup.mjs`.

Stare narzędzia `tools/porownywarka-*.html` i `tools/weryfikator-nip.html` zostają jako
doraźne; `tools/pipeline-v2.html` usunięto (miał wpisany klucz service_role).

---

## Dodatek: to samo z wiersza poleceń

Panel tylko klika w te same skrypty. Gdy potrzeba czegoś nietypowego (tryb ręczny,
inne modele, `--przelicz`), działa dotychczasowy sposób:

```bash
node tools/firmy/automat.mjs --firmy "Mokate, Wedel, Vila" --partia 2026-09-20
node tools/firmy/automat.mjs --plik data/robocze/automat/kandydaci.txt --partia 2026-09-20
node tools/firmy/automat.mjs --kategoria kosmetyki --seed 40
node tools/firmy/automat.mjs --partia 2026-09-20 --stop-po-nip     # przystanek na NIP
node tools/firmy/przeglad.mjs --partia 2026-09-20                  # sam przegląd
node tools/firmy/import.mjs --partia 2026-09-20                    # próbnie
node tools/firmy/import.mjs --partia 2026-09-20 --apply            # zapis
node tools/firmy/backup.mjs --do "G:\Mój dysk\zapisy supabase czypolskafirma"
node tools/fetch-logos.mjs
node tools/generate-og-assets.mjs logos
```

Opcje automatu: `--rownolegle N`, `--model-kontrola opus`, `--reweryfikacja`, `--reczny`,
`--bez-gieldy`, `--crbr`, `--tylko-rejestry`, `--przelicz`, `--stop-po-nip`.
Panel na innym porcie: `node tools/firmy/panel.mjs --port 3011 --bez-przegladarki`.
