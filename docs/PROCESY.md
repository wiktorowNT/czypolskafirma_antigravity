# Procesy CzyPolskaFirma: ściągi

> Krótkie karty „jak to się robi". Każda karta: kiedy, gdzie, kroki, link do pełnego opisu.
> Ten plik czyta **Centrum projektu** w Panelu projektu (http://localhost:3010), więc zmiana
> procesu = zmiana karty tutaj. Format karty: nagłówek `## Nazwa {#id}`, na górze lista
> `**Kiedy:**`, `**Gdzie:**`, `**Pełny opis:**`,
> `**Obszar:**` (kolumna na mapie) i `**Prowadzi do:**` (strzałki: `id (opis); id (opis)`), potem kroki.
> Kolejność kart = kolejność na mapie (z góry na dół w kolumnie).
>
> Rytm (co i jak często) jest w `data/panel/rytm.json`. Id karty łączy ją z pozycją rytmu.

## Newsy i długi wpis {#newsy}

- **Kiedy:** gdy dzieje się coś głośnego o firmie z bazy (przejęcie, kontrakt)
- **Gdzie:** Claude (skill `lowca-newsow`) albo ręczny start automatu treści
- **Pełny opis:** docs/AUTOMATYZACJA_TRESCI.md, sekcja „Uruchomienie ręczne”
- **Obszar:** Treści
- **Prowadzi do:** tresc (temat dla automatu); reweryfikacja (news o przejęciu)

1. Szybko: GitHub → Actions → Codzienna treść → **Run workflow**, w polu `temat` wpisz firmę albo link do artykułu.
2. Albo w Claude: „napisz wpis o tym przejęciu” + link.
3. Limity: ta sama marka nie częściej niż co 14 dni, maks. 3 newsy na tydzień.

## Poranna paczka treści {#tresc}

- **Kiedy:** codziennie rano, ok. 3 minuty
- **Gdzie:** GitHub, pull request „Paczka na RRRR-MM-DD” do `develop` (mail albo apka)
- **Pełny opis:** docs/AUTOMATYZACJA_TRESCI.md
- **Obszar:** Treści
- **Prowadzi do:** publikacja (merge PR-a na develop); firmy (kandydaci do bazy); posty (gotowe teksty na X i FB)

1. Automat startuje o 6:00 (GitHub Actions „Codzienna treść”) i otwiera PR z wpisem na blog, postem na X i wersją na FB.
2. Przeczytaj sekcję **Weryfikacja faktów** w opisie PR-a. To moment na wyłapanie bzdury.
3. Skopiuj z opisu wpis na X, pierwszy komentarz (z linkiem) i wersję na Facebooka, wklej na profile.
4. Kliknij **Merge**: wpis ląduje na `develop` (podgląd Vercel). Nietrafiony PR po prostu zamknij.
5. Kandydatów z sekcji „Kandydaci do bazy” dopisz do listy firm na następną partię.

Kilka paczek naraz? Scal je, rozłóż daty `date` we frontmatterze na kolejne dni i zrób jeden merge na produkcję. Wpisy z przyszłą datą pojawią się same, dzień po dniu.

Automat czerwony w Actions: najczęściej wygasł `CLAUDE_CODE_OAUTH_TOKEN` (sekcja „Kiedy coś nie działa” w pełnym opisie).

## Posty na X i Facebooka {#posty}

- **Kiedy:** codziennie według planu tygodnia; paczkę przygotuj raz w tygodniu
- **Gdzie:** Claude (skill `generator-postow`), generator grafik na stronie (/narzedzia/generator)
- **Pełny opis:** docs/STRATEGIA_WZROSTU.md, sekcje 4 i 5
- **Obszar:** Treści
- **Prowadzi do:** metryki (wyniki postów)

1. Poproś Claude'a: „zrób paczkę postów na ten tydzień”. Pliki lądują w `docs/social/paczki/`.
2. Plan tygodnia: pon zaskoczenie, wt quiz, śr odpowiedź na quiz, czw pojedynek, pt zestawienie, sob odwrotka, nd statystyka albo RAPORT.
3. Grafikę zrób w generatorze na stronie.
4. Bufor 2 tygodni chroni przed przestojem. Tydzień minimum: 3 posty z bufora i 5 komentarzy.

Ton: dla przypadkowego czytelnika, bez „my” i bez metodologii. O markach, nie o giełdzie.

## Komentarze na X {#komentarze}

- **Kiedy:** gdy jest czas (opcjonalne), najlepiej rano
- **Gdzie:** Claude (skill `komentator-x`)
- **Pełny opis:** tools/skills/komentator-x/SKILL.md
- **Obszar:** Treści
- **Prowadzi do:** metryki (skuteczność komentarzy)

1. Napisz w Claude: „poranny przegląd X” albo wklej link do wątku.
2. Claude znajduje wątki i pisze komentarze na bazie danych z serwisu. Publikujesz sam.

## Panel projektu: gdy nie działa {#panel}

- **Kiedy:** skrót nic nie otwiera albo przyciski nie reagują
- **Gdzie:** Panel projektu
- **Pełny opis:** docs/SOP_dodawanie_firm.md, sekcje 2 i 8
- **Obszar:** Firmy i dane
- **Prowadzi do:** firmy (narzędzie do partii)

1. Żółty pasek „Jest nowsza wersja panelu”: kliknij **Zamknij panel** i otwórz go ze skrótu.
2. Skrót zginął: przeciągnij `tools/firmy/panel.vbs` na pulpit z wciśniętym Alt.
3. Awaryjnie w terminalu: `node tools/firmy/panel.mjs`.

## Re-weryfikacja firmy w bazie {#reweryfikacja}

- **Kiedy:** po newsie o przejęciu; co 12 miesięcy zwykłe firmy, co 6 giełdowe i fundusze PE
- **Gdzie:** Panel projektu, krok 1
- **Pełny opis:** docs/SOP_dodawanie_firm.md, sekcja 4
- **Obszar:** Firmy i dane
- **Prowadzi do:** firmy (ta sama ścieżka w panelu)

1. W kroku 1 zaznacz **„To firmy, które już są w bazie”** i wklej `Nazwa | NIP`.
2. Przejdź partię jak zwykle. W przeglądzie każda różnica (kraj, właściciel, NIP) to KONFLIKT do Twojej decyzji.
3. Import robi UPDATE tylko pól właścicielskich i ustawia `verified_at` na dziś.

## Dodawanie firm (partia) {#firmy}

- **Kiedy:** raz w tygodniu, ok. 45 minut
- **Gdzie:** Panel projektu (skrót „CzyPolskaFirma - Panel projektu” na pulpicie, http://localhost:3010)
- **Pełny opis:** docs/SOP_dodawanie_firm.md
- **Obszar:** Firmy i dane
- **Prowadzi do:** logotypy (po imporcie); backup (kopia przed zapisem)

1. **Lista firm i NIP-y:** poproś czat o numery NIP (gotowe polecenie jest w panelu) i wklej listę `Marka | NIP`. NIP-y od Gemini bywają zmyślone: panel liczy sumę kontrolną, braki uzupełniaj z ChatGPT.
2. **Sprawdzenie NIP-ów:** przy każdej firmie „Numer dobry”, „Numer do wymiany” albo „Pomiń”.
3. **Rejestry:** panel sam pobiera KRS, historię wspólników i CRBR.
4. **Śledztwo w czatach:** jeden prompt do kilku czatów (Gemini, ChatGPT, Claude.ai) z wyszukiwaniem, odpowiedzi wklejasz z powrotem.
5. **Rozstrzygnięcie w Claude:** panel robi pliki, Claude Code rozstrzyga z internetem, wyniki wczytują się same.
6. **Przegląd:** zatwierdzasz albo poprawiasz każdą firmę.
7. **Import:** najpierw „Pokaż, co się zmieni”, potem „Zapisz do bazy” (robi backup przed zapisem). Nowe firmy widać wtedy tylko na podglądzie, aktualizacje czekają.
8. **Logotypy i publikacja:** karta niżej. Na czypolskafirma.pl firmy trafiają dopiero po kliknięciu „Opublikuj” na końcu kroku 8.

Zasada: automat proponuje, Ty zatwierdzasz. Nic nie trafia do bazy bez Twojego kliknięcia.

## Logotypy po imporcie {#logotypy}

- **Kiedy:** po każdym imporcie nowych firm
- **Gdzie:** Panel projektu, krok 8; Logo Fixer na `npm run dev`
- **Pełny opis:** docs/SOP_logotypy.md
- **Obszar:** Firmy i dane
- **Prowadzi do:** publikacja (logo na develop)

1. **Pobierz logotypy** (tylko firmy bez logo).
2. Obejrzyj podgląd w panelu. Przy złym, małym albo białym logo kliknij **Inne źródła** i wybierz lepsze („Użyj”). Gdy nic nie pasuje: otwórz stronę firmy albo Google Grafika obok panelu i przeciągnij obrazek logo myszką prosto na kartę firmy (panel sam pobierze plik, bez zapisywania na dysk).
3. **Przygotuj obrazki** (kopie PNG dla kart OG, bez nich karta pokaże monogram).
4. **Wyślij logotypy na podgląd** (commit i push na `develop`).
5. Przejrzyj nowe firmy na podglądzie (linki są w karcie publikacji) i kliknij **Opublikuj**: firmy, logotypy i kod trafią na czypolskafirma.pl razem.

Nie kompresuj i nie zmniejszaj plików w `public/logos/`: jakość ponad wagę.

## Zmiana w bazie przez SQL {#sql}

- **Kiedy:** gdy zadanie zostawiło plik w `tools/sql/`
- **Gdzie:** Supabase → SQL Editor
- **Pełny opis:** nagłówek danego pliku `.sql`
- **Obszar:** Firmy i dane

1. Otwórz plik z `tools/sql/`, przeczytaj komentarz na górze.
2. Wklej całość w SQL Editor w Supabase i uruchom.
3. Odhacz przypomnienie w Centrum projektu.

## Zlecenie zadania modelowi {#zlecanie}

- **Kiedy:** gdy chcesz, żeby model zrobił zadanie z backlogu
- **Gdzie:** Claude Code w folderze projektu
- **Pełny opis:** docs/BACKLOG_2026-09.md (zasady wspólne na górze), docs/PROMPTY_OPERACYJNE.md
- **Obszar:** Strona
- **Prowadzi do:** publikacja (zmiany kodu na develop); sql (plik do wklejenia w Supabase)

1. Skopiuj „Zasady wspólne” z backlogu i dopisz treść zadania.
2. Model przedstawia plan, Ty akceptujesz, model pracuje na `develop`.
3. Commit tylko na Twoje „zacommituj”. Na produkcję: karta „Publikacja na produkcję”.

## Publikacja na produkcję {#publikacja}

- **Kiedy:** raz w tygodniu albo gdy na podglądzie jest coś gotowego
- **Gdzie:** podgląd Vercel `develop`, potem GitHub
- **Pełny opis:** docs/DEVELOPMENT_WORKFLOW.md
- **Obszar:** Strona
- **Prowadzi do:** seo (nowe strony do indeksacji)

1. Otwórz podgląd: https://czypolskafirmalive-git-develop-wiktorow123-3833s-projects.vercel.app/
2. Przeklikaj to, co się zmieniło (Centrum projektu pokazuje, ile commitów czeka).
3. Kliknij **„Opublikuj”** w Panelu projektu (Firmy → Logotypy, na dole): wypuszcza firmy zapisane w kroku 7 i robi merge `develop` → `main`. Albo poproś Claude'a wprost: „zmerguj develop do main” (wtedy firmy z kroku 7 dalej czekają na przycisk). Przycisk działa tylko, gdy build podglądu na Vercelu przeszedł.
4. Po 1–2 minutach sprawdź https://czypolskafirma.pl

`main` to produkcja. Nikt poza Tobą nie merguje na `main` bez Twojej wyraźnej prośby.

## Partia indeksacji w Google {#seo}

- **Kiedy:** codziennie, dopóki kolejka się nie skończy
- **Gdzie:** Claude Code + Chrome zalogowany do Google Search Console
- **Pełny opis:** docs/seo-kolejka-indeksacji.md
- **Obszar:** Strona
- **Prowadzi do:** metryki (ruch z Google)

1. Otwórz Claude Code w folderze projektu, w Chrome musi być zalogowane GSC (`sc-domain:czypolskafirma.pl`).
2. Napisz: **„zrób dzisiejszą partię”**.
3. Claude zgłasza ok. 11 kolejnych firm z listy i odhacza je w pliku.
4. Komunikat „Przekroczono limit” = koniec na dziś.

Po wyczerpaniu listy resztę firm indeksuje sitemapa. Dalsze ręczne klikanie nie ma sensu.

## Backup bazy {#backup}

- **Kiedy:** sam, w niedziele o 10:00; kontrola raz w tygodniu
- **Gdzie:** Panel projektu → Backup; folder `G:\Mój dysk\zapisy supabase czypolskafirma`
- **Pełny opis:** docs/SOP_dodawanie_firm.md, sekcja 6; docs/BACKUP_STRATEGY.md
- **Obszar:** Wyniki i utrzymanie

1. Zadanie „CzyPolskaFirma backup bazy” w Harmonogramie zadań Windows robi kopię co niedzielę (albo przy najbliższym włączeniu komputera).
2. Centrum projektu pokazuje wiek ostatniej kopii. Starsza niż 8 dni: kliknij **Zrób backup teraz** w panelu.
3. Coś nie działa: log w `data/robocze/backup/backup.log`.

Import w panelu zawsze robi własny backup przed zapisem.

## Metryki miesięczne {#metryki}

- **Kiedy:** raz w miesiącu, ok. 30 minut
- **Gdzie:** Panel projektu → Metryki (linki do źródeł są na ekranie)
- **Pełny opis:** docs/STRATEGIA_WZROSTU.md, sekcja 5
- **Obszar:** Wyniki i utrzymanie

1. Na początku miesiąca otwórz Panel projektu → **Metryki**. Domyślnie wybrany jest poprzedni miesiąc.
2. Przepisz liczby ze źródeł: odwiedzający (Vercel Analytics), kliknięcia i wyświetlenia (Search Console), obserwujący na X i FB.
3. Wpisz najlepszy post z linkiem i jedno zdanie „co zadziałało”. Kliknij **Zapisz miesiąc**: pozycja w Centrum odhaczy się sama.
4. Spójrz na wykresy trendu i podwój to, co działa.

Liczby zostają w `data/panel/metryki.json`: przydadzą się do media kitu i wniosków o granty.
