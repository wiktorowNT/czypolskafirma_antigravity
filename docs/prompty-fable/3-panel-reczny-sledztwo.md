# Zadanie: Panel firm jako przewodnik po pracy ręcznej (śledztwo w czatach, nie w automacie)

> Przekazanie z sesji 17–19.09.2026. Czytasz to w nowej rozmowie. Zacznij od `CLAUDE.md`,
> potem ten plik. **Zanim napiszesz kod: przedstaw plan w punktach i poczekaj na akceptację
> Wiktora** (zasada projektu).

## 1. Dlaczego zmiana

Wiktor jest na planie **Claude Pro**. Automat `tools/firmy/automat.mjs` robi dla każdej firmy
osobne śledztwo agentowe (`claude -p` z WebSearch/WebFetch: tożsamość, śledztwo, samokontrola,
opisy — 4 wywołania na firmę). Na Pro to się nie spina:

- pierwsza partia 25 firm: **18 mln tokenów na sam krok 1** (potem krok 1 poprawiony do ~250 tys./firmę),
- we wrześniu konto przekroczyło **dopłaty ponad abonament (€72,63 / €72)** i doszło do **84% limitu tygodniowego**,
- śledztwo 13 firm padło natychmiast na limicie („monthly spend limit”), bez wyniku.

Wiktor wcześniej robił to ręcznie: jeden prompt z listą wielu firm wklejany do czatów
(Gemini, ChatGPT, Claude.ai), porównanie odpowiedzi — ok. 20% limitu 5h na całość. **Chce wrócić do
tej metody, ale uporządkowanej przez panel**: panel ma prowadzić krok po kroku, generować prompty,
przyjmować wklejone odpowiedzi, porównywać, pilnować rejestrów i importu. **Praca modeli odbywa się
poza panelem, w zwykłych czatach na subskrypcjach.**

Wiktor nie jest programistą: wszystko ma być klikane, po polsku, z jasną ścieżką.

## 2. Zasady tej pracy (twarde)

- **Domyślna ścieżka nie wywołuje żadnego modelu z kodu** (`claude -p`, Gemini API). Zero.
  Automatyczny Claude zostaje tylko jako świadomy wybór dla pojedynczej trudnej firmy, z
  ostrzeżeniem o koszcie przed uruchomieniem.
- **Testy bez wywołań modeli.** Na kopii partii (`cp partia-X.json partia-test-kopia.json`), panel
  testowy na porcie 3011 (`node tools/firmy/panel.mjs --port 3011 --bez-przegladarki`), puppeteer
  do klikania i zrzutów. Po teście sprzątnij kopię i zatrzymaj proces. Każde wywołanie modelu —
  najpierw zapytaj Wiktora i podaj szacunek kosztu.
- **Oszczędzaj kontekst tej sesji**: czytaj fragmenty plików (grep, offset), nie całe duże pliki.
- Gałąź `develop`, commit po każdym logicznym kroku, push na `develop`. Nie ruszaj `.env.local`.
- Rejestry (Biała Lista MF, KRS, CRBR, bankier) są darmowe i liczone kodem — to zostaje.

## 3. Stan obecny (develop, 19.09.2026)

Pliki (wszystko w `tools/firmy/`):

| Plik | Co robi |
|---|---|
| `panel.mjs` + `panel.html` | panel lokalny (port 3010), skrót na pulpicie → `panel.vbs` → `panel.cmd` |
| `automat.mjs` | przebieg partii; `--stop-po-nip` zatrzymuje po krokach 1–2; gdy wszystkie firmy mają `nipPodany`, nie wymaga logowania Claude (same rejestry) |
| `lib/rejestry.mjs` | MF (licznik 100/dobę w `mf-licznik.json`), KRS odpis aktualny + historia, bankier |
| `lib/crbr.mjs` | beneficjenci (puppeteer, tylko dane zagregowane) |
| `lib/prompty.mjs` | prompty i schematy per firma: `promptSledztwo/Kontrola/Opisy`, `SCHEMAT_SLEDZTWO/KONTROLA/OPISY`, `promptKonsylium` — **źródło metodologii w wersji dla modelu, reużyj** |
| `lib/rekord.mjs` | `zlozRekord(f, {kategorie, dzisiaj})` składa rekord z `f.tozsamosc`, `f.rejestr`, `f.sledztwo`, `f.kontrola`, `f.opisy` i liczy status |
| `lib/walidacja.mjs` | reguły pewności WYSOKA/ŚREDNIA/KONFLIKT, słownik krajów |
| `lib/przeglad-api.mjs` | decyzje przeglądu + konsylium (`parsujKonsylium` — tolerancyjny parser tabel Markdown) |
| `lib/import-lib.mjs` | plan importu i zapis (dopasowanie po slug/id; po NIP tylko gdy zgadza się marka — jedna spółka może mieć kilka marek) |
| `lib/gemini.mjs` | Gemini API — **na darmowym kluczu brak wyszukiwania Google (429), Gemini CLI zablokowany na kontach prywatnych**; zostaw, nie rozwijaj |

Ekrany panelu: Gotowość (lampki, przycisk „Zaloguj Claude”), Nowa partia (blok „Numery NIP z
Gemini” — kopiuj polecenie → wklej odpowiedź), Praca w toku (postęp, licznik zużycia), Przystanek
na NIP (wybór przy każdej firmie: Idzie dalej / Szukaj ponownie / Pomiń; blok Gemini zapisuje
numery od razu jako `nipPodany`), Moje partie, Przegląd (ramka z `przeglad.html`), Konsylium
(kopiuj pytanie → wklej odpowiedź innego modelu → porównanie), Import, Logotypy, Backup.

Wzorzec do skopiowania: **blok „Numery NIP z Gemini” w `panel.html`** (`promptGemini`,
`parsujGemini`, `data-gemini-*`) i **konsylium** — to jest dokładnie ten styl pracy, którego chce Wiktor.

## 4. Co zbudować

### Etap A — ścieżka i przystanek

1. Pasek „ścieżki” na górze ekranów partii: *1. Lista firm → 2. NIP-y (Gemini) → 3. Rejestry →
   4. Śledztwo (czaty) → 5. Porównanie → 6. Przegląd → 7. Import → 8. Logotypy*, z zaznaczonym
   bieżącym krokiem i tym, co jest do zrobienia.
2. Przystanek na NIP: „Sprawdzaj dalej” **nie uruchamia już automatu Claude** — przechodzi do
   ekranu śledztwa ręcznego. Stary przebieg automatyczny tylko jako osobny, opisany kosztem przycisk.

### Etap B — ekran „Śledztwo w czatach”

1. **Prompt zbiorczy** dla paczki firm (paczki po ~8, żeby odpowiedź zmieściła się w czacie; lista
   paczek z przyciskiem „Kopiuj paczkę 1/3” itd.). Dla każdej firmy prompt zawiera fakty, które kod
   już ma za darmo: marka, NIP, KRS, nazwa spółki, wspólnicy / jedyny akcjonariusz z odpisu, skrót
   historii wspólników, akcjonariat z GPW, dane CRBR (zagregowane). Dzięki temu model w czacie nie
   szuka rejestrów, tylko ustala szczyt piramidy i pisze opisy.
2. Metodologia w prompcie: skrót z `promptSledztwo` + `promptOpisy` (Zasada Ostatecznego
   Właściciela, Efektywnej Kontroli, Złotej Klatki, raje podatkowe pomijane, każde ogniwo z % głosów,
   źródłem URL i datą; wzorzec opisu KTO → JAK → STAN → NIUANS; bez em-dashy).
3. **Format odpowiedzi**: jeden blok JSON (tablica, jeden obiekt na firmę), pola zgodne z tym, czego
   potrzebuje `zlozRekord`: `marka`, `country_code`, `ostateczny_wlasciciel`, `regula`,
   `lancuch[]` (podmiot, kraj, rola, proc_glosow, zrodlo_url, zrodlo_tytul, stan_na), `luki[]`,
   `ownership_description`, `business_description`, `display_name`, `kategoria`, `marki`.
   Sprawdź w `lib/rekord.mjs` i schematach, jakich dokładnie nazw pól oczekuje kod — dopasuj
   format odpowiedzi do nich zamiast przepisywać `zlozRekord`.
4. Przyciski „Otwórz Gemini / ChatGPT / Claude.ai”; pole „Wklej odpowiedź” + wybór modelu;
   tolerancyjny parser (bloki ```json, tekst wokół, pojedyncze obiekty). Zapis od razu do partii
   (np. `f.sledztwaReczne[model] = dane`), żeby odświeżenie nic nie gubiło.

### Etap C — porównanie i rekord

1. Widok per firma: modele obok siebie (kraj, właściciel, reguła, łańcuch ze źródłami); zgodność
   zaznaczona kolorem.
2. „Przyjmij wersję X” → ustawia `f.sledztwo` i `f.opisy` z wybranej odpowiedzi, a `f.kontrola`
   z porównania (≥2 modele zgodne co do kraju i właściciela = zgodna; niezgodność = KONFLIKT z
   opisem) → `zlozRekord` → firma trafia do obecnego Przeglądu i Importu bez zmian w nich.
3. Pewność: zgoda modeli **nie podnosi** pewności ponad źródła (zasada z SOP); jedno źródło
   medialne = ŚREDNIA; brak źródła pakietu kontrolnego = KONFLIKT. Trzymaj się `walidacja.mjs`.
4. Wyczyść w partii stare błędy „monthly spend limit” przy przejściu na ścieżkę ręczną.

### Etap D — dokumentacja

`docs/SOP_dodawanie_firm.md`: ścieżka ręczna jako domyślna, automat jako opcja z kosztem.

## 5. Dane do pracy

- Partia `Gastronomia-25-17.09` (`data/robocze/automat/partia-Gastronomia-25-17.09.json`, poza
  gitem): 21 firm z potwierdzonym NIP-em czeka; 13 z nich ma błąd śledztwa z limitu (do wyczyszczenia).
- Do pominięcia (decyzja Wiktora): Krowarzywa, Lody Bonano, Etno Cafe, Fornetti, Cinnabon — sprawdź,
  czy wszystkie mają `pomin: true` (Fornetti mogło się nie zapisać).
- Maczfit: numer z Gemini 9512622152 (Lifestyle Solutions sp. z o.o., źródło: regulamin maczfit.pl),
  w bazie jest jako GB · CVC — spodziewany konflikt do rozstrzygnięcia w przeglądzie.
- Ta sama spółka, kilka marek: Lodolandia / Bafra Kebab / Kołacz na Okrągło (Sweet Gallery),
  Biesiadowo / Gruby Benek — import już to obsługuje. Koku Sushi: dwa różne wyniki NIP w testach
  (Olechno sp.j. vs Kokku Food Group) — warto oznaczyć do ręcznej weryfikacji.

## 6. Kryterium odbioru

Wiktor przeprowadza 21 firm od przystanku NIP do rekordów gotowych do importu **bez ani jednego
wywołania modelu z kodu**: kopiuje paczki promptów jednym kliknięciem, wkleja odpowiedzi z 2 czatów,
widzi porównanie, przyjmuje wersje, przechodzi do przeglądu i importu. Na każdym ekranie wie,
który to krok ścieżki i co zrobić dalej.
