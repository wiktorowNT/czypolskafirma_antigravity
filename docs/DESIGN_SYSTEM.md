# System projektowy „Półka” (CzyPolskaFirma)

Wdrożony w październiku 2026 na gałęzi `redesign` (kierunek C z makiet w
`docs/design/kierunki/`). Ten dokument wystarcza, żeby dokończyć kolejne strony w tym
samym stylu bez oglądania makiet.

**Idea:** Notion dla konsumenta na telefonie. Biel i ciepła szarość, jeden kolor akcentu,
linie zamiast cieni, zaokrąglenia, duże pola dotykowe. Rozpoznawalność dają **dane**
(metka z werdyktem, ścieżka właściciela, wykresy udziału kapitału) i loga firm, a nie
ilustracje — serwis nie ma i nie będzie miał własnych rysunków ani zdjęć.

---

## 1. Kolory (tokeny w `app/globals.css`)

Używaj klas Tailwinda z tokenami. Nigdy `slate-*`, `red-*`, `green-*`, `blue-*`, `amber-*`.

| Token / klasa | Jasny | Do czego |
|---|---|---|
| `text-ink`, `bg-ink` | `#1f1d1a` | tekst główny, ramka aktywna |
| `text-ink-2` | `#6b665e` | tekst drugorzędny, opisy |
| `text-ink-3` | `#716b62` | etykiety, podpisy, daty |
| `bg-warm` | `#f6f3ee` | ciepłe tło sekcji i bloków |
| `bg-warm-2` | `#ece7df` | puste części wykresów, inicjały |
| `border-line` | `#e4dfd6` | wszystkie obramowania |
| `bg-brand`, `text-brand` | `#c2381f` | **tylko**: werdykt „polska”, główny przycisk, akcent w tytule okładki |
| `text-brand-ink` | `#9e2d18` | linki-akcje („Wszystkie kategorie →”), tekst w kolorze marki |
| `bg-brand-soft` | `#fbe9e4` | wyróżnienie polskiego właściciela, pigułka „xx% PL” ≥ 50% |
| `bg-graphite` | `#3b3833` | werdykt „zagraniczna”, obramowanie zagranicznego właściciela |
| `bg-sun` | `#f2c14e` | drobny akcent: kropka w „Prześwietliliśmy…”, trzeci krok. Maks. 1–2 na stronę |
| `bg-card` | biel | tło kart i pól (w ciemnym motywie ciemnieje — nie pisz `bg-white`) |
| `bg-panel` + `text-white` | `#1f1d1a` | ciemny blok (wsparcie projektu, CTA bloga) |

Znaczenie kolorów jest stałe w całym serwisie: **cegła = polski kapitał, grafit =
zagraniczny**. Nie używaj zieleni dla „polska”, nie używaj czerwieni dla błędów/ostrzeżeń
w treści (od tego jest `destructive`, tylko w formularzach).

Kontrast: wszystkie powyższe pary tekst/tło spełniają WCAG AA. `text-ink-3` nie kładź na
`bg-warm-2`.

## 2. Typografia

Jeden font: **Manrope** (`next/font`, zmienna `--font-manrope`, klasa `font-sans` domyślnie).
Wagi: 500 tekst, 600–700 etykiety i nazwy, 800 nagłówki i liczby.

| Element | Klasy |
|---|---|
| H1 strony | `text-[34px] sm:text-[46px] font-extrabold tracking-[-0.03em] leading-[1.08]` |
| H1 profilu | `text-[30px] sm:text-[40px] font-extrabold tracking-tight leading-[1.1]` |
| H2 sekcji | `text-[26px] sm:text-[28px] font-extrabold tracking-tight text-ink` |
| H3 | `text-lg font-bold text-ink` |
| Etykieta (kapitaliki) | `text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2` (mniejsza: `text-[11px] … text-ink-3`) |
| Tekst | `text-[15px]`–`text-[15.5px] text-ink-2 leading-relaxed` |
| Liczby | dodaj `tabular-nums` |

Nazw firm **nie** zapisuj wielkimi literami (`uppercase`) — tak jak w bazie.

W kartach, listach i diagramach używaj **potocznej nazwy marki** (`display_name`, np. „Pepco”,
„Żabka”), a nie pełnej nazwy spółki z KRS („PEPCO POLAND SPÓŁKA Z O.O.”). Pełna nazwa prawna
pojawia się tylko na profilu firmy, jako drobny podpis pod nazwą marki.

## 3. Kształt

- Obramowanie zawsze `border-[1.5px] border-line`; hover: `hover:border-ink`.
- **Bez cieni** (`shadow-*`). Jedyny wyjątek: rozwijane listy i baner cookies
  (`shadow-[0_16px_40px_-16px_rgba(31,29,26,0.35)]`).
- **Bez gradientów**, rozmytych kół w tle, ikon w kolorowych kółkach, emoji.
- Promienie: przyciski, pola, pigułki `rounded-full`; karty i wiersze `rounded-2xl`;
  duże bloki `rounded-[20px]`–`rounded-[24px]`; sekcje werdyktu `rounded-3xl`.
- Szerokość treści: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` (profil: `max-w-4xl`).
- Odstęp sekcji: `py-14 sm:py-16`; sekcje naprzemiennie białe i `bg-warm`.

## 4. Komponenty

| Komponent | Plik | Kiedy |
|---|---|---|
| Metka z werdyktem | `components/verdict-tag.tsx` (`<VerdictTag countryCode size label>`) | werdykt na profilu, karta „Przykładowy wynik”, „Też zaskakują” (`label` = nazwa kraju). Nie na listach — tam status tekstem |
| Przykładowy wynik | `components/sample-result.tsx` | strona główna; dane z `lib/home-data.ts` |
| Ścieżka właściciela | `components/OwnershipDiagram.tsx` | profil; węzły `rounded-2xl`, łącznik `border-l-2 border-dashed border-ink-3` |
| Wiersz firmy | `components/CompanyCard.tsx` | listy: kategoria, wyszukiwarka, ulubione, wpis na blogu |
| Logo firmy | `components/company-logo.tsx` | wszędzie; awatar z inicjałem na `bg-warm` |
| Wyszukiwarka | `components/company-search.tsx`, `variant="hero"` / `"minimal"` / `"default"` | |
| Przycisk | `components/ui/button.tsx` (już zaokrąglony) albo klasy poniżej | |

Wzorce klas:

- **Przycisk główny:** `h-11 px-5 rounded-full bg-brand text-white font-bold hover:bg-brand-ink`
- **Przycisk drugorzędny:** `h-11 px-5 rounded-full bg-card border-[1.5px] border-line font-bold text-ink hover:border-ink`
- **Pigułka/chip:** `h-9 px-3.5 rounded-full bg-warm text-[13.5px] font-semibold text-ink`
- **Pole tekstowe:** `h-[52px] rounded-full border-[1.5px] border-line focus:border-ink`
- **Karta:** `rounded-[20px] border-[1.5px] border-line p-5 sm:p-6`
- **Link-akcja:** `text-sm font-bold text-brand-ink hover:underline underline-offset-4` + `→`
- **Pigułki przewijane na telefonie:** `scroll-row flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap` (elementy `flex-shrink-0 whitespace-nowrap`)

## 5. Grafiki z danych

- **Koszyk (waffle):** 100 kwadratów, 1 = 1% firm (`components/global-stats.tsx`).
- **Półki:** poziomy pasek na linii `border-b-[3px] border-ink`, czerwona część = polski kapitał.
- **Ścieżka właściciela:** owner → spółka-matka → marka, łącznik przerywany.
- **Okładki bloga:** `tools/okladka-szablon.html` + `tools/okladka-wpisu.mjs`; dane każdej okładki
  w `public/images/blog/dane/[slug].json`. Odświeżenie wszystkich po zmianie szablonu:
  `for f in public/images/blog/dane/*.json; do node tools/okladka-wpisu.mjs "$f"; done`
- **Obrazki podglądu (og:image) profili:** `app/firma/[slug]/opengraph-image.tsx`, kolory w
  `lib/og-assets.ts` (`OG_COLORS`). Font OG to nadal Inter (podzbiory w `lib/og-assets.ts`).

## 6. Zasady treści w interfejsie

Rzeczowo, bez wykrzykników i patosu („Twoje pieniądze mają moc!”, „każda cegiełka”).
Etykiety mówią, co pokazują. Liczby z bazy, nie z głowy.

## 7. SEO — czego nie ruszać przy przenoszeniu stron

Adresy, `metadata`, `<title>`, dane strukturalne JSON-LD, **poziomy i treść nagłówków
H1–H4** oraz treści opisów firm zostają bez zmian. Zmieniasz tylko klasy i układ.
Nie dodawaj nagłówków tam, gdzie były zwykłe etykiety (np. „Popularne wyszukiwania” to `<p>`).

## 8. Narzędzia

- `node tools/tokeny-polka.mjs plik.tsx …` — mechaniczna zamiana `slate/red/blue/green` i
  usunięcie cieni. Nie łapie klas w wariantach z nawiasem (`[&_a]:text-red-600`) — te popraw
  ręcznie. Po zamianie zawsze obejrzyj stronę.
- `node tools/zrzuty-redesign.mjs http://localhost:3001 /ścieżka … [--dark]` — zrzuty
  desktop 1280 i telefon 375 do `%TEMP%/cpf-zrzuty`, zgłasza poziomy scroll. W Git Bash
  poprzedź `MSYS_NO_PATHCONV=1`, inaczej ścieżki `/…` zamienią się na ścieżki Windows.

## 9. Stan przeniesienia (październik 2026)

Przeniesione: tokeny i font, nagłówek, stopka, baner cookies, strona główna (wszystkie
sekcje), profil firmy (wszystkie sekcje + og:image), strona kategorii i lista firm,
blog (lista, wpis, okładki), metodologia, o projekcie, regulamin, polityka prywatności,
strony 404, wyszukiwarka, ulubione (mechanicznie, kolory).

Do dokończenia tym samym wzorcem:
- `app/narzedzia/generator/page.tsx` (narzędzie wewnętrzne, ~260 starych klas) — niski priorytet.
- `components/ui/*` — pojedyncze `slate`/`shadow-xs` w rzadko używanych komponentach.
- Strony informacyjne (`metodologia`, `o-projekcie`, `regulamin`) przeszły tylko zamianę
  kolorów; układ (karty, promienie, odstępy) warto dopasować do sekcji 3.
- **Tryb ciemny:** tokeny są gotowe (`.dark` w `globals.css`), ale nie jest włączony. Włączenie
  = `ThemeProvider` z `next-themes` (`attribute="class"`) w `app/layout.tsx` po tym, jak
  wszystkie strony przestaną używać `bg-white`/`text-slate-*` na sztywno.
