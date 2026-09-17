# Strategia wzrostu CzyPolskaFirma

> Cel: ruch na stronę, rozpoznawalność jako wiarygodne narzędzie, droga do współprac i grantów.
> Ograniczenia: pełna anonimowość, 5–8 h/tydzień. Budżet: X Premium (aktywne).
> Wersja 3 — po uruchomieniu automatu treści i automatu firm (2026-09-17).
> Zmiana względem wersji 2: paczki X/FB powstają w codziennym automacie treści (GitHub Actions),
> więc niedzielna sesja z `generator-postow` i codzienny `komentator-x` przestały być rytuałem.

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

1. **Automat treści** (`.github/workflows/codzienna-tresc.yml`, opis w
   `docs/AUTOMATYZACJA_TRESCI.md`) — codzienna paczka: wpis blogowy + wersja X + wersja FB
   w pull requeście. Publikacja to kopiuj-wklej z opisu PR-a. To on zastąpił paczki
   z `generator-postow`.
2. **Skill `komentator-x`** — „poranny przegląd X": narzędzie na wolne 15 minut, nie rytuał.
   Wymaga Ciebie i zalogowanego Chrome; oddaje gotowe komentarze i kandydatów do bazy.
   Skill `generator-postow` zostaje w repo jako zapas (np. quizy, zestawienia poza automatem).
3. **Skill `lowca-newsow`** — szuka newsów o polskich firmach (przejęcia, kontrakty,
   ekspansja) i pisze z nich dłuższe wpisy X/FB oraz **wersję blogową**. Wersja blogowa
   ląduje jako plik `.md` w `content/blog/` (frontmatter: `title`, `slug`, `date`,
   `description`, `relatedCompanies`, opcjonalnie `image`/`imageAlt` — wzorzec
   i zasady doboru zdjęć w `content/blog/_szablon.md`)
   i po deployu pojawia się na `/blog` (+ sitemap automatycznie).
4. **Generator grafik** (`/narzedzia/generator`) — tryb
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

### Codziennie rano (~3 min)
Pull request z automatu treści: sprawdź sekcję „Weryfikacja faktów", skopiuj wpis na X
i wersję FB z opisu PR-a, scal (wpis ląduje na `develop`). Nietrafiony PR zamknij.
Kandydatów z sekcji „Kandydaci do bazy" dopisuj do listy dla automatu firm.

### Raz w tygodniu (~45 min)
Partia firm w automacie (`docs/SOP_dodawanie_firm.md`): przegląd konfliktów, konsylium
w innych modelach, import. Opcjonalnie `komentator-x`, gdy jest na to czas.

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
| Automat treści (blog + X + FB, codziennie, PR) | ✅ działa |
| Automat firm `tools/firmy/` (dodawanie i re-weryfikacja) | ✅ działa |
| Skill generator-postow (paczki postów z bazy) | zapas, poza rytuałem od 09.2026 |
| Generator grafik: tryb Karta firmy + Zestawienie/VS | ✅ działa |
| Skill komentator-x (wątki + komentarze + kandydaci do bazy) | ✅ działa |
| **Audyt SEO profili firm** (title/meta/dane strukturalne pod „czy [marka] to polska firma") | ⏳ następny |
| Kolejka kandydatów: automat treści → automat firm | ⏳ następny |

## 8. Zasada 90 dni

Przez pierwsze 3 miesiące nie zmieniamy systemu, tylko treści wewnątrz niego.
Algorytmy i SEO nagradzają regularność później, niż byśmy chcieli.
