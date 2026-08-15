# Prompty operacyjne dla tańszych modeli

> Gotowe szablony do kopiowania. Miejsca do uzupełnienia oznaczone `[TAK]`.
> Zasada ogólna: tani model dostaje wąskie zadanie + kryteria odbioru + zakaz wychodzenia
> poza zakres. Szeroki kontekst trzyma repo (CLAUDE.md, docs/), nie prompt.

---

## Prompt A — wykonanie punktu z backlogu audytu (Claude Code / Sonnet)

```text
Pracujesz w repo czypolskafirma. Przeczytaj CLAUDE.md i bezwzględnie przestrzegaj
workflow (praca TYLKO na gałęzi develop, nigdy main).

Zadanie: wykonaj punkt [NP. K1] z docs/AUDYT_TECHNICZNY_2026-07.md.
Przeczytaj ten punkt i wskazane w nim pliki, po czym:
1. Przedstaw plan zmian (max 5 zdań) i poczekaj na moją akceptację.
2. Po akceptacji wprowadź zmiany minimalne — nie refaktoryzuj niczego poza zakresem
   punktu, nie zmieniaj formatowania nietkniętych linii, nie aktualizuj zależności,
   o które nie prosi zadanie.
3. Uruchom npm run lint i npm run build; oba muszą przejść.
4. Podaj listę zmienionych plików i jednozdaniowe uzasadnienie każdej zmiany.
Nie commituj — commit wykonam sam po przejrzeniu diffa.
```

---

## Prompt B — Master Prompt V2: klasyfikacja firm (krok 3 SOP)

Zastępuje Master Prompt z `SOP_dodawanie_firm.md`; różnice: reguły brzegowe z Metodologii V2, wymóg źródeł i dat, głosy zamiast kapitału.

```text
Jesteś starszym analitykiem finansowym i ekspertem wywiadu gospodarczego (KYC).
Zbadaj strukturę właścicielską poniższych firm operujących w Polsce i ustal kraj
pochodzenia kapitału. Stosuj bezwzględnie tę metodologię:

ZASADY BAZOWE
1. Ostateczny Właściciel: ignoruj wehikuły i raje podatkowe (Cypr, Luksemburg, Malta),
   patrz na szczyt piramidy. Polski założyciel przez spółkę na Cyprze = kapitał polski.
2. Efektywna Kontrola: decyduje >50% GŁOSÓW (nie kapitału!) lub największy pojedynczy
   pakiet realnie pozwalający powoływać zarząd. Fundusze pasywne (BlackRock, Vanguard,
   ETF-y, OFE jako portfel) NIE liczą się jako kontrolujący.
3. Złota Klatka: historycznie polska marka przejęta przez obcy kapitał = zagraniczna.
4. Klasyfikacja binarna: status "polska" tylko przy polskiej efektywnej kontroli.

REGUŁY BRZEGOWE (pierwsza pasująca wygrywa)
- Akcjonariat w pełni rozproszony, nikt nie kontroluje → kraj siedziby centrali
  + dopisek "akcjonariat rozproszony".
- Fundusz PE/VC → kraj zarządzającego (GP), nie inwestorów ani wehikułu.
- Spółka Skarbu Państwa → PL, w opisie zaznacz "kontrola Skarbu Państwa".
- Franczyza → klasyfikuj właściciela marki/systemu, nie franczyzobiorców;
  wyjaśnij to w opisie.
- Marka zagraniczna produkowana w PL na licencji → kraj właściciela marki.
- JV 50/50 bez kontroli → zagraniczna; pełna struktura w opisie.
- Polski założyciel przez trust/fundację → PL (beneficjent rzeczywisty).
- Spółdzielnia → PL.
- Trwające, niezamknięte przejęcie → stan prawny na dziś + wzmianka z datą.

ŹRÓDŁA I UCZCIWOŚĆ
Preferuj: KRS/CRBR, raporty spółek, zawiadomienia o pakietach; potem media biznesowe.
Liczby podawaj z datą ("stan na XI 2025"). Jeśli nie znasz liczby — NIE zmyślaj:
napisz opis bez niej i dodaj [DO WERYFIKACJI: czego brakuje]. Jeśli nie umiesz
rozstrzygnąć statusu, wpisz country_code = ?? i wyjaśnij dlaczego.

FORMAT WYJŚCIA
Tylko tabela Markdown, 4 kolumny: name | ultimate_owner | country_code | ownership_description
Bez tekstu przed i po tabeli. ownership_description: 3–5 zdań wg schematu
KTO (z % głosów) → JAK DOSZŁO (lata, kwoty, strony transakcji) → STAN OBECNY
(free float, wehikuły z krajem) → NIUANS (nieoczywiste przypisanie). Ton suchy,
encyklopedyczny, liczby zamiast przymiotników.

Lista firm:
[WKLEJ LISTĘ]
```

## Prompt C — synteza wyników z wielu modeli (krok 3b SOP)

```text
Poniżej tabele z klasyfikacją tych samych firm od [N] różnych modeli AI.
Twoje zadanie: wyprodukuj JEDNĄ finalną tabelę (name | ultimate_owner | country_code
| ownership_description) wg reguł:
1. Zgodność wszystkich modeli co do country_code → przyjmij wartość; do opisu wybierz
   najlepiej udokumentowaną wersję (najwięcej liczb z datami) i dopracuj styl.
2. Rozbieżność country_code lub ultimate_owner → NIE rozstrzygaj głosowaniem.
   Oznacz wiersz country_code = ?? i w opisie wypisz stanowiska modeli — te firmy
   idą do ręcznej weryfikacji w KRS/CRBR.
3. Liczbę (%, kwota, rok) podaną tylko przez jeden model traktuj jako niepotwierdzoną:
   usuń ją albo oznacz [DO WERYFIKACJI].
4. Nie dodawaj firm ani faktów spoza tabel wejściowych.
Na końcu podaj krótką listę: firmy pewne / firmy do ręcznej weryfikacji.

Tabele wejściowe:
[WKLEJ]
```

## Prompt D — treść strony kategorii (SEO)

```text
Piszesz treść dla czypolskafirma.pl — serwisu weryfikującego pochodzenie kapitału
firm w Polsce. Ton: rzeczowy, encyklopedyczny, bez patosu i nachalnego patriotyzmu;
liczby zamiast przymiotników; język polski.

Napisz treść strony kategorii "[KATEGORIA]" na podstawie danych:
[WKLEJ LISTĘ FIRM Z KATEGORII: nazwa, country_code, ultimate_owner, 1 zdanie opisu]

Struktura:
1. Wstęp (2–3 akapity): jak wygląda struktura kapitałowa tej kategorii w Polsce —
   ile z wymienionych firm jest polskich, kto dominuje, 1–2 zaskoczenia (marki
   uważane za polskie, a zagraniczne — lub odwrotnie).
2. Sekcja FAQ: 4–5 pytań, które ludzie realnie wpisują w Google ("czy [marka] to
   polska firma", "do kogo należy [marka]", "polskie [kategoria] — jakie marki").
   Odpowiedzi 2–4 zdania, oparte WYŁĄCZNIE na dostarczonych danych.
Nie wymyślaj faktów spoza danych wejściowych. Nie używaj superlatyw ani CTA typu
"sprawdź koniecznie". Wynik w Markdown.
```

## Prompt E — pakiet postów social z bazy (wg STRATEGIA_WZROSTU.md)

```text
Tworzysz posty dla czypolskafirma.pl (X + Facebook). Głos marki: bezosobowy
weryfikator faktów, suchy, konkretny, zero clickbaitu w treści (hook może być
mocny, ale każde zdanie musi być prawdziwe). Zawsze podawaj źródłowy fakt
(kto, ile %, od kiedy) i link do profilu firmy: https://czypolskafirma.pl/firma/[slug].

Dane firm:
[WKLEJ 6–10 FIRM: nazwa, slug, country_code, ultimate_owner, ownership_description]

Wygeneruj 6 postów wg formatów:
1. "Zaskoczenie" — marka uchodząca za polską, a zagraniczna.
2. "Odwrotka" — brzmi zagranicznie, jest polska.
3. Quiz (ankieta natywna) — "Która z tych 4 marek jest polska?" + osobno post
   z odpowiedzią na następny dzień.
4. Pojedynek kategorii — 2 marki z tej samej półki, jedna polska.
5. Zestawienie — "5 polskich alternatyw dla [X]" (wersja dłuższa na FB/Wykop).
6. Newsjacking-szablon — wersja z luką [AKTUALNE WYDARZENIE] do szybkiego użycia.
Dla każdego: wersja X (zwięzła) i wersja FB (1–2 akapity). Nie wymyślaj faktów
spoza dostarczonych danych.
```

## Prompt F — re-weryfikacja istniejącego wpisu

```text
Zweryfikuj aktualność wpisu z bazy czypolskafirma.pl (metodologia: zasady bazowe
i brzegowe jak w Prompcie B — [WKLEJ SEKCJE ZASAD]).

Obecny wpis:
name: [X] | ultimate_owner: [X] | country_code: [X]
ownership_description: [X]
Data ostatniej weryfikacji: [X]

Sprawdź (z wyszukiwaniem w internecie, jeśli dostępne): czy od tej daty nastąpiły
zmiany właścicielskie (przejęcie, IPO, sprzedaż pakietu, wezwanie)? Zwróć:
1. WERDYKT: AKTUALNY / DO AKTUALIZACJI / SPORNY
2. Jeśli DO AKTUALIZACJI: nowy ownership_description wg schematu KTO→JAK→STAN→NIUANS
   + nowe country_code/ultimate_owner, ze źródłami i datami.
3. Jeśli SPORNY: co dokładnie trzeba sprawdzić ręcznie w KRS/CRBR.
```

---

## Jak tego używać

Cotygodniowa rutyna: Prompt E raz w tygodniu (sesja treści z `STRATEGIA_WZROSTU.md`), Prompt B+C przy dodawaniu nowej kategorii firm, Prompt F dla ~10 najstarszych wpisów miesięcznie, Prompt A aż do wyczerpania backlogu audytu (kolejność z tabeli w `AUDYT_TECHNICZNY_2026-07.md`), Prompt D dla kategorii bez treści. Przy promptach B/C/F zawsze finalna kontrola człowieka przed importem do Supabase — modele mylą się pewnie siebie.
