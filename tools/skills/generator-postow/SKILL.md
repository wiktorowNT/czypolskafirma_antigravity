---
name: generator-postow
description: >
  Generuje paczkę postów do social mediów (X/Twitter i Facebook) dla projektu CzyPolskaFirma,
  na podstawie żywych danych ze strony czypolskafirma.pl. Używaj zawsze, gdy użytkownik prosi
  o posty, paczkę postów, treści/content na social media, tweety, posty na FB, quizy o firmach
  albo pyta "co wrzucić w tym tygodniu" — nawet jeśli nie wspomina o generatorze ani o nazwie
  skilla (np. "ogarnij mi posty", "zrób content o bankach", "potrzebuję coś na X o Żabce").
---

# Generator postów CzyPolskaFirma

Tworzysz posty dla anonimowej marki, która buduje zaufanie wyłącznie twardymi danymi.
Projekt weryfikuje, czy popularne firmy w Polsce należą do polskiego kapitału
(metodologia: Zasada Ostatecznego Właściciela, Efektywnej Kontroli i Złotej Klatki).

Ton: konkret i fakty podane z luzem. Zero polityki partyjnej, zero hejtu na firmy
i konsumentów — zaskakujemy danymi, nie oceniamy ludzi. Marka mówi do społeczności
per „Wy" i traktuje ją jak współtwórców projektu. Każdy post prowadzi do profilu firmy
na stronie. Szczegóły głosu marki: sekcja „Głos marki" w `references/formaty.md` —
przeczytaj ją zawsze przed pisaniem.

## Źródła danych — tylko żywa strona

Nigdy nie zmyślaj faktów o firmach (właścicieli, krajów, dat, procentów). Każdy fakt
w poście musi pochodzić z pobranej w tej sesji strony:

1. **Lista kategorii:** `https://czypolskafirma.pl/kategorie`
2. **Strona kategorii:** `https://czypolskafirma.pl/kategoria/[slug]` — lista firm
   z werdyktem („Polska" / „Zagraniczna") i kodem kraju (flaga, np. `flagcdn.com/w40/de.png` → DE)
3. **Profil firmy:** `https://czypolskafirma.pl/firma/[slug]` — właściciel/inwestor,
   struktura właścicielska, opis działalności, „W Polsce od", data weryfikacji

Pobieraj przez narzędzie web_fetch. Slugi ze spacjami URL-enkoduj (`firma/50 Style` → `firma/50%20Style`).
Jeśli profil zawiera placeholdery („W trakcie weryfikacji", „Brak danych") — odrzuć firmę i wybierz inną.

## Pliki robocze

Domyślnie pracuj w repo projektu (podłączony folder zawierający `CLAUDE.md` ze wzmianką
o CzyPolskaFirma), w katalogu `docs/social/`:

- `docs/social/firmy-cache.json` — indeks firm zbudowany ze stron kategorii
- `docs/social/stan-generatora.json` — historia użyć i ustawienia
- `docs/social/paczki/paczka-RRRR-MM-DD.md` — wygenerowane paczki

Jeśli użytkownik wskaże inny katalog wyjściowy — trzymaj wszystkie trzy rzeczy tam.
Jeśli repo nie jest podłączone — użyj katalogu roboczego sesji i powiedz o tym użytkownikowi.
To tylko pliki robocze: nie commituj ich i nie modyfikuj niczego innego w repo.

### Schemat stanu (`stan-generatora.json`)

```json
{
  "ustawienia": { "x_premium": false },
  "wykorzystania": [
    { "marka": "Biedronka", "format": "zaskoczenie", "data": "2026-07-13" }
  ]
}
```

## Przebieg

1. **Stan.** Wczytaj `stan-generatora.json` (brak pliku = pierwsze uruchomienie, utwórz go na końcu).
2. **Indeks.** Jeśli `firmy-cache.json` nie istnieje albo ma ponad 7 dni: pobierz listę kategorii,
   potem każdą stronę kategorii, i zapisz indeks: `{ marka, url_profilu, werdykt, kraj, kategoria }`.
   W przeciwnym razie użyj cache.
3. **Dobór firm.** Wybierz firmy do formatów (domyślny zestaw niżej). Priorytet mają marki
   nieobecne w `wykorzystania` z ostatnich 60 dni. Mieszaj kategorie w obrębie paczki.
   Gdy użytkownik podał temat/kategorię/markę — filtruj pod to zamiast domyślnego miksu.
4. **Szczegóły.** Pobierz strony profilowe wybranych firm. Do quizu i pojedynku wystarczy indeks
   (werdykt + kraj), ale do „zaskoczenia", „odwrotki" i odpowiedzi na quiz potrzebujesz
   profilu (właściciel, struktura).
5. **Formaty.** Przeczytaj `references/formaty.md` i napisz posty dokładnie według niego.
6. **Zapis.** Zapisz paczkę według szablonu z `formaty.md` do `paczki/paczka-RRRR-MM-DD.md`
   (data = najbliższy poniedziałek).
7. **Stan.** Dopisz użyte pary marka+format do `wykorzystania`.
8. **Prezentacja.** Pokaż plik użytkownikowi i przypomnij jednym zdaniem: posty planuje się
   ręcznie w schedulerze X (natywnym) i Meta Business Suite.

## Domyślna paczka tygodniowa

7 postów na X + 7 na Facebooka — każdy post ma wersję na oba kanały. FB to dostosowane
wersje (dłuższe, z pytaniem do czytelników — szczegóły w `references/formaty.md`), nie kopie:

| Dzień | Format | X | FB |
|---|---|---|---|
| pon | zaskoczenie | tak | tak |
| wt | quiz (ankieta) | tak | tak (natywna ankieta) |
| śr | odpowiedź na quiz | tak | tak |
| czw | pojedynek | tak | tak |
| pt | zestawienie | tak | tak |
| sob | odwrotka | tak | tak |
| nd | statystyka kategorii | tak | tak |

Użytkownik może zmienić liczbę, formaty, kanały lub tematykę — dostosuj zestaw,
reszta przebiegu bez zmian.

## Twarde zasady treści

- X bez Premium: **maks. 280 znaków** na post (licz przed zapisem!). Gdy w ustawieniach
  `x_premium: true`, dłuższe posty są dozwolone, ale hook nadal w pierwszych 280 znakach.
- Link do profilu zawsze z UTM: `?utm_source=x&utm_medium=social` (na FB `utm_source=fb`).
  Używaj czystych URL-i profilów (URL-enkodowane slugi).
- Emoji i hashtagi wg checklisty w `references/formaty.md` (1–2 funkcjonalne emoji na post,
  maks. 2 hashtagi).
- Fakty tylko z pobranych stron. Gdy strona nie podaje szczegółu (np. procentu udziałów),
  nie podawaj go. Wątpliwość = wybierz inną firmę.
- Bez wzywania do bojkotów. Pokazujemy dane i alternatywy, wybór należy do czytelnika.
