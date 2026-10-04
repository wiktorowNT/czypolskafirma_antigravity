# Nowy wygląd CzyPolskaFirma — Etap 1: diagnoza i trzy kierunki

Stan (04.10.2026): **wybrany kierunek C „Półka”** z kartą „Przykładowy wynik” przeniesioną z A
(Żabka z rozpisaną ścieżką właściciela: CVC → pośrednik w Luksemburgu, pomijany → Żabka Polska, plus
trzy zaskakujące marki). Kierunek B odrzucony 27.09; A i A+C zostają w folderze tylko do porównania.
Kod aplikacji nie był jeszcze ruszany — Etap 2 czeka na akceptację planu.

### A+C · „Kartoteka z metką” (nowy wariant do porównania)

- **Baza z A:** biel, linie 1 px zamiast cieni, Inter Tight + Inter + Geist Mono, lista kategorii
  z paskiem udziału PL, słupki kategorii, profil z tabelą faktów i diagramem-rejestrem, w którym
  spółka w raju podatkowym jest kropkowanym węzłem „pomijana”.
- **Z C:** werdykt jako metka (grafit = zagraniczna, cegła `#b42318` = polska) w nagłówku profilu
  i na górze strony głównej; okrągła wyszukiwarka z przyciskiem w środku; okrągłe pigułki firm,
  na telefonie przewijane w poziomie; waffle „koszyk 750 firm”; rodzina marek z logami na profilu;
  metka kraju na okładkach bloga.
- **Świadomie nie z C:** Manrope, ciepłe tła i pigułki „xx% PL” — zostaje chłodniejszy, bardziej
  rejestrowy charakter A. Na liście alternatyw nie ma metek, żeby nie robić czerwonej ściany.
- Pliki: `ac-strona-glowna.html`, `ac-profil.html`, `ac-kartoteka-metka.css`.

## Jak oglądać

- `index.html` — porównywarka: trzy kierunki obok siebie, przełącznik strona główna / profil
  i desktop / mobile. Otwórz przez lokalny serwer z katalogu repo (np.
  `python -m http.server 8765` i adres `http://localhost:8765/docs/design/kierunki/index.html`),
  bo makiety ładują loga z `public/logos/` ścieżką względną. Otwarcie pliku podwójnym
  kliknięciem też zadziała w większości przeglądarek.
- Pliki kierunków: `a-strona-glowna.html` + `a-profil.html` (+ `a-kartoteka.css`), analogicznie `b-*`
  i `c-*`. Każda makieta jest responsywna — ta sama strona pokazuje wersję desktop i mobile (375 px).
- `zrzuty/` — gotowe PNG (desktop 1280 px i mobile 375 px, pełna wysokość), wyrenderowane
  skryptem `tools/render-makiety.mjs`.

Makiety nie zakładają żadnych własnych ilustracji ani zdjęć (patrz punkt 4).

Makiety są na prawdziwych danych z bazy (stan 17.09.2026): 750 firm, 350 polskich (47%),
36 krajów, udziały per kategoria z `/api/stats`, rozkład krajów z `/api/companies`,
profile Żabki, E. Wedla i Reserved z produkcji.

---

## 1. Diagnoza: dlaczego strona wygląda „jak z AI”

Skrót: strona jest zbudowana z **jednej receptury karty** powtórzonej kilkanaście razy
(`bg-white rounded-xl shadow-sm border-slate-200`), z **ikoną lucide w kolorowym kółku**
jako uniwersalnym ozdobnikiem i z **paletą slate + red-600** rodem z domyślnego shadcn.
To dokładnie ten zestaw, który generatory (v0, Framer AI) produkują domyślnie.

Konkretna lista (z plikami):

**Kolory**
- `app/globals.css` to nietknięte fabryczne tokeny shadcn (oklch, `--chart-1..5`, `--sidebar-*`).
  Żaden komponent z nich nie korzysta — kolory są wpisane na twardo w klasach Tailwind.
- Paleta = `slate` + `red-600`, a do tego przypadkowe kolory bez znaczenia: w `CompanyHero.tsx`
  trzy kółka „Pochodzenie / Właściciel / W Polsce” są niebieskie, fioletowe i zielone bez powodu;
  w `global-stats.tsx` trzy karty mają gradienty red / green / amber; w `category-list.tsx`
  „sygnalizacja” green/yellow/red; fallback loga w `company-logo.tsx` losuje 7 par hex.
- Werdykt: czerwony = polska, szary = zagraniczna. Poprawne, ale czerwień pełni jednocześnie
  rolę koloru marki, przycisków, błędów i „polskości” — nie ma hierarchii.
- Stopka `#020617` (prawie czarna) i sekcja wsparcia z gradientem `slate-900 → red-950` z
  rozmytymi kołami w tle (`blur-2xl`, `opacity-[0.03]`) — to estetyka Vercel/Linear, której
  chcesz uniknąć. Okładki bloga (`tools/okladka-szablon.html`) też są ciemno-granatowe z czerwonym
  gradientem i gryzą się z jasną stroną.

**Typografia**
- Inter wszędzie, Playfair Display doklejony tylko w blogu przez `[font-family:var(--font-playfair)]`
  — wygląda jak sklejka dwóch szablonów.
- Jeden mikro-wzorzec etykiety (`text-xs uppercase tracking-wide text-slate-500`) w każdym komponencie.
- Nazwy firm w `CompanyCard.tsx` i `CompanyHero.tsx` na siłę `uppercase tracking-wide`.
- Brak skali: h1 na stronie głównej ma 30–36 px, w hero profilu 24–30 px; sekcje wyglądają jednakowo.

**Karty, cienie, promienie**
- `rounded-xl/2xl/3xl` + `shadow-sm/lg/xl` na wszystkim: hero, diagram, meta, alternatywy,
  FAQ, blog, metodologia (`rounded-2xl shadow-xl`), wsparcie (`rounded-3xl`).
- Karta firmy (`CompanyCard.tsx`) jest pigułką `rounded-full` z podwójnym cieniem — na liście
  76 pigułek pod rząd.
- Tło strony to gradient `from-white to-slate-50`, profil ma gradient na całym `<main>`.

**Ikony i ozdobniki**
- Ikona w kolorowym kółku w 7+ miejscach (`how-it-works`, `methodology`, `WhyPolish`,
  `CompanyHero`, `global-stats`, `blog/[slug]`, `CompanyMetaDetails`).
- Ikona „iskierek” (Sparkles) na badge „Najnowszy” — najbardziej „AI-owy” symbol, jaki istnieje.
- Emoji flag i `✅/❌` jako wartości w `category-page-view.tsx`.
- Flagi z flagcdn na każdym elemencie, także na pigułkach w hero — 10 flag na ekranie
  to już biało-czerwony kicz, którego chcesz uniknąć.

**Układ sekcji**
- Wszystko wyśrodkowane (hero, „Jak to działa”, stats, metodologia) — typowy landing z generatora.
- Strona główna = hero z wyszukiwarką → 3 kafle statystyk → 3 kroki → 3 wpisy → 3 zasady →
  „Dlaczego warto” → formularz → wsparcie → FAQ. Każda sekcja to grid 3 kart.
- Profil firmy: to, co najważniejsze (werdykt), jest H2 wewnątrz karty w szarej kapitalikowej
  etykiecie; „podsumowanie” pod FAQ jest wyszarzone jak drobny druk (`text-sm text-slate-400`),
  czyli treść SEO widoczna jako „wypełniacz”.

**Teksty w interfejsie**
- „Twoje pieniądze mają moc!” (`app/blog/[slug]`, meta description w `layout.tsx`),
  „Wesprzyj nasze działania!”, „Każda cegiełka ma znaczenie”, „inwestycja w naszą wspólną
  przyszłość”, „Pomóż nam budować największą bazę…”. Wykrzykniki i patos, zero konkretu.
- Etykiety typu „Statystyki projektu / Podsumowanie danych z naszej bazy” — nic nie mówią.

Co działa i zostaje: jasne tło, wyszukiwarka w centrum uwagi, struktura profilu (werdykt →
opis → diagram → dane rejestrowe → alternatywy → FAQ), hierarchia nagłówków i teksty opisów
(nie ruszam ze względu na SEO).

---

## 2. Co bierzemy z Notion (a czego nie)

Bierzemy zasady: czysta biel lub papier, tekst prawie czarny (nie szary), **linie 1 px i szare
wypełnienia zamiast cieni**, jeden kolor akcentu używany rzadko, duże, ciasno złożone tytuły,
dużo światła, pigułki w szarości, listy z separatorami zamiast siatek kart,
serif jako akcent redakcyjny (Notion robi to w tytule bloga „Tools & Craft”
i w cytacie w stopce). Notion prawie nie używa cieni, gradientów ani ikon w kółkach.

Nie bierzemy: niebieskiego akcentu, ilustracji i postaci-ludzików (nie będzie własnych rysunków), układów 1:1, karuzel logotypów.

---

## 3. Trzy kierunki

Wspólne dla wszystkich: hierarchia H1/H2/H3, treści opisów, adresy i metadane bez zmian;
lucide zostaje w drobnych elementach; kontrast AA (akcenty dobrane tak, by na tle miały
≥ 4,5:1 dla tekstu); ciemny motyw do zrobienia w Etapie 2 przez tokeny.

### A · „Kartoteka”

- **Idea:** serwis jako kartoteka śledcza. Najwierniejsze przeniesienie Notion: biel, atrament,
  linie 1 px, szare wypełnienia, brak cieni. Chłodne, precyzyjne, „rejestrowe”.
- **Paleta:** tło `#fff`, tło 2 `#f7f6f3`, linie `#e7e4de`, atrament `#1a1918`, tekst 2 `#5e5b55`,
  akcent ceglasty `#b42318` (jeden, używany na werdykcie „polska”, słupkach udziału PL, jednym
  przycisku). Zagraniczna = atrament, nie kolor.
- **Fonty:** Inter Tight (tytuły, ciasne), Inter (tekst), Geist Mono (NIP/KRS, etykiety, daty).
  Uwaga: `geist` jest już w `package.json`.
- **Układ:** hero wyrównany do lewej z przykładowym wynikiem po prawej; kategorie jako **lista z separatorami
  i paskiem udziału PL** zamiast pigułek; statystyki jako słupek krajów + poziome słupki kategorii;
  profil dwukolumnowy z tabelą faktów po prawej (na mobile tabela idzie nad tekst).
- **Diagram właścicielski:** pionowy rejestr z numerowanymi węzłami, kraj i udział po prawej,
  **spółka pośrednicząca w raju podatkowym jako węzeł kropkowany „pomijana”** — czyli zasada 1
  widoczna w grafice (Żabka: CVC → Heket Topco Luksemburg → Żabka Group → Żabka).
- **Zamiast ilustracji:** w hero „Przykładowy wynik” — karta Żabki ze ścieżką kapitału (CVC →
  pośrednik w Luksemburgu → Żabka) i trzy zaskakujące marki. Okładki bloga typograficzne: etykieta,
  tytuł, kraj i jedna liczba.
- **Czym się różni:** najgęstszy i najbardziej „narzędziowy”; najmniej ryzykowny; najbliżej
  Notion; najłatwiejszy do wdrożenia na obecnych komponentach Radix.

### B · „Redakcja”

- **Idea:** głos gazety śledczej. Spokój Notion, ale papier zamiast bieli, serif w tytułach,
  linie włosowe zamiast kart, kapitaliki, przypisy ze źródłami, oś czasu właścicieli.
  Buduje zaufanie „rzetelnością”, nie „aplikacyjnością”.
- **Paleta:** papier `#fbfaf6`, papier 2 `#f3f1ea`, linie `#dcd8ce`, atrament `#14130f`,
  tekst 2 `#55524b`, akcent karminowy `#a61b2b` (na linijkach, numerach, kursywie w tytule, jednym
  przycisku obrysowym).
- **Fonty:** IBM Plex Serif (tytuły, numerały), IBM Plex Sans (tekst), IBM Plex Mono (dane).
  Jedna rodzina, pełne polskie znaki, wyraźnie inna od Inter.
- **Układ:** hero wyśrodkowany z dużym serifowym pytaniem i wyszukiwarką „na linii”; kategorie jako
  trzykolumnowy spis treści; statystyki jako **duże serifowe numerały**; blog jako „wydanie”
  (jeden duży + trzy krótkie); profil jako artykuł z **marginaliami** (fakty, NIP, przypis).
- **Diagram właścicielski:** „Od półki do właściciela” w liniach włosowych + **oś czasu
  właścicieli marki** (Wedel: 1851 → 1949 → 1991 PepsiCo → 1999 Cadbury → 2010 LOTTE) — zasada
  złotej klatki jako grafika. Lata przejęć w makiecie do potwierdzenia przed wdrożeniem.
- **Zamiast ilustracji:** gazetowa tabela „Z kartoteki” — sześć marek, właściciel, kraj, werdykt
  kursywą. Okładka bloga jak czołówka gazety: duży serifowy tytuł na papierze i pasek liczb.
- **Czym się różni:** najbardziej „własny” i najdalszy od szablonów AI; jedyny z serifem i papierem;
  najwięcej tekstu na ekranie, więc wymaga dyscypliny na mobile; najlepiej pasuje do bloga i
  do okładek.

### C · „Półka”

- **Idea:** Notion w wersji dla konsumenta na telefonie. Metafora półki sklepowej i **metki z
  werdyktem**. Cieplej, okrąglej, większe pola dotykowe, ale nadal bez cieni i gradientów.
- **Paleta:** biel `#fff`, ciepłe tło `#f6f3ee`, ciepła szarość `#ece7df`, linie `#e4dfd6`,
  atrament `#1f1d1a`, akcent pomidorowa cegła `#c2381f` (metka „polska firma”, przycisk),
  grafit `#3b3833` (metka „zagraniczna”), żółć naklejki `#f2c14e` tylko w drobiazgach.
- **Fonty:** Manrope (wszystko, 400–800; cyfry tabelaryczne w danych). Geometryczny, przyjazny,
  wyraźnie inny od Inter i od Plexa.
- **Układ:** wyszukiwarka-pigułka, popularne firmy jako **przewijana półka** na mobile, kategorie
  jako kafle z pigułką „xx% PL”, statystyki jako **waffle „koszyk 750 firm”** (1 kwadrat = 1%) i
  **półki** (czerwony towar = polski kapitał); profil z werdyktem-metką i rzędem faktów.
- **Diagram właścicielski:** łańcuch metek na sznurku (Reserved → LPP S.A. → Fundacja Semper Simul,
  31,2% kapitału / 60,8% głosów) — zasada efektywnej kontroli jako grafika; rodzina marek LPP z logami.
- **Zamiast ilustracji:** „Tak wygląda wynik” — stos metek z logami (Allegro, Żabka, Wedel, ORLEN)
  i werdyktem. Okładki bloga na ciepłym tle z metką kraju i jedną liczbą.
- **Czym się różni:** najbardziej mobilny i konsumencki; najwięcej koloru (wciąż tylko 1 akcent +
  1 dodatek); najbardziej odległy od „rejestru”, najbliższy social mediom; ryzyko: przy nadmiarze
  pigułek wraca wrażenie „aplikacji z generatora”, więc trzeba trzymać dyscyplinę.

**Możliwe połączenia:** A + serif z B w tytułach i blogu (najbezpieczniejsze „własne” DNA);
B na profilach i blogu + C na stronie głównej i kategoriach (dwa rejestry: śledczy i konsumencki);
A z diagramem „metek” z C.

---

## 4. Bez własnych rysunków: z czego budujemy tożsamość

Założenie po uwagach właściciela (27.09.2026): **nie będzie ilustracji ani zdjęć** — ani od
ilustratora, ani własnych. Żaden z kierunków nie ma więc miejsc „na obrazek”. Wszystko, co widać,
powstaje automatycznie z bazy, z logotypów w `public/logos/` i z typografii.

Pierwsza wersja makiet miała w hero próbki rysunków SVG i puste pola na okładki. Zostały usunięte
i zastąpione elementami z danych:

| Miejsce | A · Kartoteka | B · Redakcja | C · Półka |
|---------|---------------|--------------|-----------|
| Hero, prawa strona / pod wyszukiwarką | karta „Przykładowy wynik” ze ścieżką kapitału | tabela „Z kartoteki” (6 marek) | stos metek z logami |
| Okładki bloga | typograficzne: etykieta, tytuł, kraj, liczba | czołówka gazety na papierze | ciepłe tło, metka kraju, liczba |
| Statystyki | słupek krajów + słupki kategorii | duże numerały + słupki | waffle „koszyk 750 firm” + półki |
| Profil firmy | diagram-rejestr z pomijanym rajem | ścieżka + oś czasu właścicieli | łańcuch metek + rodzina marek z logami |

Dlaczego to wystarczy: wartością serwisu są dane, których nikt inny nie ma. Wykres udziału
polskiego kapitału, ścieżka właścicielska i metka z werdyktem są rozpoznawalne i nie da się ich
pomylić z szablonem, bo szablon nie ma tych danych. Typografia i jeden kolor akcentu robią resztę,
tak jak w Notion.

Co w aplikacji będzie generowane z bazy:

- **Przykładowy wynik / tabela / metki w hero** — top odsłon z `get_popular_companies` (już
  pobierane w `app/page.tsx`), z właścicielem i krajem.
- **Okładki bloga** — obecny `tools/render-blog-cover.mjs` renderuje HTML przez puppeteer, więc
  wystarczy nowy `tools/okladka-szablon.html` w stylu wybranego kierunku. Dane (tytuł, kraj, liczby)
  już przekazuje `okladka-wpisu.mjs`.
- **Obrazki OG profili** (`app/firma/[slug]/opengraph-image.tsx`) — ta sama metka z werdyktem.
- **Spoty ikon** zostają z lucide, w jednym kolorze tekstu, bez kolorowych kółek.

---

## 5. Spójność z okładkami bloga i szablonami social

- `tools/okladka-szablon.html` (granat `#0a0d1a` + czerwony gradient, pasy góra/dół, flaga) i
  szablony w `docs/szablony/` (tailwind, karty z cieniami, zielone „Polska”) są w **innej
  estetyce** niż wszystkie trzy kierunki. Po wyborze kierunku proponuję: okładka na tle
  kierunku (biel / papier / ciepła szarość), tytuł w foncie kierunku, jeden pasek akcentu, rząd
  3 liczb w mono/serif. Bez zdjęć — przykłady widać w sekcji bloga na makietach stron głównych.
  Zmiana dotyczy tylko CSS w szablonie; `render-blog-cover.mjs` bez zmian.
- Szablony social: ten sam zestaw tokenów (kolory, font, metka werdyktu), bez cieni, werdykt
  zawsze tą samą metką co na stronie. To zamknie pętlę: to, co ktoś widzi na X, wygląda jak
  profil, na który klika.

---

## 6. Co dalej (Etap 2, po Twojej decyzji)

Kolejność z zadania: tokeny i typografia w `app/globals.css` + `next/font` → profil firmy z
diagramem → nagłówek, stopka, strona główna → kategoria, blog → pierwsze grafiki z danych →
`docs/DESIGN_SYSTEM.md`. Po każdym kroku: `npm run lint`, `npm run build`, zrzuty jasny/ciemny,
desktop/mobile, commit tylko własnych plików na `develop`.

Napisz, który kierunek (lub jaka mieszanka) — i czy diagram właścicielski ma być z A (rejestr z
pomijanym rajem), z B (oś czasu właścicieli) czy z C (łańcuch metek). Można też wziąć wszystkie
trzy jako warianty zależne od danych firmy (raj podatkowy → A, historia przejęć → B, prosty
polski właściciel → C).
