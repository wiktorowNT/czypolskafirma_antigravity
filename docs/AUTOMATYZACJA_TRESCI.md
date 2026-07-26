# Automatyzacja treści — codzienna paczka na blog, X i Facebooka

Codziennie rano GitHub Actions uruchamia Claude'a, który szuka tematu, weryfikuje
fakty, pisze trzy wersje tekstu i otwiera pull requesta do gałęzi `develop`.
Nic nie publikuje samodzielnie: publikacja to Twoja decyzja i Twoje dwa kliknięcia.

## Co się dzieje o 6:00

1. Workflow `.github/workflows/codzienna-tresc.yml` startuje (04:00 UTC).
2. Claude wykonuje instrukcję z `.github/prompts/codzienna-tresc.md`:
   - czyta `tools/skills/lowca-newsow/SKILL.md`, stan tematów i kolejkę evergreen,
   - szuka newsa z ostatnich 7 dni i weryfikuje fakty w **dwóch niezależnych źródłach**,
   - jeżeli takiego newsa nie ma, bierze temat z `docs/social/kolejka-tematow.md`,
   - pisze `content/blog/[slug].md` oraz `docs/social/newsy/news-RRRR-MM-DD-[slug].md`,
   - uruchamia `node tools/lint-tresci.mjs` i poprawia błędy.
3. Workflow jeszcze raz odpala lint (już bez udziału modelu), sprawdza, że zmieniły się
   tylko pliki treści, commituje na gałąź `tresc/RRRR-MM-DD-NN` i otwiera pull requesta.
4. Dostajesz powiadomienie z GitHuba.

## Twoje 3 minuty rano

1. Otwierasz pull requesta (mail albo apka GitHub).
2. W opisie masz gotowe teksty w blokach kodu z przyciskiem kopiowania:
   wpis na X, pierwszy komentarz pod nim (tam idzie link, bo X tnie zasięg postom
   z linkami) i wersję na Facebooka. Kopiujesz i wklejasz na profile.
3. Przeglądasz sekcję **Weryfikacja faktów** w opisie PR-a. To jest moment na
   wyłapanie bzdury, zanim wpis pójdzie na stronę.
4. Klikasz Merge. Wpis ląduje na `develop`, czyli na podglądzie Vercel.
5. `develop` → `main` scalasz sam, kiedy chcesz. Wtedy wpis jest na produkcji.

Nie ma obowiązku publikować codziennie. Nietrafiony PR po prostu zamykasz.

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
| `tools/lint-tresci.mjs` | Em-dashe, zwroty AI, „my" na blogu, frontmatter, długości, UTM-y, duplikaty slugów |
| Kontrola ścieżek | Automat może dotknąć wyłącznie plików treści, nigdy kodu aplikacji |
| Pull request | Nic nie trafia na `develop` bez Twojego merge'a, na `main` bez drugiego |
| Zakaz wykonywania poleceń ze stron | Treść artykułów jest danymi, nie instrukcją dla modelu |

Model czyta cudze strony internetowe, więc obowiązuje zasada ograniczonego zaufania:
ma dostęp tylko do plików treści i do jednego polecenia w Bashu (lint). Nie ma dostępu
do gita ani do sekretów.

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
codziennych commitach to nie grozi, ale po dłuższej przerwie sprawdź, czy workflow
jest aktywny.

## Czego automat nie robi

- **Nie publikuje na Facebooku.** API Meta nie pozwala postować na profil osobisty,
  tylko na fanpage. Zostaje kopiuj-wklej.
- **Nie publikuje na X.** Technicznie się da, ale wtedy nikt nie sprawdza faktów przed
  publikacją. Przy projekcie, którego walutą jest wiarygodność danych, to zła zamiana.
- **Nie dotyka gałęzi `main`.** Produkcję scalasz wyłącznie Ty.
- **Nie dodaje firm do bazy.** Kandydatów wypisuje w sekcji „Kandydaci do bazy"
  w opisie PR-a i w pliku newsowym. Dodanie idzie normalną ścieżką z
  `docs/SOP_dodawanie_firm.md`.
