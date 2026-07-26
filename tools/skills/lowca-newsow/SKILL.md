---
name: lowca-newsow
description: >
  Szuka w internecie aktualnych newsów o polskich firmach (przejęcia w obie strony:
  polska firma przejmuje zagraniczną lub odwrotnie, wielkie kontrakty, ekspansja,
  odkrycia, sukcesy) i pisze z nich dłuższe wpisy na X/Facebooka oraz wersję blogową
  dla projektu CzyPolskaFirma. Używaj zawsze, gdy użytkownik prosi o newsy o firmach,
  przejęciach, "co się dzieje w polskim biznesie", "znajdź temat na długi wpis",
  "napisz wpis o tym przejęciu", wkleja link do artykułu o firmie, albo chce materiał
  na bloga — nawet jeśli nie wspomina o nazwie skilla.
---

# Łowca newsów — CzyPolskaFirma

Newsy o przejęciach i sukcesach firm to naturalne paliwo dla projektu o pochodzeniu
kapitału: każda taka historia ma bohatera, kwotę i pytanie „czyj to teraz kapitał?".
Piszesz w imieniu anonimowej marki, której walutą jest wiarygodność danych.

## Tryby

1. **Przegląd (domyślny)** — znajdź tematy z ostatnich 7 dni.
2. **Temat/link** — użytkownik podaje firmę, wydarzenie albo link do artykułu.

## Przebieg

1. **Stan.** Wczytaj `docs/social/newsy/stan-newsow.json`
   (`{ "opisane": [{ "temat", "data" }] }`; brak pliku → utwórz na końcu).
   Nie proponuj tematów już opisanych.
2. **Szukaj (WebSearch + web_fetch).** Przykładowe zapytania (dostosuj do daty):
   „polska firma przejmuje", „przejęcie polskiej firmy", „polska spółka kupuje
   zagraniczną", „polska firma kontrakt rekord", „polska firma ekspansja zagraniczna".
   Preferuj media biznesowe (pb.pl, money.pl, bankier.pl, businessinsider.com.pl,
   wnp.pl, rp.pl, parkiet.com) i komunikaty spółek.
3. **Selekcja: 1–3 tematy.** Najlepsze są historie o WŁASNOŚCI (przejęcia, pakiety
   kontrolne, repolonizacje) — to sedno projektu. Sukcesy produktowe/kontrakty biorą
   się wtedy, gdy skala robi wrażenie. Kryteria: świeżość (≤7 dni), skala (kwota,
   rozpoznawalność marki), możliwość powiązania z bazą czypolskafirma.pl.
4. **Weryfikacja.** Kluczowe fakty (kto kupuje, ile procent, za ile, od kogo)
   potwierdzone w min. 2 niezależnych źródłach. Firma jest w bazie → pobierz jej
   profil `czypolskafirma.pl/firma/[slug]` i linkuj. Nie ma → dopisz do
   „Kandydaci do bazy". Sprzeczne źródła → temat odpada.
5. **Pisz.** Dla każdego tematu trzy wersje (szczegóły niżej).
6. **Zapis.** Dwa pliki na temat: `docs/social/newsy/news-RRRR-MM-DD-[krótki-slug].md`
   (wersje X + FB + weryfikacja) oraz `content/blog/[slug].md` (gotowy wpis blogowy
   z frontmatterem). Aktualizacja stanu, pokaż pliki użytkownikowi.

## Trzy wersje tekstu

**1. Długi wpis na X** (konto ma Premium): 800–2500 znaków. **Piszesz dla
przypadkowej osoby**, która nie zna projektu, nie zna spółki i nie wie, czym jest
wezwanie czy przymusowy wykup; wpis ma jej to wszystko wyjaśnić po drodze. Kolejność:
mocny jednozdaniowy hook o wydarzeniu („Największa prywatna grupa energetyczna
w Polsce właśnie znika z giełdy.") → kim jest firma i kto za nią stoi (ludzie,
historia) → co się dzieje i jak ten mechanizm działa, prostymi słowami (czym jest
wezwanie, delisting, przejęcie pakietu) → dopiero teraz twarde liczby (procenty
z flagami krajów, kwoty, terminy) → niuans właścicielski opowiedziany faktami
(np. holding w Luksemburgu: adres podatkowy, decyzje i zyski u polskiego
właściciela) → warstwa historyczna (poprzednie próby, sprzedaże) → wniosek: co to
znaczy dla rynku/polskiej gospodarki → puenta z lekką ironią, bez moralizowania.
**Zero odwołań do własnej metodologii** („stosujemy zasadę…", „ciekawostka
techniczna:", „nasza baza pokazuje…"); mechanizmy tłumacz wprost, faktami.
Pierwsze ~280 znaków musi działać samodzielnie (fold „Pokaż więcej").
Akapity 1–3 zdania. **Link do profilu z bazy daj jako treść pierwszego komentarza
pod wpisem** (X obniża zasięg postów z linkami; w pliku podaj wpis + ten komentarz,
z `?utm_source=x&utm_medium=social`). Gdy firmy nie ma w bazie, bez linku.

**2. Wersja FB**: 4–7 zdań, bardziej gawędziarsko, na końcu pytanie do czytelników.
Link z `utm_source=fb`.

**3. Wersja blogowa — gotowy wpis na `/blog`:** 500–800 słów. Tytuł pod SEO
(np. „[Firma A] przejmuje [Firmę B]. Czyj kapitał stoi za…"), 3–4 śródtytuły H2,
akapity po 2–4 zdania, na końcu sekcja „Źródła" z listą URL-i.

**Ton bloga: dziennikarski, nie metodologiczny.** Wpis ma czytać się jak artykuł
w serwisie biznesowym (bankier.pl, money.pl): piszesz dla czytelnika, który chce
zrozumieć historię, a nie audytować werdykt. Konkretnie:

- **Zero „my" i powoływania się na własne zasady w treści** („robimy odwrotnie",
  „zgodnie z zasadą ostatecznego właściciela", „według naszej metodologii").
  Głos marki w 1. os. l.mn. zostaje w wersjach X/FB; blog mówi faktami.
- Zamiast cytować regułę, **opowiedz mechanizm wprost**: nie „ignorujemy raje
  podatkowe", tylko „Mansa jest zarejestrowana w Luksemburgu, ale kontroluje ją
  Dominika Kulczyk; holding za granicą to rozwiązanie podatkowe i nie zmienia tego,
  kto podejmuje decyzje i dokąd trafiają zyski".
- Kontekst ludzki i historyczny (kto zbudował firmę, kto przejął po kim, dlaczego
  taka struktura) zamiast wykładu o klasyfikacji.
- Uzasadnienie werdyktu względem metodologii projektu opisujesz w pliku newsowym
  (sekcja Weryfikacja) i w rozmowie z użytkownikiem, nie we wpisie.
- Oś wpisu wyznacza historia, a nie werdykt: patrz „Ciekawość ponad werdykt" niżej.

Zapisz ją jako **osobny plik `content/blog/[slug-wpisu].md`** z frontmatterem według
wzorca `content/blog/_szablon.md`:

- `title` — tytuł SEO; `slug` — kanoniczny (małe litery, myślniki); `date` — dzień
  bieżący; `description` — 1–2 zdania (max ~155 znaków).
- `relatedCompanies` — slugi firm z tematu, które SĄ w bazie (`/firma/[slug]`);
  wyrenderują się jako karty pod wpisem, więc nie linkuj ich dodatkowo w treści na siłę.
- `image`/`imageAlt` (opcjonalnie) — cover 1200×630 w `public/images/blog/[slug].png`;
  można wygenerować z HTML-a przez `node tools/render-blog-cover.mjs <plik.html> <wyjście.png>`.
  Zasady doboru zdjęć (prawa autorskie, źródła) — sekcja „Zdjęcia" w `_szablon.md`.
- Markdown treści: `##`/`###`, listy, `> cytat`, `![podpis](/images/blog/plik.jpg)`.

Wpis pojawi się na stronie po commicie na `develop` i deployu — przypomnij o tym
użytkownikowi przy oddawaniu plików.

## Styl (obowiązuje wszystkie wersje)

### Ciekawość ponad werdykt — zasada nadrzędna

Tekst pisze się dla kogoś, kto przyszedł po historię, nie po werdykt. Pochodzenie
kapitału wchodzi do tekstu wtedy, kiedy naturalnie z niego wynika (np. odpowiada na
pytanie „kto tu w ogóle miał co sprzedać"), a nie jako obowiązkowa puenta.

Zakazane:

- domykanie tekstu zdaniem w rodzaju „a przy okazji okazało się, że X nie jest polska";
- wracanie do tego samego werdyktu kilka razy w jednym tekście (raz, faktem, wystarczy);
- doklejanie odesłania do serwisu tam, gdzie nic z niego nie wynika;
- naginanie tematu tak, żeby dało się dojść do wątku właścicielskiego.

Zamiast tego szukaj w historii tego, co jest w niej naprawdę ciekawe: co się stało
z kursem i kto na tym zarobił albo stracił, skąd wzięła się taka cena, jak działa
mechanizm, kto podjął decyzję i czym ryzykował, co się zmieni dla klienta albo
pracownika. Jeżeli najmocniejszy jest wątek giełdowy albo ludzki, to on jest osią
tekstu, a struktura właścicielska bywa wtedy jednym akapitem w środku.

**Test przed zapisem:** gdyby wyciąć z tekstu zdanie o polskim albo zagranicznym
kapitale, czy dalej byłoby to warte przeczytania? Jeżeli nie, to albo temat jest słaby,
albo tekst jest źle napisany.

- Naturalność: każde zdanie dałoby się powiedzieć na głos koledze. Zakazane:
  doklejone pytania retoryczne, „a jednak", „co ciekawe", „warto wiedzieć".
- **Zero myślników „ — " (em-dash) w treści do publikacji** (najbardziej rozpoznawalny
  sygnał AI). Zamiast: kropka, przecinek, dwukropek. Strzałka „→" przed linkiem OK.
- Precyzja nazw: marka ≠ spółka ≠ grupa. Kwoty i procenty tylko ze zweryfikowanych źródeł.
- Zero polityki partyjnej i kibicowania; fakty i kontekst. Emocje tak (to duże historie!),
  ale w danych: „2,4 mld zł" robi robotę lepiej niż trzy przymiotniki.
- 1–2 emoji funkcjonalne (flagi), zero hashtagów albo jeden.

## Szablon pliku

```markdown
# [Tytuł roboczy tematu] — RRRR-MM-DD

Status: do publikacji ręcznej. Grafika: [sugestia, np. karta firmy / flagi 🇵🇱→🇩🇪 / liczba].

## Długi wpis X (NNNN znaków)
[treść]

## Wersja FB
[treść]

## Wersja blogowa
→ zapisana osobno jako `content/blog/[slug].md` (tu tylko ścieżka pliku)

## Weryfikacja
- [fakt]: [źródło 1], [źródło 2]

## Kandydaci do bazy
- [firmy z tematu, których brak w bazie]
```
