# Plan rozwoju CzyPolskaFirma (listopad 2026 – luty 2027)

> Spisany 2026-11-08. Uzupełnia `docs/STRATEGIA_WZROSTU.md` (kanały, formaty, harmonogram tygodnia)
> i zastępuje „co dalej” po zamknięciu backlogu z września (`docs/BACKLOG_2026-09.md`).
> Przypomnienia z datami są w `data/panel/rytm.json`, więc widać je w Centrum projektu.

---

## Diagnoza

- **Narzędzia są gotowe, a rozwoju nie widać.** Od września powstały automat firm, automat treści,
  panel logotypów, panel projektu i skille. Od końca października w repo są już tylko łatki
  (SEO, koszty Vercela). Fabryka działa, ale nie wiemy, czy ktoś kupuje towar.
- **Brak pomiaru.** `data/panel/metryki.json` nie ma ani jednego miesiąca. Strategia wyznacza próg
  (~1000 obserwujących albo ~10 tys. odsłon/mies.), ale nikt go nie sprawdza.
- **Kolejne firmy dają coraz mniej.** Baza jest duża; następne partie po 100 firm to marki,
  których prawie nikt nie wyszukuje.

## Monetyzacja: nie jako cel

- Reklamy przy obecnym ruchu to grosze i psują wiarygodność.
- Płatne odznaki dla firm albo sponsorzy z biznesu zabiłyby niezależność, na której projekt stoi.
- Realnie: najwyżej pokrycie kosztów (zrzutka / Buy Coffee pod hasłem „utrzymanie bazy”).
- Granty wymagają osobowości prawnej, a ta kłóci się z anonimowością, więc temat odłożony.

**Cel projektu: wpływ przy małym nakładzie czasu, nie przychód.** Wartość to rozpoznawalność,
portfolio i możliwe współprace z organizacjami.

---

## Faza 1: teraz do końca grudnia (sezon)

Najlepszy moment w roku dla tego projektu. Pracujemy na treściach, nie na narzędziach.

1. **11 listopada:** jeden mocny materiał, np. „X marek, które uważasz za polskie, a nie są”
   plus odwrotka. Blog + X + FB + wrzutka do grup FB i na Wykop (grafiki z `/narzedzia/generator`).
2. **Black Friday i święta:** przewodnik „polskie prezenty / polskie sklepy” według kategorii,
   linkujący do stron `/kategoria/...`, pod frazy sezonowe.
3. **Raport „Ile polskich marek należy do obcego kapitału, 2026”:** jedna strona z liczbami
   z bazy (udział kapitału według kategorii i krajów, „złote klatki”). Materiał dla mediów:
   cytaty i linki zewnętrzne to dziś największa dźwignia SEO.

## Faza 2: styczeń (mierz, nie buduj)

4. **Metryki raz w miesiącu** (15 min, panel → Metryki): odsłony (Vercel / GSC), kliknięcia z GSC,
   obserwujący X i FB, top 3 treści, źródła ruchu.
5. **Zamrożenie nowych funkcji i narzędzi.** Automaty w trybie minimum: paczki treści jak dotąd,
   partia firm co ~2 tygodnie i tylko marki, które ludzie naprawdę wyszukują
   (kandydaci z newsów, komentarzy i zapytań w GSC).
6. **Aktualność ponad liczbę firm:** re-weryfikacja głośnych przypadków (np. Żabka po wezwaniu
   Couche-Tard). Jedna błędna karta znanej marki kosztuje więcej niż sto brakujących.

## Faza 3: luty (decyzja na liczbach)

- **Ruch rośnie** (orientacyjnie >5 tys. odsłon/mies. albo wyraźny trend wzrostowy):
  media kit, outreach do mediów ekonomicznych jako źródło danych, potem jeden większy pomysł (niżej).
- **Ruch stoi:** świadome przejście w tryb utrzymania, ~1–2 h tygodniowo. Dane aktualne,
  automat treści działa, raport raz w roku. To nie porażka, tylko trwały projekt z misją.

---

## Większe pomysły na później (dopiero po decyzji z lutego)

- **Współpraca z aplikacją Pola** (Klub Jagielloński, skaner kodów kreskowych). Pola ocenia
  producentów z półki; CzyPolskaFirma pokrywa to, czego Pola nie robi: marki usługowe i handlowe
  (banki, sieci sklepów, telekomy, e-commerce). Wymiana danych albo wzajemne linkowanie zamiast
  konkurowania. Najbardziej realna droga do współpracy z organizacją bez utraty anonimowości.
- **Wtyczka do przeglądarki** z werdyktem na stronach sklepów. Atrakcyjna, ale to znowu budowanie,
  więc tylko gdy liczby pokażą, że warto.

## W skrócie

Do świąt wyciskamy sezon, w styczniu mierzymy zamiast budować, w lutym decydujemy na liczbach.
Monetyzacja to co najwyżej pokrycie kosztów.
