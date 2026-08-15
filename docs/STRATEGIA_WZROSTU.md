# Strategia wzrostu CzyPolskaFirma

> Cel: ruch na stronę, rozpoznawalność jako wiarygodne narzędzie, droga do współprac i grantów.
> Ograniczenia: pełna anonimowość, 5–8 h/tydzień. Budżet: X Premium (aktywne).
> Wersja 2 — po zbudowaniu narzędzi (2026-07-12).

---

## 1. Fundament strategiczny

**Przewaga to baza danych (~750 firm i rośnie), nie osobowość.** Anonimowość to
pozycjonowanie: marka = bezosobowy weryfikator faktów o kapitale. Zaufanie budują źródła
(KRS, rejestry), spójna metodologia i przyznawanie się do korekt („dobra i zła wiadomość").

Głos marki (wzorzec zaadaptowany z @deweloperuch): mówimy do społeczności per „Wy",
dane są bohaterem, projekt budujemy publicznie, humor zamiast agresji, pełna naturalność
językowa (zero AI-manier). Szczegóły egzekwuje skill generator-postow.

---

## 2. Kanały

| Kanał | Rola | Status |
|---|---|---|
| **X (Premium)** | Główny kanał: posty + komentarze pod dużymi wątkami (boost odpowiedzi z Premium) | aktywny |
| **Facebook (strona)** | Każdy post X ma dłuższą wersję FB z pytaniem do czytelników | aktywny |
| **Grupy FB / Wykop** | Dystrybucja zestawień („X polskich firm w…") — duży zasięg, zero dodatkowej pracy | do rozkręcenia |
| **SEO (strona)** | Frazy „czy [marka] to polska firma" — profile `/firma/[slug]`; rośnie pasywnie | audyt w backlogu |
| **Blog (`/blog`)** | Miejsce docelowe wersji blogowych ze skilla `lowca-newsow`; SEO na frazy z polskiej gospodarki/biznesu (przejęcia, kapitał, sukcesy firm) | aktywny |

Nie wchodzimy: TikTok, IG, YouTube (wideo/wizerunek).

---

## 3. Arsenał — czym pracujemy

1. **Skill `generator-postow`** — „wygeneruj paczkę postów na tydzień": czyta żywe dane
   ze strony, pilnuje formatów, głosu marki, limitów, UTM-ów i historii użyć
   (bez powtórek firm przez 60 dni). Wynik: `docs/social/paczki/paczka-RRRR-MM-DD.md`.
2. **Skill `komentator-x`** — „poranny przegląd X": znajduje przez Chrome świeże wątki
   (zapisane frazy), weryfikuje firmy (w bazie albo samodzielnie z 2+ źródeł) i oddaje
   gotowe komentarze do ręcznej publikacji + listę kandydatów do bazy.
3. **Skill `lowca-newsow`** — szuka newsów o polskich firmach (przejęcia, kontrakty,
   ekspansja) i pisze z nich dłuższe wpisy X/FB oraz **wersję blogową**. Wersja blogowa
   ląduje jako plik `.md` w `content/blog/` (frontmatter: `title`, `slug`, `date`,
   `description`, `relatedCompanies`, opcjonalnie `image`/`imageAlt` — wzorzec
   i zasady doboru zdjęć w `content/blog/_szablon.md`)
   i po deployu pojawia się na `/blog` (+ sitemap automatycznie).
4. **Generator grafik** (`/narzedzia/generator` lub `Generator.html`) — tryb
   **Karta firmy** (werdykt, właściciel, struktura; 1:1 i 16:9) i tryb **Zestawienie**
   (do 6 firm, karta VS dla pojedynku).
5. **Schedulery natywne** — X scheduler + Meta Business Suite (darmowe).

## 4. Formaty postów (skrót; pełne szablony w skillu)

1. Zaskoczenie (marka „polska", kapitał obcy) · 2. Odwrotka (brzmi obco, kapitał polski) ·
3. Quiz-ankieta · 4. Odpowiedź na quiz · 5. Pojedynek · 6. Zestawienie ·
7. Statystyka kategorii · 8. Długi wpis Premium (mini-artykuł 800–2500 znaków, maks. 1/tydz.) ·
9. 🚨 CZYPOLSKAFIRMA RAPORT 🚨 (build in public, co 2–4 tyg.) · Newsjacking (reaktywnie).

---

## 5. Harmonogram tygodnia (5–8 h)

### Blok niedzielny (~60–90 min)
1. Cowork: „wygeneruj paczkę postów na przyszły tydzień" → przegląd, poprawki po swojemu.
2. Grafiki wg linijek `Grafika:` z paczki → generator (Karta firmy / Zestawienie / VS).
3. Zaplanowanie: posty X → scheduler X; wersje FB → Meta Business Suite. Godziny:
   8:00–9:00, quiz i odpowiedź 17:00–19:00.

### Codziennie rano (~10–15 min)
Cowork + Chrome: „poranny przegląd X" (komentator-x) → opublikuj ręcznie 2–3 komentarze
z pliku, w odstępach. Kandydatów do bazy z pliku dopisuj do pipeline'u firm.

### Plan publikacji

| Dzień | X (Premium) | FB | Grafika (generator) |
|---|---|---|---|
| pon | zaskoczenie | wersja dłuższa | Karta firmy 16:9 / 1:1 |
| wt | quiz (ankieta 24h) | natywna ankieta | 4 loga + „?" |
| śr | odpowiedź na quiz | wersja dłuższa | Karta firmy zwycięzcy |
| czw | pojedynek | wersja dłuższa | karta VS (2 firmy) |
| pt | zestawienie (1 post, bez wątku) | pełna lista | Zestawienie do 6 firm |
| sob | odwrotka | wersja dłuższa | Karta firmy |
| nd | statystyka kategorii / co 2–4 tyg. RAPORT / okazjonalnie długi wpis | wersja dłuższa | duża liczba na kartce / mem |

### Raz w tygodniu (~1 h)
Wrzutka zestawienia do 2–3 grup FB lub na Wykop + ewentualny newsjacking (jeśli coś
głośnego o firmie z bazy — link do profilu pasuje pod każdy duży wątek).

### Raz w miesiącu (30 min)
Metryki: ruch (UTM-y!), obserwujący, top 3 posty, skuteczność komentarzy →
podwoić co działa. Zapisuj liczby — przydadzą się do media kitu i wniosków o granty.

**Antyblokada:** bufor 2 tygodni zaplanowanych postów. Tydzień-minimum przy braku sił:
3 posty z bufora + 5 komentarzy. To nadal rośnie.

---

## 6. Droga do współprac i grantów

Kolejność bez zmian: najpierw trakcja (~1000 obserwujących łącznie lub ~10 tys.
odsłon/mies.), potem outreach. Już teraz: e-mail domenowy + podstrona „Współpraca".
Po progu: jednostronicowy media kit (misja, metodologia, statystyki, przykłady treści).
Cele: organizacje patriotyzmu gospodarczego, media ekonomiczne (dostarczanie danych =
linki + wiarygodność), pokrewni twórcy. Granty (np. NIW-CRSO) wymagają zwykle osobowości
prawnej — decyzja o formalizacji dopiero przy realnej trakcji (uwaga: KRS ogranicza
anonimowość).

---

## 7. Backlog narzędzi

| Narzędzie | Status |
|---|---|
| Skill generator-postow (paczki postów z bazy) | ✅ działa |
| Generator grafik: tryb Karta firmy + Zestawienie/VS | ✅ działa |
| Skill komentator-x (wątki + komentarze + kandydaci do bazy) | ✅ działa |
| **Audyt SEO profili firm** (title/meta/dane strukturalne pod „czy [marka] to polska firma") | ⏳ następny |
| Automatyczna paczka co niedzielę (zadanie cykliczne w Cowork) | opcja — do włączenia na życzenie |

## 8. Zasada 90 dni

Przez pierwsze 3 miesiące nie zmieniamy systemu, tylko treści wewnątrz niego.
Algorytmy i SEO nagradzają regularność później, niż byśmy chcieli.
