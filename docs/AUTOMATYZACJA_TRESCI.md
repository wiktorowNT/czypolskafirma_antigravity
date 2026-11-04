# Automatyzacja treści — paczka na blog, X i Facebooka (pon, śr, pt)

W poniedziałki, środy i piątki rano GitHub Actions uruchamia Claude'a, który szuka tematu, weryfikuje
fakty, pisze trzy wersje tekstu i otwiera pull requesta do gałęzi `develop`.
Nic nie publikuje samodzielnie: publikacja to Twoja decyzja i Twoje dwa kliknięcia.

## Co się dzieje o 6:00 (pon, śr, pt)

Rytm trzy razy w tygodniu zamiast codziennie, bo nieprzejrzane paczki piętrzyły się
szybciej, niż dało się je czytać. Nazwa workflow („Codzienna treść”) została dla ciągłości.

1. Workflow `.github/workflows/codzienna-tresc.yml` startuje (04:00 UTC, cron `0 4 * * 1,3,5`).
2. Wybiera otwarte paczki automatu starsze niż 14 dni (autor `github-actions`, gałąź `tresc/*`)
   i zbiera z ich opisów sekcje „Kandydaci do bazy”.
3. Claude wykonuje instrukcję z `.github/prompts/codzienna-tresc.md`:
   - czyta `tools/skills/lowca-newsow/SKILL.md`, stan tematów i kolejkę evergreen,
   - szuka newsa z ostatnich 7 dni i weryfikuje fakty w **dwóch niezależnych źródłach**,
   - jeżeli takiego newsa nie ma, bierze temat z `docs/social/kolejka-tematow.md`,
   - pisze `content/blog/[slug].md` oraz `docs/social/newsy/news-RRRR-MM-DD-[slug].md`,
   - renderuje okładkę wpisu do `public/images/blog/[slug].png` i wpina ją we frontmatter,
   - dopisuje kandydatów do bazy (z dzisiejszej paczki i ze starych) do kolejki
     `data/robocze/automat/kandydaci.txt`, pomijając te, które już są w pliku albo w bazie,
   - uruchamia `node tools/lint-tresci.mjs` i poprawia błędy.
4. Workflow jeszcze raz odpala lint (już bez udziału modelu), sprawdza, że zmieniły się
   tylko pliki treści, commituje na gałąź `tresc/RRRR-MM-DD-NN` i otwiera pull requesta.
5. Jeżeli dzisiejszy PR powstał, zamyka stare paczki z komentarzem „Nieaktualna paczka,
   zamknięta automatycznie” i kasuje ich gałęzie. Jeżeli nie powstał (np. „BRAK MATERIAŁU”),
   stare zostają otwarte do następnego przebiegu, żeby ich kandydaci nie przepadli.
6. Dostajesz powiadomienie z GitHuba.

## Twoje 3 minuty rano

1. Otwierasz pull requesta (mail albo apka GitHub).
2. W opisie masz gotowe teksty w blokach kodu z przyciskiem kopiowania:
   wpis na X, pierwszy komentarz pod nim (tam idzie link, bo X tnie zasięg postom
   z linkami) i wersję na Facebooka. Kopiujesz i wklejasz na profile.
3. Przeglądasz sekcję **Weryfikacja faktów** w opisie PR-a. To jest moment na
   wyłapanie bzdury, zanim wpis pójdzie na stronę.
4. Klikasz Merge. Wpis ląduje na `develop`, czyli na podglądzie Vercel.
5. `develop` → `main` scalasz sam, kiedy chcesz. Wtedy wpis jest na produkcji.

Nie ma obowiązku publikować każdej paczki. Nietrafiony PR po prostu zamykasz, a ten,
którego nie ruszysz przez 14 dni, automat zamknie sam.

## Kolejka kandydatów do bazy

Plik `data/robocze/automat/kandydaci.txt`, jedna marka na linię:

```text
- [ ] Marka | NIP (puste, gdy nieznany) | # paczka 2026-10-17 (slug-wpisu)
```

Dopisuje go automat treści (trafia na `develop` razem z mergem paczki). Kandydaci
z paczek zamykanych po 14 dniach przechodzą do kolejki w kolejnej paczce, więc nie
przepadają. Kandydaci z PR-a, który zamkniesz ręcznie, nie są ratowani: jeśli są tam
warte uwagi marki, dopisz je do pliku sam.

Kolejkę przerabia automat firm:

```bash
node tools/firmy/automat.mjs --kandydaci --partia 2026-10-20-kandydaci
```

Bierze wszystkie nieodhaczone pozycje (albo `--kandydaci 10`, czyli 10 pierwszych),
markę już obecną w bazie odhacza z dopiskiem `→ już w bazie`, resztę dodaje do partii
i odhacza z dopiskiem `→ partia NAZWA (data)`. Dalej partia idzie normalną ścieżką
z `docs/SOP_dodawanie_firm.md`. Zmieniony plik kolejki commitujesz razem z resztą.

Kilka otwartych paczek dopisuje się na koniec tego samego pliku, więc przy scalaniu
kilku naraz GitHub może zgłosić konflikt w `kandydaci.txt` (tak jak w `stan-newsow.json`).
Rozwiązanie: zostawić linie z obu stron.

## Uruchomienie ręczne i wymuszony temat

Zakładka **Actions → Codzienna treść → Run workflow**. Do wyboru:

- `tryb`: `auto` (news, a jak nie ma to evergreen), `news` (tylko news), `evergreen`
  (tylko analiza z kolejki),
- `temat`: nazwa firmy, wydarzenie albo link do artykułu. Puste = automat wybiera sam.

## Konfiguracja (jednorazowo)

1. **Token do Claude'a.** `setup-token` to komenda CLI Claude Code, nie aplikacji
   okienkowej. Jeżeli CLI nie ma w systemie (sprawdzenie: `claude --version` zwraca
   błąd), najpierw instalacja, w PowerShellu albo Terminalu Windows:

   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

   Potem w **nowym** oknie terminala, żeby złapało PATH:

   ```bash
   claude setup-token
   ```

   Otworzy się przeglądarka z logowaniem do konta Claude, a terminal wypisze token
   zaczynający się od `sk-ant-oat...`. Token pochodzi z subskrypcji Claude, więc
   automat nie generuje osobnych kosztów. Zużywa za to limit subskrypcji, tak samo
   jak praca w Claude Code.

   Token jest poświadczeniem do konta: trafia wyłącznie do sekretu w GitHubie,
   nigdy do plików w repo, do czatu ani do zgłoszeń.

2. **Sekret w repozytorium.** GitHub → Settings → Secrets and variables → Actions →
   New repository secret. Nazwa: `CLAUDE_CODE_OAUTH_TOKEN`, wartość: token z punktu 1.
   Nie wklejaj tokenu nigdzie indziej, w szczególności nie do plików w repo.

3. **Zgoda na tworzenie PR-ów przez Actions.** GitHub → Settings → Actions → General →
   Workflow permissions → zaznacz „Allow GitHub Actions to create and approve pull
   requests". Bez tego krok tworzenia PR-a wywali się na braku uprawnień.

4. **Plik workflow musi trafić na `main`.** GitHub uruchamia harmonogramy (`schedule`)
   i pokazuje przycisk „Run workflow" wyłącznie dla workflowów z gałęzi domyślnej,
   a domyślną gałęzią tego repozytorium jest `main`. Dopóki `.github/workflows/codzienna-tresc.yml`
   siedzi tylko na `develop`, nic się nie odpali. Scalasz to normalną ścieżką:
   `develop` → sprawdzenie podglądu → `main`.

   To nie łamie zasady „produkcja to `main`". Workflow po starcie robi checkout
   gałęzi `develop`, pisze na `develop` i otwiera pull requesta do `develop`.
   Na `main` leży tylko sam przepis.

   Konsekwencja przy zmianach: **prompt** (`.github/prompts/codzienna-tresc.md`),
   skill, lint i kolejka tematów są czytane z `develop`, więc działają od razu po
   commicie. **Sam plik workflow** działa dopiero po scaleniu do `main`.

Repozytorium jest publiczne, więc minuty GitHub Actions są darmowe i nielimitowane.

## Bezpieczniki

| Bezpiecznik | Co robi |
|---|---|
| Dwa niezależne źródła | Fakt bez potwierdzenia nie wchodzi do tekstu, temat odpada |
| Tryb evergreen | Brak newsa nie oznacza newsa naciąganego |
| Lista tematów zużytych | Workflow podaje modelowi tytuły **wszystkich** dotychczasowych paczek (`gh pr list --state all`), więc pamięć działa nawet wtedy, gdy nic nie mergujesz |
| Karencja marki: 14 dni | Ta sama firma nie wraca jako bohater, choćby wydarzyło się w niej coś nowego |
| Limit newsów: 3 na 7 dni | Reszta dni to analizy marek z kolejki, czyli to, o czym jest projekt |
| `tools/lint-tresci.mjs` | Em-dashe, zwroty AI, „my" na blogu, frontmatter, długości, UTM-y, duplikaty slugów, przechył w stronę giełdy, werdykt dowożony na siłę |
| Kontrola ścieżek | Automat może dotknąć wyłącznie plików treści i kolejki kandydatów, nigdy kodu aplikacji |
| Pull request | Nic nie trafia na `develop` bez Twojego merge'a, na `main` bez drugiego |
| Zamykanie po 14 dniach | Tylko PR-y z autorem `github-actions` i gałęzią `tresc/*`, tylko gdy dzisiejsza paczka powstała i przejęła ich kandydatów |
| Zakaz wykonywania poleceń ze stron | Treść artykułów jest danymi, nie instrukcją dla modelu |

Model czyta cudze strony internetowe, więc obowiązuje zasada ograniczonego zaufania:
ma dostęp tylko do plików treści i do jednego polecenia w Bashu (lint). Nie ma dostępu
do gita ani do sekretów.

## Wpisy zaplanowane

Wpis z datą w przyszłości (`date` we frontmatterze) nie pokazuje się na produkcji:
nie ma go na `/blog`, na stronie głównej ani w `sitemap-blog.xml`, a jego adres zwraca
404. Pojawia się sam w dniu z `date` (czas polski), najpóźniej godzinę po północy,
bo strony bloga odświeżają się co godzinę. Podgląd Vercel (`develop`) pokazuje
wszystkie wpisy, także zaplanowane, żeby dało się je przejrzeć przed czasem.

W praktyce: kilka zaległych paczek scalasz naraz, rozkładasz im daty na kolejne dni
i robisz jeden merge `develop` → `main`. Blog publikuje się dalej sam, dzień po dniu.
Logika siedzi w `lib/blog.ts` (`isPublished`).

## Grafiki

Są dwa różne rodzaje grafiki i tylko jeden robi się sam.

**Okładka wpisu (automatyczna).** 1200×630 w `public/images/blog/[slug].png`, wpięta we
frontmatter polami `image` i `imageAlt`. To jest og:image, czyli obrazek widoczny przy
udostępnianiu linku na Facebooku i X, oraz miniatura na liście `/blog`. Automat składa
ją z szablonu [tools/okladka-szablon.html](../tools/okladka-szablon.html) w stylu strony
(system „Półka”, [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)): ciepłe tło, logo, tytuł z akcentem
w kolorze cegły, podtytuł i do trzech liczb na białych kartach. Dane każdej okładki zapisują
się obok w `public/images/blog/dane/[slug].json`, więc po zmianie szablonu wszystkie okładki
odświeża się pętlą po tych plikach (polecenie w nagłówku skryptu).

Ręcznie robi się to tak samo, jednym poleceniem:

```bash
node tools/okladka-wpisu.mjs dane.json
```

Format `dane.json` jest opisany w nagłówku [tools/okladka-wpisu.mjs](../tools/okladka-wpisu.mjs).
Wygląd zmienia się w szablonie HTML, bez dotykania skryptu. Font Manrope ładuje się
z Google Fonts, żeby render na Twoim Windowsie i na runnerze wychodził tak samo.

**Obrazek do posta na X i Facebooka (ręczny).** Automat go nie tworzy, podaje tylko
pomysł w linijce „Grafika:" na górze pliku newsowego, np. oś czasu albo wykres kursu.
Post można też wrzucić bez grafiki, wtedy przy linku i tak zaciągnie się okładka wpisu.

## Lint lokalnie

```bash
node tools/lint-tresci.mjs
```

Bez argumentów sprawdza pliki zmienione względem HEAD. Można podać ścieżki:

```bash
node tools/lint-tresci.mjs content/blog/nowy-wpis.md
```

Ostrzeżenia nie blokują publikacji, błędy tak. Progi i listy zakazanych zwrotów są
na górze skryptu, można je swobodnie stroić.

## Kiedy coś nie działa

- **Job czerwony na kroku „Napisz treści"** — najczęściej wygasły albo zły
  `CLAUDE_CODE_OAUTH_TOKEN`. Wygeneruj token jeszcze raz i podmień sekret.
- **Czerwony na „Lint treści"** — model nie doczytał poprawek. Log pokazuje dokładnie,
  co jest nie tak. Można uruchomić workflow ponownie.
- **Czerwony na „Otwórz pull requesta"** — sprawdź zgodę z punktu 3 konfiguracji.
- **Ostrzeżenie „BRAK MATERIAŁU"** — automat świadomie nic nie napisał (np. strona nie
  odpowiadała). Powód jest w logu. Uruchom ręcznie z trybem `evergreen`.
- **Wyłączenie na jakiś czas** — Actions → Codzienna treść → menu „…" → Disable workflow.

GitHub wyłącza harmonogramy w repozytoriach bez aktywności przez 60 dni. Przy
regularnych commitach to nie grozi, ale po dłuższej przerwie sprawdź, czy workflow
jest aktywny.

## Czego automat nie robi

- **Nie publikuje na Facebooku.** API Meta nie pozwala postować na profil osobisty,
  tylko na fanpage. Zostaje kopiuj-wklej.
- **Nie publikuje na X.** Technicznie się da, ale wtedy nikt nie sprawdza faktów przed
  publikacją. Przy projekcie, którego walutą jest wiarygodność danych, to zła zamiana.
- **Nie dotyka gałęzi `main`.** Produkcję scalasz wyłącznie Ty.
- **Nie dodaje firm do bazy.** Kandydatów wypisuje w sekcji „Kandydaci do bazy"
  w opisie PR-a i dopisuje do kolejki `data/robocze/automat/kandydaci.txt`. Dodanie
  idzie normalną ścieżką z `docs/SOP_dodawanie_firm.md` (`automat.mjs --kandydaci`).

---

# Nocna re-weryfikacja bazy (codziennie)

> **Wyłączona 2026-11-04 decyzją właściciela.** W repo nie ma zmiennych
> `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sekcja „Konfiguracja"
> niżej), więc harmonogram `schedule` w `reweryfikacja.yml` jest zakomentowany. Skrypty
> działają, opis poniżej jest aktualny. Żeby włączyć: dodaj obie zmienne, odkomentuj
> `schedule` i scal na `main`.

Drugi automat w tym samym repozytorium: `.github/workflows/reweryfikacja.yml`. Nie pisze
treści, tylko pilnuje, żeby baza nie starzała się po cichu. Co noc bierze z Supabase
35 firm o najstarszym (albo pustym) `verified_at`, przechodzi je automatem w trybie
re-weryfikacji i otwiera pull requesta do `develop` z plikiem partii i tabelą „było → jest".

Po co: struktury właścicielskie realnie się zmieniają. Deutsche Telekom przejął Fiberhost
i Ineę, Grupa Pracuj przejęła No Fluff Jobs, Polenergia zniknęła z giełdy, a wezwanie
Couche-Tard na Żabkę rozliczyło się na przełomie września i października 2026. Bez cyklu
odświeżania baza jest coraz mniej prawdziwa, a to jest cały majątek projektu.

## Skala: dlaczego 35 firm na noc

Przy 1555 firmach w bazie:

| Firm na noc | Pełny cykl | Najstarszy rekord | MF (limit 100/dobę) | KRS | Czas joba (2 naraz) |
|---|---|---|---|---|---|
| 10 (pierwotny pomysł z backlogu, liczony dla bazy 750 firm) | 185 nocy, 6,1 mies. | 183 dni | 1 zapytanie | 20 | 15-30 min |
| 26 | 74 nocy, 2,4 mies. | 78 dni | 1 zapytanie | 52 | 39-78 min |
| 30 | 64 nocy, 2,1 mies. | 70 dni | 1 zapytanie | 60 | 45-90 min |
| **35** | **55 nocy, 1,8 mies.** | **63 dni** | **2 zapytania** | **70** | **53-105 min** |
| 40 | 49 nocy, 1,6 mies. | 59 dni | 2 zapytania | 80 | 60-120 min |

„Pełny cykl" to liczba nocy, po których automat dotknął każdej firmy w bazie choć raz;
„najstarszy rekord" to najgorszy wiek rekordu w stanie ustalonym, już po pierwszym obejściu.
Liczby z symulacji kolejki na syntetycznej bazie 1555 firm o rozkładzie jak dziś
(ok. 70% rekordów bez `verified_at`, ok. 30% typów priorytetowych).

Wybrane jest **35**: 1,8 miesiąca mieści się w celu 1,5-2 miesięcy i zostawia zapas czasu
w jobie. 40 firm na noc też się mieści i jest naturalnym następnym krokiem, gdy będą znane
prawdziwe czasy przebiegów (pole `ile` przy uruchomieniu ręcznym pozwala to sprawdzić
bez zmiany pliku).

Wąskim gardłem **nie są** rejestry. Biała Lista MF pozwala na 100 zapytań po 30 NIP-ów
na dobę, a numery firm z kolejki są znane z bazy, więc automat sprawdza je zbiorczo:
35 firm to **2 zapytania ze 100** (sprawdzone na udawanej bazie 1555 firm). API KRS znosi
ok. 1 zapytanie na sekundę, a `lib/rejestry.mjs` sam trzyma odstęp 1,1 s; 2 odpisy na firmę
to 70 zapytań, czyli ok. 80 sekund czekania w całym przebiegu.

Wąskim gardłem jest **model**: 3-6 minut na firmę przy dwóch firmach naraz. Stąd limit
czasu joba 180 minut, z zapasem na wolniejsze odpisy i ponowienia. Drugie, mniej widoczne
ograniczenie to **limit subskrypcji Claude**, wspólny z automatem treści. Dlatego
re-weryfikacja startuje o 22:00 UTC, a treść o 4:00 UTC: nie nachodzą na siebie.

## Kolejka: kto idzie pierwszy

Sortowanie po „wieku" rekordu, czyli po liczbie dni od `verified_at`. Puste `verified_at`
to rekord nigdy nie weryfikowany i idzie na samą górę. Typy własności, w których zmiany
są najczęstsze (`korporacja_gieldowa`, `fundusz_pe_vc`), dostają **premię 30 dni**: spółka
giełdowa sprawdzona miesiąc temu konkuruje z firmą rodzinną sprawdzoną dwa miesiące temu.

Premia musi być wyraźnie mniejsza od naturalnego cyklu (1555 / 35 = 45 nocy). Powyżej tej
granicy typy priorytetowe wracają na wierzch, zanim kolejka obejdzie resztę bazy, i ogon
kolejki głodzi. Symulacja na 1555 firmach: przy premii 30 dni pełny cykl to 55 nocy
i najstarszy rekord 63 dni, przy premii 90 dni już 105 nocy i 123 dni. Zmieniasz liczbę
firm na noc? Sprawdź tę zależność ponownie (stała `PREMIA_DNI` w `tools/firmy/lib/supabase.mjs`).

Rekordy bez poprawnego NIP-u automat pomija: nie da się ich re-weryfikować „z numeru",
a szukanie numeru modelem jest wolne i niepewne. To materiał dla
`tools/firmy/przeglad-tozsamosci.mjs`, nie dla nocnego automatu.

## Co się dzieje w nocy

1. Checkout `develop`, Node 22, globalna instalacja Claude Code CLI. **Bez `npm ci`**:
   automat w tym trybie stoi na samym Node, a puppeteer jest potrzebny tylko dla `--crbr`
   i importowany leniwie. Oszczędza to kilka minut i ok. 150 MB Chrome'a na przebieg.
2. Wybór starych, nieprzejrzanych partii do zamknięcia (ponad 14 dni).
3. **Firmy w toku.** `firmy-w-toku.mjs` zbiera slugi z partii czekających na import
   (otwarte PR-y `rew/*` i partie scalone na `develop`, z ostatnich 21 dni). Te firmy nie
   wchodzą do dzisiejszej partii. Jeśli czekają już **3** nieprzejrzane partie, nocny
   przebieg kończy się bez sprawdzania czegokolwiek (ręczne uruchomienie to pomija).
4. `automat.mjs --najstarsze 35 --pomin .tmp/pomin.txt --reweryfikacja --rownolegle 2 --partia rew-RRRR-MM-DD`.
   Bez `--crbr`, bez puppeteera. Kroki 1-5 jak przy nowych firmach, tylko NIP jest znany
   z bazy, więc model nie szuka numeru.
5. `raport-reweryfikacji.mjs` buduje opis PR-a z pliku partii: podsumowanie, tabela zmian
   („było → jest" dla kraju i właściciela), konflikty, firmy bez zmian i te, które nie
   doszły do rekordu.
6. Kontrola ścieżek, commit **wyłącznie** pliku partii, pull request do `develop`.
7. Zamknięcie starych partii z komentarzem.

## Twoje 5 minut

```bash
git pull
```

```bash
node tools/firmy/przeglad.mjs --partia rew-RRRR-MM-DD
```

Przegląd na http://localhost:3007. Przy re-weryfikacji przydaje się przycisk
**Zatwierdź ŚREDNIA zgodne z bazą**: pozycje, które tylko potwierdzają obecny rekord,
odhaczasz hurtem, a czytasz uważnie te ze zmianą kraju albo właściciela. Potem:

```bash
node tools/firmy/import.mjs --partia rew-RRRR-MM-DD
```

```bash
node tools/firmy/import.mjs --partia rew-RRRR-MM-DD --apply
```

Import odświeża `verified_at`, czyli dokładnie to, po co ten workflow istnieje. **Dopóki
nie zaimportujesz, firma ma stary `verified_at`.** Przez 21 dni od powstania partii automat
jej nie rusza (krok „Firmy w toku"), więc kolejne noce biorą następne firmy z kolejki zamiast
powtarzać te same. Partia niezaimportowana przez 21 dni przestaje blokować swoje firmy
i wracają do kolejki. Nic nie przepada.

Gdy uzbierają się **3** nieprzejrzane partie, nocne przebiegi stają, dopóki którejś nie
przejrzysz, scalisz albo zamkniesz (najstarsze zamykają się same po 14 dniach). To celowe:
każdy przebieg to 35 firm pracy modelu na Twoim limicie subskrypcji Claude, a partia, której
nikt nie importuje, nie odświeża bazy.

## Konfiguracja (jednorazowo)

1. **Sekret `CLAUDE_CODE_OAUTH_TOKEN`**: ten sam, co dla automatu treści. Już jest,
   nic nie trzeba robić.
2. **Zmienne repozytorium.** Settings → Secrets and variables → Actions → zakładka
   **Variables** (nie Secrets) → New repository variable:
   - `NEXT_PUBLIC_SUPABASE_URL`: adres projektu Supabase,
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: klucz publiczny.

   Oba są publiczne: leżą w bundlu strony, każdy je widzi w przeglądarce. Dlatego zmienne,
   nie sekrety. Job czyta nimi bazę i **nie zna** `SUPABASE_SERVICE_ROLE_KEY`, więc
   technicznie nie jest w stanie nic zapisać.
3. **Zgoda na tworzenie PR-ów przez Actions**: ta sama, co dla automatu treści
   (Settings → Actions → General → „Allow GitHub Actions to create and approve pull requests").
4. **Plik workflow musi trafić na `main`.** Tak samo jak przy automacie treści: GitHub
   uruchamia `schedule` i pokazuje „Run workflow" wyłącznie dla workflowów z gałęzi
   domyślnej. Dopóki `.github/workflows/reweryfikacja.yml` siedzi tylko na `develop`,
   **nic się nie odpali**. Po starcie job robi checkout `develop`, pisze na `develop`
   i otwiera PR do `develop`; na `main` leży tylko przepis.

   Skrypty (`automat.mjs`, `raport-reweryfikacji.mjs`, `lib/supabase.mjs`) są czytane
   z `develop`, więc działają od razu po commicie. Sam plik workflow dopiero po scaleniu.

## Uruchomienie ręczne

Actions → **Nocna re-weryfikacja** → Run workflow. Dwa pola:

- **ile**: liczba firm w tej partii (domyślnie 35). Do próby wystarczy `3`.
- **firmy**: konkretne marki po przecinku, np. `Żabka, Wedel`. Pomija kolejkę i sprawdza
  dokładnie te marki. Tak najprościej dociągnąć jedną firmę po newsie o przejęciu.

## Bezpieczniki

| Bezpiecznik | Co robi |
|---|---|
| Brak klucza zapisu | Job zna tylko klucz publiczny; zapis do bazy wymaga `SUPABASE_SERVICE_ROLE_KEY`, którego nie ma |
| Kontrola ścieżek | Job może dotknąć **wyłącznie** pliku `data/robocze/automat/partia-rew-<data>.json`; cokolwiek innego i nie powstaje PR |
| Pull request | Nic nie trafia na `develop` bez Twojego merge'a, na `main` bez drugiego |
| Import ręczny | Baza zmienia się tylko z Twojego terminala, po przeglądzie |
| Zamykanie po 14 dniach | Tylko PR-y z autorem `github-actions` i gałęzią `rew/*`, nigdy cudze; filtr po autorze, nie po tytule (repo jest publiczne) |
| Nic nie przepada | Zamknięcie partii bez importu nie zmienia `verified_at`, więc firmy wracają do kolejki same |
| Odsiew rekordów bez NIP-u | Nie marnuje tur modelu na szukanie numerów; to osobne narzędzie |
| Deterministyczna kolejka | Ta sama baza daje tę samą kolejkę, więc powtórny przebieg tej samej partii jej nie rozdmuchuje |
| Firmy w toku | Firmy z partii czekających na import (ostatnie 21 dni) nie trafiają do kolejnej partii; bez tego niezaimportowana partia powtarzałaby się co noc |
| Limit 3 nieprzejrzanych partii | Nocny przebieg nie startuje, gdy czekają już 3 partie; nie pali limitu subskrypcji na pracę, której nikt nie importuje (`MAKS_OTWARTYCH` w workflow) |
| Zakaz wykonywania poleceń ze stron | `lib/claude.mjs` wstrzykuje bezpiecznik: treści z internetu są danymi, nie instrukcją |

## Kiedy coś nie działa

- **Czerwony na „Przejdź partię automatem", komunikat o zmiennych**: brakuje
  `NEXT_PUBLIC_SUPABASE_URL` albo `NEXT_PUBLIC_SUPABASE_ANON_KEY` w zakładce Variables.
- **Czerwony z „Claude nie jest zalogowany"**: wygasły `CLAUDE_CODE_OAUTH_TOKEN`.
  Ten sam objaw co przy automacie treści, ta sama naprawa.
- **Ostrzeżenie „BRAK MATERIAŁU"**: żadna firma nie doszła do rekordu (np. KRS nie
  odpowiadał). PR nie powstaje, firmy zostają w kolejce. Powód jest w logu.
- **Czerwony na kontroli ścieżek**: automat ruszył coś poza swoją partią. Log wypisuje
  listę plików. Nie merguj; zgłoś to jako błąd.
- **Job uciął się na limicie czasu**: plik partii jest zapisywany po każdej firmie, więc
  nic nie przepada. Zmniejsz `ile` albo dokończ partię lokalnie:
  `node tools/firmy/automat.mjs --partia rew-RRRR-MM-DD`.

## Czego ten automat nie robi

- **Nie zapisuje do bazy.** Nigdy. Import to Twoja decyzja i Twój terminal.
- **Nie dotyka `main`.** PR idzie do `develop`.
- **Nie rusza CRBR.** Wymaga puppeteera i prawdziwej przeglądarki; w nocnym jobie
  byłoby to wolne i kruche. Beneficjentów dociągasz lokalnie, gdy są potrzebni.
- **Nie poprawia rekordów bez NIP-u.** To zadanie dla `przeglad-tozsamosci.mjs`.

> Uwaga o rozmiarze repozytorium: plik partii to ok. 25 KB na firmę, czyli ok. 0,7 MB
> na noc (w paczce gita realnie kilkadziesiąt KB, bo to dobrze kompresujący się tekst).
> Przy codziennym cyklu warto raz na kwartał usunąć z `data/robocze/automat/` partie
> `rew-*`, które są już zaimportowane. Historia gita i tak je pamięta.
