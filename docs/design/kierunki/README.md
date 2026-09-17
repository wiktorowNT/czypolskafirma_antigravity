# Nowy wygląd CzyPolskaFirma — Etap 1: diagnoza i trzy kierunki

Stan: **czekam na wybór kierunku** (albo połączenia kilku). Kod aplikacji nie był ruszany.

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
dużo światła, pigułki w szarości, listy z separatorami zamiast siatek kart, ilustracje z kreski
z jedną plamą koloru, serif jako akcent redakcyjny (Notion robi to w tytule bloga „Tools & Craft”
i w cytacie w stopce). Notion prawie nie używa cieni, gradientów ani ikon w kółkach.

Nie bierzemy: niebieskiego akcentu, ich postaci-ludzików, układów 1:1, karuzel logotypów.

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
- **Układ:** hero wyrównany do lewej z ilustracją po prawej; kategorie jako **lista z separatorami
  i paskiem udziału PL** zamiast pigułek; statystyki jako słupek krajów + poziome słupki kategorii;
  profil dwukolumnowy z tabelą faktów po prawej (na mobile tabela idzie nad tekst).
- **Diagram właścicielski:** pionowy rejestr z numerowanymi węzłami, kraj i udział po prawej,
  **spółka pośrednicząca w raju podatkowym jako węzeł kropkowany „pomijana”** — czyli zasada 1
  widoczna w grafice (Żabka: CVC → Heket Topco Luksemburg → Żabka Group → Żabka).
- **Ilustracje:** kreska 1,5 px + jedna plama czerwieni, przedmioty (karty, szuflady, lupa, pieczątki),
  bez postaci.
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
- **Ilustracje:** dwubarwny linoryt (atrament + karmin, kreskowanie kolorem papieru), przedmioty
  codzienne: koszyk, produkt, witryna, metka.
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
- **Ilustracje:** płaskie naklejki (dwa wypełnienia + kontur 2 px): produkty z półki, metki, koszyk.
- **Czym się różni:** najbardziej mobilny i konsumencki; najwięcej koloru (wciąż tylko 1 akcent +
  1 dodatek); najbardziej odległy od „rejestru”, najbliższy social mediom; ryzyko: przy nadmiarze
  pigułek wraca wrażenie „aplikacji z generatora”, więc trzeba trzymać dyscyplinę.

**Możliwe połączenia:** A + serif z B w tytułach i blogu (najbezpieczniejsze „własne” DNA);
B na profilach i blogu + C na stronie głównej i kategoriach (dwa rejestry: śledczy i konsumencki);
A z diagramem „metek” z C.

---

## 4. Ilustracje: uczciwa ocena SVG z kodu

W każdej makiecie jest jedna próbka SVG narysowana kodem (hero). Ocena:

- **Przedmioty i ikony-spoty** (karta w kartotece, koszyk, produkty na półce, metka) — kodem da się
  zrobić poziom „czysty, rozpoznawalny, spójny”, wystarczający na spoty 80–200 px, nagłówki
  kategorii, puste stany, 404. To widać w makietach: nie wstydzą się, ale nie udają ręki.
- **Postacie, dłonie, sceny, faktura ręcznej kreski** — kodem wychodzą sztywno i to jest widoczne
  natychmiast. Nie wstawiam ich. Duże ilustracje przewodnie (hero strony głównej, „O projekcie”,
  okładki cykli na blogu) powinny być **narysowane ręcznie** (Ty albo ilustrator) według
  poniższego przewodnika. W makietach miejsca na nie są oznaczone jako `figure.ill` / `figure.plate`
  z podpisem „szkic SVG”.
- Grafiki z danych (diagramy właścicielskie, słupki, waffle, oś czasu) — to nasza najmocniejsza
  i najbardziej autentyczna warstwa wizualna, bo nikt inny nie ma tych danych. Robimy je kodem,
  w React, z danych z Supabase. Wszystkie trzy w makietach są gotowe do przeniesienia.

### Przewodnik po stylu ilustracji (wspólny, z wariantami per kierunek)

- **Kreska:** jedna grubość na ilustrację (A: 1,5 px atrament; B: bez konturu, bryły i
  kreskowanie; C: kontur 2 px). Zaokrąglone końce i łączenia. Bez gradientów, bez cieni.
- **Kolor:** maks. 3: atrament, tło (biel/papier/ciepła szarość) i jeden akcent (czerwień
  kierunku). W C dopuszczalna żółć naklejki jako czwarty w 5% powierzchni.
- **Motywy:** przedmioty codzienne i „śledcze”: półka, koszyk, produkty (mleko, czekolada, butelka,
  wieszak, dystrybutor), metki, paragony, pieczątki, teczki, lupa, mapa z pinezką, łańcuch/sznurek.
  **Bez** orłów, flag jako motywu, konturu Polski, biało-czerwonych pasów. Polskość pokazujemy
  danymi (werdykt, kraj), nie symbolami.
- **Proporcje:** kadr 4:3 lub 3:2, obiekt zajmuje 60–70% kadru, linia podłogi/półki jako jedyny
  element sceny. Perspektywa płaska (frontalna lub lekki izometr), bez punktów zbiegu.
- **Postacie (tylko ręcznie):** bez twarzy lub z dwoma kropkami, prosta sylwetka, jedna plama koloru
  na ubraniu; zawsze w relacji z produktem (trzyma, ogląda, odwraca metkę).
- **Format dostawy:** SVG (ścieżki, bez rastrów) lub PNG 2× z przezroczystym tłem; skan ręcznego
  rysunku 300 dpi, czarny tusz na białym, później wektoryzacja.

### Lista potrzebnych ilustracji

| # | Miejsce | Co przedstawia | Format |
|---|---------|----------------|--------|
| 1 | Hero strony głównej | Ktoś odwraca produkt / metkę, żeby zobaczyć, kto za nim stoi | 4:3, duża |
| 2 | Hero „O projekcie” | Biurko z rejestrami, lupą i notesem — praca śledcza | 3:2, duża |
| 3 | Metodologia — 3 zasady | (1) piramida/schody do szczytu, (2) waga z pakietem 51%, (3) złota klatka z marką w środku | 3 spoty 1:1 |
| 4 | „Jak to działa” — 3 kroki | Wpisujesz nazwę, dostajesz metkę, sięgasz po alternatywę z półki | 3 spoty 1:1 |
| 5 | Nagłówki 19 kategorii | Po jednym przedmiocie na kategorię (bochenek, wieszak, cegła, pigułka, wtyczka…) | 19 spotów 1:1 |
| 6 | Pusty stan wyszukiwania / 404 | Pusta półka z metką „?” | 1:1 |
| 7 | „Zgłoś firmę” | Koperta lub paragon z długopisem | 1:1 |
| 8 | Wsparcie projektu | Kubek kawy na stosie rejestrów (spokojnie, bez serduszek) | 1:1 |
| 9 | Werdykt (2 warianty) | Metka „polska” i metka „zagraniczna” — jako element systemu, nie ilustracja | SVG systemowe |
| 10 | Blog — domyślna okładka cyklu | Motyw kierunku (koszyk / kartoteka / półka) w wersji 1200×630 | 1200×630 |

### Gdzie Twoje własne materiały dadzą najwięcej

Brief (wszystko na telefon w dobrym świetle, bez filtrów, poziomo, min. 3000 px dłuższy bok):

1. **Półki sklepowe** — 15–20 zdjęć półek z widocznymi markami z jednej kategorii (ketchupy,
   czekolady, mleko, piwo, proszki). Frontalnie, bez ludzi, bez cen jeśli się da. Użycie: okładki
   bloga i grafiki social (szablony „półka”, „vs”), hero kategorii, sekcja „Co stoi na półce”.
2. **Produkt na białym** — 30 produktów polskich i zagranicznych „bliźniaków” (Wedel vs Wawel,
   Żabka vs Dino torba, Tymbark vs Hortex): na białej kartce, światło z okna, z góry i z przodu.
   Użycie: porównania w blogu, karty „alternatywy”, kierunek C.
3. **Ręczne szkice** — Twoje szkice diagramów właścicielskich w notesie (strzałki, procenty,
   przekreślony raj podatkowy). Skan 300 dpi. Użycie: „O projekcie”, metodologia, okładki bloga
   jako tło; to najsilniejszy sygnał „to robi człowiek”.
4. **Warsztat** — 3–5 zdjęć biurka z otwartymi rejestrami (KRS na ekranie, wydruki, notes),
   bez twarzy. Użycie: „O projekcie”, sekcja wsparcia.
5. **Zdjęcia z ulicy** — szyldy i witryny znanych marek (Żabka, Wedel, Rossmann) w polskim
   kontekście. Użycie: okładki newsów o przejęciach.

Format dostawy: JPG oryginały do `docs/design/foto/` (poza repo, np. Drive — patrz
`BACKUP_STRATEGY.md`), do strony trafiają wersje WebP ≤ 200 KB.

---

## 5. Spójność z okładkami bloga i szablonami social

- `tools/okladka-szablon.html` (granat `#0a0d1a` + czerwony gradient, pasy góra/dół, flaga) i
  szablony w `docs/szablony/` (tailwind, karty z cieniami, zielone „Polska”) są w **innej
  estetyce** niż wszystkie trzy kierunki. Po wyborze kierunku proponuję: okładka na tle
  kierunku (biel / papier / ciepła szarość), tytuł w foncie kierunku, jeden pasek akcentu, rząd
  3 liczb w mono/serif, miejsce na Twoje zdjęcie półki po prawej (1200×630, sekcja 40%).
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
