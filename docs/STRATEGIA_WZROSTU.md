# Strategia wzrostu CzyPolskaFirma

> Cel: ruch na stronę, rozpoznawalność jako wiarygodne narzędzie, droga do współprac i grantów.
> Ograniczenia: pełna anonimowość, 5–8 h/tydzień, budżet ~0 zł (opcjonalnie X Premium ~45 zł/mies.).

---

## 1. Fundament strategiczny

**Twoja przewaga to baza danych, nie osobowość.** Anonimowość nie jest problemem — jest pozycjonowaniem. Marka = „bezosobowy weryfikator faktów o kapitale". Wzorce: Demagog, konta danych na X. Zaufanie budują: źródła (KRS, raporty), spójna metodologia (masz ją w SOP), przyznawanie się do korekt.

**Kluczowa obserwacja:** baza firm w Supabase (`ultimate_owner`, `ownership_description`, `country_code`, kategorie, loga) to **maszyna do treści**. Każda firma = 3–5 potencjalnych postów. Przy ~100+ firmach masz materiał na ponad rok bez „wymyślania" czegokolwiek. Problem „nie wiem co wrzucać" rozwiązujemy szablonami, a nie kreatywnością.

---

## 2. Kanały

| Kanał | Rola | Priorytet |
|---|---|---|
| **X** | Główny kanał zasięgowy, komentarze pod dużymi kontami, newsjacking | P1 |
| **Facebook (strona + grupy)** | Grupy typu „Kupuję polskie produkty" — gotowa, duża, idealnie stargetowana publiczność | P1 |
| **Wykop** | Demografia idealna dla tematu; dobre znalezisko/mikroblog potrafi dać tysiące wejść w dzień | P2 — niski koszt, wysoka wariancja |
| **SEO (strona)** | Frazy „czy [marka] to polska firma" — masz już strony `/firma/[slug]`; długoterminowo największe źródło ruchu | P1 techniczny (jednorazowa praca, potem samo rośnie) |

Nie wchodzimy: TikTok, IG, YouTube — wymagają wideo/wizerunku lub nieproporcjonalnego nakładu.

**X Premium (Basic, ~45 zł/mies.):** warto — dłuższe posty (zestawienia), priorytet odpowiedzi w wątkach (kluczowe dla strategii komentowania), analityka. To jedyny rekomendowany wydatek.

---

## 3. Silnik treści — 6 powtarzalnych formatów

Każdy post = szablon + dane z bazy. Zero pustej kartki.

1. **„Zaskoczenie"** — marka postrzegana jako polska, a jest zagraniczna (Złota Klatka: Wedel, Żabka…). Najbardziej viralowy format. Struktura: hook → kto naprawdę jest właścicielem → link do profilu.
2. **„Odwrotka"** — brzmi zagranicznie, jest polska (np. marki z anglojęzycznymi nazwami). Buduje sympatię, nie tylko kontrowersję.
3. **Quiz/ankieta** (natywne ankiety X i FB) — „Która z tych 4 marek jest polska?". Ankiety mają ponadprzeciętny zasięg; odpowiedź następnego dnia z linkiem.
4. **Pojedynek kategorii** — „Kupujesz farby? [A] vs [B] — tylko jedna jest polska". Praktyczny, shareowalny.
5. **Zestawienie** — „5 polskich alternatyw dla [popularna zagraniczna marka/kategoria]". Najlepszy format do grup FB i Wykopu.
6. **Newsjacking** — przejęcie firmy, wyniki finansowe, bojkot w trendach → szybki post z twardymi danymi z bazy. Jedyny format „reaktywny"; największe skoki zasięgu.

**Grafiki:** jeden szablon „karty werdyktu" (logo, marka, flaga, ostateczny właściciel, link) generowany automatycznie — loga już masz w repo. Spójny wygląd = rozpoznawalność. To narzędzie nr 2 do zbudowania (sekcja 7).

---

## 4. Tygodniowy system (5–8 h)

Zasada: **twórz partiami, publikuj automatem, komentuj krótko a codziennie.**

| Kiedy | Co | Czas |
|---|---|---|
| **Niedziela lub pon. (blok)** | Sesja z Claude: wygeneruj 6–8 postów z bazy wg formatów, dopracuj, zaplanuj w natywnych schedulerach (X ma planowanie postów, Meta Business Suite — darmowy) | 2 h |
| **Codziennie** | 15–20 min: przejrzyj listę wątków-kandydatów (sekcja 5), zostaw 2–3 merytoryczne komentarze | ~2 h/tydz. |
| **1× w tygodniu** | Newsjacking lub wrzutka do 2–3 grup FB / Wykopu (format „zestawienie") | 1 h |
| **Co 2 tygodnie** | Dłuższy materiał: wątek na X (10 firm z jednej kategorii) lub krótki artykuł na stronie pod SEO | 1–1,5 h |
| **1× w miesiącu** | Przegląd metryk (30 min): co zażarło → podwoić, co umarło → wyciąć | 0,5 h |

**Rytm publikacji:** 4–5 postów/tydz. na X, 3/tydz. na FB (te same treści, dostosowany format). Stały układ zabija paraliż decyzyjny, np.: pon — zaskoczenie, śr — quiz, czw — odpowiedź do quizu + link, pt — zestawienie/pojedynek, weekend — odwrotka.

**Antyblokada motywacyjna:** utrzymuj bufor 2 tygodni zaplanowanych postów. Definicja tygodnia-minimum (gdy brak siły): 3 posty z bufora + 5 komentarzy. To nadal rośnie.

---

## 5. System komentowania (rozwiązanie problemu „gdzie komentować")

Nie szukaj ręcznie — zbuduj lejek kandydatów:

- **Zapisane wyszukiwania na X** (sprawdzane w 5 min): `"polska firma"`, `"polski kapitał"`, `"czy [duża marka] jest polska"`, `bojkot`, nazwy głośnych marek z bazy, `"niemiecka sieć"`, `"kupuję polskie"`.
- **Obserwuj i włączaj powiadomienia** dla ~15 kont: ekonomiczni komentatorzy, konta patriotyczno-gospodarcze, dziennikarze biznesowi. Szybki, merytoryczny reply pod świeżym postem dużego konta = najtańszy zasięg na X.
- **Google Alerts** (darmowe): „polski kapitał", „przejęcie polskiej firmy", nazwy top marek.
- Zasada komentarza: **konkret z bazy w pierwszym zdaniu** (kto jest ostatecznym właścicielem, %), link tylko gdy naturalnie pasuje. Komentarz-reklama = ban w grupach i mute na X.

Docelowo automatyzujemy to skillem „thread-finder" (sekcja 7).

---

## 6. Droga do współprac i grantów

Kolejność: **najpierw dowód trakcji, potem outreach.** Progi orientacyjne: ~1000 obserwujących łącznie lub ~10 tys. odsłon/mies.

1. **Już teraz:** e-mail domenowy (kontakt@czypolskafirma.pl), podstrona „Współpraca" z metodologią i kontaktem — organizacje muszą móc Cię znaleźć i zweryfikować powagę projektu bez Twojej tożsamości.
2. **Po osiągnięciu progu:** jednostronicowy media kit (misja, metodologia, statystyki ruchu i zasięgów, przykłady treści) — PDF do wysyłania.
3. **Cele outreachu:** organizacje promujące polski kapitał i przedsiębiorczość, media ekonomiczne (dostarczanie danych do artykułów = linki + wiarygodność), twórcy o pokrewnej tematyce (wzajemne udostępnienia).
4. **Granty:** publiczne środki (np. konkursy NIW-CRSO dla organizacji społeczeństwa obywatelskiego) zwykle wymagają osobowości prawnej — na tym etapie zapisuj metryki co miesiąc (będą potrzebne do każdego wniosku), decyzję o fundacji/stowarzyszeniu odłóż do momentu realnej trakcji. Uwaga: formalizacja ogranicza pełną anonimowość (dane w KRS) — do przemyślenia, gdy przyjdzie czas.

---

## 7. Narzędzia do zbudowania (backlog, kolejne sesje)

| # | Narzędzie | Co robi | Efekt |
|---|---|---|---|
| 1 | **Skill „generator-postow"** | Czyta bazę (eksport CSV/Supabase), losuje firmy wg formatów z sekcji 3, generuje tygodniową paczkę postów w wariantach X/FB + proponowany harmonogram | Blok niedzielny z 2 h → 45 min |
| 2 | **Generator kart werdyktu** | Skrypt Node (HTML→PNG): logo + werdykt + właściciel w spójnym szablonie graficznym | Rozpoznawalny branding bez grafika |
| 3 | **Skill „thread-finder"** | Zbiera świeże wątki/artykuły pod frazy z sekcji 5, ocenia potencjał, proponuje draft komentarza z danymi z bazy | 20 min komentowania → 10 min, zero szukania |
| 4 | **Audyt SEO profili firm** | Sprawdzenie title/meta/nagłówków `/firma/[slug]` pod frazę „czy [marka] to polska firma" + dane strukturalne | Pasywny ruch z Google rosnący z każdym miesiącem |

Rekomendowana kolejność: 1 → 4 → 2 → 3. Publikacja przez schedulery natywne (nie API) — API X w darmowym planie jest ograniczone, a Meta wymaga review aplikacji; nie warto na start.

---

## 8. Metryki sukcesu (przegląd 1× mies.)

- Ruch na stronę (Vercel Analytics / GA) — cel: stały wzrost m/m
- Obserwujący X + FB, zasięgi top 3 postów
- Które formaty mają najlepszy stosunek zasięg/czas → alokacja na następny miesiąc
- Kliknięcia z social do strony (UTM-y w linkach: `?utm_source=x` itd.)

**Zasada 90 dni:** przez pierwsze 3 miesiące nie zmieniaj systemu, tylko formaty wewnątrz niego. Algorytmy i SEO nagradzają regularność później, niż byśmy chcieli.
