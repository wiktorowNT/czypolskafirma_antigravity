# Kolejka tematów evergreen

Bezpiecznik codziennego automatu (`.github/workflows/codzienna-tresc.yml`). Kiedy
w danym dniu nie ma newsa potwierdzonego w dwóch niezależnych źródłach, automat bierze
stąd **pierwszy nieodhaczony temat** zamiast naciągać wydarzenie.

Zasady:

- Temat zrealizowany oznaczasz `- [x]` i dopisujesz datę w nawiasie.
- Fakty do wpisu evergreen biorą się z żywej strony (`czypolskafirma.pl/firma/[slug]`,
  `/kategoria/[slug]`) i z oficjalnych rejestrów, nigdy z pamięci modelu.
- Gdy zostanie mniej niż 5 nieodhaczonych pozycji, automat dopisuje 10 nowych.
- Możesz dopisywać tematy ręcznie w dowolnym miejscu listy. Kolejność ma znaczenie:
  automat idzie od góry.

## Priorytet: marki z potwierdzonym popytem w wyszukiwarce

Kolejność w tej sekcji nie jest przypadkowa — to marki, których profile zbierają
w Search Console tysiące wyświetleń przy CTR poniżej 1% (dane za 90 dni, 2026-09-12).
Popyt jest udowodniony, brakuje treści, która na to zapytanie odpowiada w tytule.
Wpis blogowy „Kto jest właścicielem X" łapie ten ruch 20× skuteczniej niż profil firmy.

- [ ] Kto jest właścicielem Żabki (6 863 wyświetlenia profilu, CTR 0,29%). WSTRZYMANE: przejęcie przez Couche-Tard opisało dziewięć paczek z sierpnia 2026. Do decyzji właściciela, czy wpis o Żabce wraca po domknięciu transakcji
- [x] Kto jest właścicielem Lidla (6 276 wyświetleń, CTR 0,13% — najgorszy wynik w serwisie) (2026-09-18)
- [x] Kto jest właścicielem Allegro (5 599 wyświetleń; „kto jest właścicielem allegro" to zapytanie nr 1 całego serwisu) (2026-09-19)
- [x] Kto jest właścicielem Pepco (5 037 wyświetleń, CTR 0,32%) (2026-09-20)
- [x] Kto jest właścicielem Kauflandu (3 782 wyświetlenia; „kaufland właściciel" w top 5 zapytań) (2026-09-23)

## Analizy pojedynczych marek

- [x] Kto jest właścicielem Biedronki i ile zostaje w Polsce z każdej wydanej złotówki (2026-07-27)
- [x] Wedel: jak najbardziej polska marka czekolady trafiła do koreańskiego koncernu (2026-08-12)
- [x] Dino kontra Biedronka i Lidl: jedyna duża sieć spożywcza z polskim kapitałem kontrolnym (2026-08-13)
- [x] LPP: Reserved, Cropp, Sinsay i pytanie o cypryjskie spółki w strukturze grupy (2026-08-14)
- [x] Ziaja i Dr Irena Eris: dwie polskie firmy kosmetyczne, które nie sprzedały się koncernom (2026-08-15)
- [x] Empik: kto naprawdę stoi za siecią, która wygląda na instytucję kultury (2026-08-17)
- [x] Netto w Polsce: duńska sieć, która przejęła sklepy po Tesco (2026-08-21)
- [x] CCC: polska ekspansja obuwnicza i struktura właścicielska po zmianach w grupie (2026-08-22)

## Zestawienia kategorii

- [x] Polskie kosmetyki na półce: ile marek z kategorii ma faktycznie polski kapitał (2026-08-31)
- [x] Supermarkety w Polsce według pochodzenia kapitału: pełne zestawienie z werdyktami (2026-09-13)
- [x] Banki działające w Polsce: gdzie kończy się piramida właścicielska największych z nich (2026-08-23)
- [x] Marki odzieżowe uznawane za włoskie, które powstały w Polsce (2026-08-24)
- [x] Woda mineralna i napoje: które popularne butelki należą do zagranicznych grup (2026-08-25)

## Mechanizmy wyjaśnione na konkretach

- [x] Marka polska, spółka polska, właściciel zagraniczny: dlaczego to nie to samo (2026-08-29)
- [x] Spółka na Cyprze albo w Luksemburgu nie znaczy, że firma jest zagraniczna (2026-09-17)
- [ ] Notowanie na GPW nie mówi nic o narodowości kapitału: przykłady z obu stron
  - pominięty 2026-09-26: temat trzeba by opowiedzieć słownikiem rynku kapitałowego, co
    zderza się z zasadą „Konsument, nie inwestor". Do decyzji właściciela, czy zostaje
    w kolejce, czy zmienia ujęcie na „czyje są marki spółek z warszawskiej giełdy"
- [x] Co się dzieje z marką po przejęciu: produkcja, podatki, decyzje i miejsca pracy (2026-09-09)
- [x] Jak samodzielnie sprawdzić właściciela firmy w KRS i w rejestrze beneficjentów (2026-09-26)

## Dopisane 2026-09-10

- [x] Ursus: co się stało z marką traktorów po upadłości fabryki i kto ją dzisiaj ma (2026-09-24)
- [x] Solaris Bus & Coach: poznańska firma autobusowa pod hiszpańskim właścicielem (2026-09-25)
- [x] Kross i Romet: dwie polskie marki rowerowe w kategorii pełnej zagranicznego kapitału (2026-09-27)
- [x] Motoryzacja w bazie: trzy polskie marki na pięćdziesiąt skatalogowanych (2026-10-05)
  - liczby z kolejki były nieaktualne: żywa strona pokazuje 58 marek w kategorii i sześć
    z polskim kapitałem (Auto Partner, Autosan, Inter Cars, Izera, Junak, Oponeo)
- [x] Polpharma, Adamed, Aflofarm: kto jest właścicielem polskich leków z apteki (2026-09-28)
- [ ] Telekomunikacja w Polsce: ostateczni właściciele największych sieci komórkowych
  - pominięty 2026-10-05: Orange był bohaterem paczki o Nexerze z 2026-10-03, a w zestawieniu
    sieci komórkowych musiałby być jednym z bohaterów. Wraca po 2026-10-17
- [ ] Meble: kategoria, w której polski kapitał wciąż ma przewagę liczbową
  - pominięty 2026-10-05: kategorię opisała już paczka z 2026-09-09 („co zostaje z marki po
    przejęciu, na przykładzie mebli”) z tymi samymi markami. Do decyzji właściciela, czy temat
    zostaje w kolejce, czy wypada jako powtórzenie
- [x] Ubezpieczenia w Polsce: jedenaście marek z bazy i kraje ich kapitału (2026-09-29)
- [x] Sieci gastronomiczne z galerii handlowych: kto zarabia na jedzeniu na mieście (2026-09-30)
- [ ] Elektronika i AGD z gazetek promocyjnych: właściciele najczęściej kupowanych marek

## Dopisane 2026-08-31 i 2026-09-09 (scalone 2026-09-16, bez tematów powtórzonych wyżej)

- [ ] Marki własne dyskontów: kto naprawdę produkuje to, co ma logo sieci
- [x] Chemia domowa na polskiej półce: proszki, płyny i marki, które tylko brzmią swojsko (2026-10-01)
- [ ] Fundusz w strukturze właścicielskiej: kiedy zmienia narodowość marki, a kiedy nie
- [ ] Producenci materiałów budowlanych: kto jest właścicielem marek z hurtowni i marketów
- [ ] Polskie firmy IT, które nie sprzedały się zagranicznym inwestorom
- [ ] Marki, które wróciły pod polską kontrolę: odkupienia z rąk zagranicznych właścicieli
- [ ] Sieci przychodni i diagnostyki: czyj kapitał stoi za prywatną opieką zdrowotną
