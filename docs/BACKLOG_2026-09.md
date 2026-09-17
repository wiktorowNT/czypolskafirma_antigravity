# Backlog po audycie i automacie firm (stan na 2026-09-17)

> Lista zadań do zlecenia dowolnemu modelowi (Sonnet/Opus w Claude Code, także innym).
> Każde zadanie jest samodzielne: ma kontekst, pliki, kryteria odbioru. Zasady wspólne
> na dole. Stan projektu: `docs/AUDYT_PROCESOW_2026-09.md` (diagnoza),
> `docs/SOP_dodawanie_firm.md` (jak działa automat), `docs/AUTOMAT_FIRM_walidacja_2026-09.md`
> (wyniki testu), `CLAUDE.md` (zasady pracy, obowiązują zawsze).

## Zasady wspólne dla każdego zadania (wklej do promptu)

```text
Pracujesz w repo czypolskafirma. Najpierw przeczytaj CLAUDE.md i przestrzegaj go bezwzględnie:
- praca wyłącznie na gałęzi develop; nigdy nie commituj ani nie merguj na main,
- nie czytaj i nie wypisuj .env.local ani żadnych kluczy,
- przed większą zmianą przedstaw krótki plan i poczekaj na moją akceptację,
- commituj tylko pliki, które sam zmieniłeś (git add konkretnych ścieżek, nigdy git add .
  ani npm run save), i tylko gdy powiem "zacommituj",
- w repo może równolegle pracować inna sesja; nie ruszaj docs/design/, docs/prompty-fable/,
  tools/render-makiety.mjs, .claude/launch.json,
- nowe skrypty: ESM .mjs w tools/; treści po polsku; bez em-dashy w treściach serwisu.
Zadanie: [WKLEJ PUNKT Z BACKLOGU]
```

Modele: do zadań 1–4, 6, 8, 9 wystarczy Sonnet. Zadanie 5 (re-weryfikacja w Actions)
i 7 (przegląd tożsamości) lepiej na Opusie albo Sonnecie z dokładnym planem.

---

## Zadania dla Ciebie (bez modelu)

**A. Napraw rekord Mokate.** Partia `proba-mokate` już istnieje. W terminalu w katalogu projektu:
`node tools/firmy/przeglad.mjs --partia proba-mokate` → http://localhost:3007 → Zatwierdź →
`node tools/firmy/import.mjs --partia proba-mokate` (próbnie) →
`node tools/firmy/import.mjs --partia proba-mokate --apply`.

**B. Żabka.** Baza ma GB, automat proponuje JE, kontrola mówi, że kraj GP jest słabo
udokumentowany. Wezwanie Couche-Tard rozlicza się na przełomie IX/X 2026, potem Żabka to CA.
Najprościej: re-weryfikacja w październiku (`--reweryfikacja`, lista `Żabka | 5223071241`).

**C. Pierwsza prawdziwa partia** wg `docs/SOP_dodawanie_firm.md`, sekcja 3, z konsylium
w Gemini/ChatGPT. Po 2–3 partiach zdecyduj o punkcie 9 poniżej.

**D. Kontrola w niedzielę:** czy `companies-RRRR-MM-DD.json` pojawił się na
`G:\Mój dysk\zapisy supabase czypolskafirma` (zadanie „CzyPolskaFirma backup bazy").

**E. Kontrola jutro rano:** czy automat treści (Actions → Codzienna treść) przeszedł na zielono
po scaleniu limitu 130 tur na `main`.

---

## Zadania do zlecenia modelom

### 1. Automat treści: 3 paczki tygodniowo i auto-zamykanie starych PR-ów
**Po co:** 13 nieprzejrzanych paczek z sierpnia pokazało, że codziennie to za dużo.
**Pliki:** `.github/workflows/codzienna-tresc.yml`, `docs/AUTOMATYZACJA_TRESCI.md`.
**Co zrobić:** (a) cron `0 4 * * 1,3,5` (pon, śr, pt); (b) nowy krok na początku joba, który
przez `gh pr list --state open --search "Paczka na"` zamyka PR-y automatu starsze niż 14 dni
z komentarzem „nieaktualna paczka, zamknięta automatycznie" i kasuje ich gałęzie;
(c) zaktualizuj opis w `docs/AUTOMATYZACJA_TRESCI.md` (sekcje „Co się dzieje o 6:00"
i „Bezpieczniki"). Uwaga: workflow działa dopiero po scaleniu na `main`, o czym napisz
w podsumowaniu.
**Odbiór:** `gh workflow view` pokazuje nowy cron; ręczne uruchomienie z `tryb=evergreen`
przechodzi; stare PR-y (>14 dni) zamykają się.

### 2. Kolejka kandydatów: automat treści → automat firm
**Po co:** automat treści wypisuje „Kandydatów do bazy" w każdym PR-ze, ale nikt ich nie zbiera.
**Pliki:** `.github/prompts/codzienna-tresc.md` (krok 4: dozwolone ścieżki, krok 6: opis PR-a),
`.github/workflows/codzienna-tresc.yml` (lista dozwolonych ścieżek w kroku „Sprawdź, czy
automat nie ruszył cudzych plików" i w `git add`), `tools/firmy/automat.mjs`.
**Co zrobić:** (a) automat treści dopisuje kandydatów do `data/robocze/automat/kandydaci.txt`
w formacie `Nazwa | NIP jeśli znany | # skąd (slug wpisu)`; pomija nazwy już obecne w pliku
i w bazie (może sprawdzić przez `https://czypolskafirma.pl/api/companies/search?q=`);
(b) `automat.mjs --kandydaci` czyta ten plik, bierze niezrobione pozycje i oznacza je
w pliku po przetworzeniu (`- [x]` albo przeniesienie do sekcji „przetworzone").
**Odbiór:** ręczny run workflow zostawia wpis w `kandydaci.txt`; `node tools/firmy/automat.mjs
--kandydaci --partia test` tworzy partię z tych firm.

### 3. Kategoria „edukacja" i brakujące pola z KRS
**Pliki:** tabela `categories` w Supabase (SQL do wklejenia przez właściciela),
`data/categories.json` tylko jeśli okaże się używany, `tools/firmy/lib/rekord.mjs`.
**Co zrobić:** (a) przygotuj `tools/sql/2026-09-xx-kategoria-edukacja.sql` (insert do
`categories`: name, slug `edukacja`, icon jak inne kategorie; sprawdź kolumny w istniejących
wierszach); (b) w `rekord.mjs` wypełniaj `founded_at` z `rejestr.dataRejestracji` (format
DD.MM.RRRR → RRRR-MM-DD) i `adres` z `tozsamosc.mf.adres`, jeśli puste; (c) w
`import.mjs` dopisz `founded_at` i `adres` do `POLA_INSERT` (nie do UPDATE).
**Odbiór:** `node tools/firmy/automat.mjs --partia walidacja --reczny --przelicz` daje
rekordy z `founded_at`; import próbny pokazuje pole.

### 4. Audyt lipcowy: K1 i K2
**Pliki:** `app/api/tools/upload-logo/route.ts`, `package.json`, `package-lock.json`.
Opis: `docs/AUDYT_TECHNICZNY_2026-07.md` (plik jest w .gitignore, leży lokalnie).
**Co zrobić:** (a) K1: `POST` odrzuca żądanie bez nagłówka `x-admin-key` równego
`ADMIN_SECRET_KEY`, a w produkcji (`NODE_ENV=production`) bez tej zmiennej zwraca 404;
odrzucaj SVG zawierające `<script`, `onload=`, `javascript:`; zaktualizuj
`app/narzedzia/logo-fixer/page.tsx`, żeby wysyłał nagłówek (wartość z
`NEXT_PUBLIC_`… nie, z prompta użytkownika w UI albo z env po stronie serwera, do ustalenia
w planie); (b) K2: zamień `"latest"` w `package.json` na wersje z `package-lock.json`
z prefiksem `^`. Nie aktualizuj wersji, tylko przypnij.
**Odbiór:** `npm run lint` i `npm run build` przechodzą; upload bez nagłówka dostaje 401.

### 5. Nocna re-weryfikacja w GitHub Actions
**Po co:** struktury się zmieniają, `verified_at` jest puste dla większości rekordów.
**Pliki:** nowy `.github/workflows/reweryfikacja.yml` na wzór `codzienna-tresc.yml`,
`tools/firmy/automat.mjs` (flaga `--najstarsze N`: wybiera N firm z bazy o najstarszym lub
pustym `verified_at`, priorytet: spółki giełdowe i portfelowe PE, czyli `ownership_type`
`korporacja_gieldowa`/`fundusz_pe_vc`), `tools/firmy/lib/claude.mjs` (w Actions używa
`CLAUDE_CODE_OAUTH_TOKEN` z sekretu, już obsługiwane).
**Co zrobić:** workflow co noc uruchamia `automat.mjs --najstarsze 10 --reweryfikacja
--partia rew-RRRR-MM-DD` (bez `--crbr`, bez puppeteera), a potem otwiera PR do `develop`
z plikiem partii i tabelą w opisie: firma, było → jest, status, konflikty. Import nadal
lokalny, przez właściciela. Sekrety w Actions: tylko `CLAUDE_CODE_OAUTH_TOKEN` (już jest);
odczyt bazy kluczem publicznym `NEXT_PUBLIC_SUPABASE_ANON_KEY` jako zmienna repo (to klucz
publiczny, jest w bundlu strony). Timeout joba 60 min, `--rownolegle 2`.
**Odbiór:** ręczne uruchomienie tworzy PR z partią; `node tools/firmy/przeglad.mjs --partia
rew-...` otwiera ją lokalnie po `git pull`.

### 6. Koniec ręcznego GSC po top 50
**Pliki:** `docs/seo-kolejka-indeksacji.md`, pamięć projektu (`seo-kolejka-indeksacji`).
**Co zrobić:** dopisz w nagłówku pliku regułę: po 50 zgłoszonych markach koniec ręcznych
zgłoszeń, resztę robi sitemapa; zostaw log. Zadanie jednominutowe.

### 7. Przegląd bazy pod kątem błędów tożsamości (jak Mokate)
**Po co:** NIP Mokate wskazywał spółkę e-commerce zamiast operatora marki; mogą być inne.
**Pliki:** `tools/firmy/automat.mjs` (tryb `--tylko-rejestry`), `tools/firmy/lib/rekord.mjs`
(lista słów spółek celowych: E-COM, ONLINE, LOGISTY, NIERUCHOMO, SERWIS, FINANC, LEASING,
DYSTRYBUC, INVESTMENT, HOLDING).
**Co zrobić:** (a) wygeneruj listę `Nazwa | NIP` wszystkich 750 firm z bazy
(`indeksFirm()` w `tools/firmy/lib/supabase.mjs`); (b) uruchom automat w `--tylko-rejestry`
partiami po 100 (limit MF: 100 zapytań/dobę po 30 NIP-ów, KRS ok. 1 zapytanie/s, więc
750 firm to ok. 15–20 min); (c) raport `docs/PRZEGLAD_TOZSAMOSCI_2026-xx.md`: firmy, których
nazwa KRS wygląda na spółkę celową, firmy z NIP-em wykreślonym lub nieistniejącym w MF,
firmy, których NIP wg KRS różni się od NIP w bazie. Bez zmian w bazie: raport do decyzji
właściciela, potem partia `--reweryfikacja` bez NIP-ów dla podejrzanych.
**Odbiór:** raport z liczbami i listą; żadnych zapisów do Supabase.

### 8. Skill `generator-postow` i `komentator-x`: aktualizacja opisów
**Pliki:** `tools/skills/generator-postow/SKILL.md`, `tools/skills/komentator-x/SKILL.md`,
`docs/social/firmy-cache.json`.
**Co zrobić:** (a) w obu skillach dopisz na górze, że rytuał tygodniowy przejął automat
treści (`docs/STRATEGIA_WZROSTU.md` v3), skille są do użycia doraźnego; (b) zamień ręczny
`firmy-cache.json` (4 z 19 kategorii) na skrypt `tools/social/buduj-cache-firm.mjs`, który
generuje go z bazy (`indeksFirm()`), i podepnij w SKILL.md.
**Odbiór:** skrypt generuje plik z 750 firmami; skille czytają go bez zmian formatu.

### 9. Dostrojenie automatu po 2–3 partiach (dopiero gdy właściciel poda obserwacje)
**Pliki:** `tools/firmy/lib/walidacja.mjs` (funkcja `ocenPewnosc`), `tools/firmy/lib/prompty.mjs`
(prompt kontroli), `tools/firmy/przeglad.mjs` (`/api/zatwierdz-pewne`).
**Opcje do decyzji właściciela:** (a) hurtowe zatwierdzanie ŚREDNIA także dla nowych firm,
gdy zero konfliktów; (b) łagodniejsza kontrola: ŚREDNIA tylko przy braku źródła dla pakietu
kontrolnego, nie przy braku daty „stan na"; (c) czy `--crbr` ma być domyślnie włączone
(3 s na firmę, wymaga Chrome z puppeteera). W walidacji z 17.09 żadna z 8 firm nie dostała
WYSOKA; jeśli po 3 partiach to się powtarza, zastosuj (b).

---

## Rzeczy, których nie ruszać bez potrzeby

- Klucze Supabase zrotowane 17.09.2026 (nowy format `sb_publishable_`/`sb_secret_`);
  legacy JWT wyłączone. Stare klucze `eyJ...` w historii gita są martwe.
- `verified_at`, `sources`, `confidence` wypełnia tylko automat; nie uzupełniaj ręcznie
  bez źródeł.
- `data/robocze/automat/partia-*.json` to artefakty robocze; `reczne/` i `backup/` są poza
  gitem.
