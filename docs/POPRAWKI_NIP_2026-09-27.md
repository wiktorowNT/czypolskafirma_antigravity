# Poprawki NIP po przeglądzie tożsamości (2026-09-27)

> Ciąg dalszy `docs/PRZEGLAD_TOZSAMOSCI_2026-09.md`, sekcje 1 i 2 (64 firmy).
> Każdą firmę sprawdziłem ręcznie: operator marki ustalony z regulaminu, stopki lub prasy,
> a nowy NIP z sumą kontrolną potwierdzony w Białej Liście MF (2026-09-27) i w odpisie KRS
> (wspólnicy). **Nic nie zostało zapisane w bazie.**

## Podsumowanie

| Kategoria | Firm | Co dalej |
|---|---|---|
| **A. Zły NIP, właściciel i kraj bez zmian** | 45 | `tools/sql/2026-09-27-poprawki-nip.sql` |
| **C. Zły NIP i nieaktualny właściciel lub opis** | 7 | ten sam SQL, potem re-weryfikacja: `data/robocze/automat/lista-reweryfikacja-po-nip-27.09.txt` |
| B. NIP dobry (fałszywy alarm) | 7 | nic, ewentualnie drobiazgi z uwag |
| D. Do Twojej decyzji (marka zniknęła, brak spółki, likwidacja) | 5 | decyzja, potem panel albo SQL z sekcji D |

**Zmiany kraju:** tylko **Beckers** (SE → US, marka należy do PPG przez Tikkurilę). Pozostałe
firmy z kategorii C zostają w tym samym kraju, zmienia się tylko opis właściciela (fundusze
Resource Partners i Innova Capital zarządzane z Warszawy, więc wg reguły B1 kraj PL; nazwa
CCC S.A. zmieniona 13.02.2026 na Modivo S.A.; Shoper wchłonięty przez cyber_Folks).

Skąd brały się błędy (przydatne dla automatu):
- **połączenia i przekształcenia** (Aero2, Hoop, Fibaro, Kanani, Objectivity, Shoper, Euvic,
  Animex, Inglot): NIP był dobry w dniu wpisu, a potem spółka zniknęła;
- **zła suma kontrolna** (Endorfy, myPhone, Maxcom, Modecom, Relpol, Platinet, Philips,
  Tonsil, Zortrax): numery z czatów, zapewne z Gemini (zob. notatka o zmyślanych NIP-ach),
  a dwie pary firm miały nawet ten sam NIP;
- **spółka z podobnej branży albo przypadkowa** (LEGO, Atlas, Paradyż, Granna, Helios,
  Jaguar, Provident): numer sąsiedniego podmiotu z agregatora.

## Jak to wgrać

1. Backup: `node tools/firmy/backup.mjs --do "G:\Mój dysk\zapisy supabase czypolskafirma"`.
2. Supabase → SQL Editor → wklej `tools/sql/2026-09-27-poprawki-nip.sql` → Run. Każdy UPDATE
   ma warunek `nip = stary`, więc nie nadpisze rekordu, który ktoś już poprawił.
3. Firmy z kategorii C: w panelu „Nowa partia” zaznacz „To firmy, które już są w bazie” i wklej
   listę z `lista-reweryfikacja-po-nip-27.09.txt` (NIP-y już nowe). Przegląd pokaże „było → jest”
   dla właściciela i kraju.
4. Kategoria D: decyzje niżej.

Uwaga techniczna: import z panelu przy UPDATE nie zmienia `nip` ani `name` (`POLA_UPDATE`
w `tools/firmy/lib/import-lib.mjs`), dlatego NIP-y poprawia SQL, a nie partia.

## A. Zły NIP, właściciel bez zmian (45)

| Firma | Było | Jest | Spółka wg MF (status VAT) | Źródło | Uwagi |
|---|---|---|---|---|---|
| [LEGO](https://czypolskafirma.pl/firma/lego) | 5222906324<br>SKŁODOWSCY YACHTING SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | **5261011494**<br>KRS 0000033901 | "LEGO POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000033901 (wspólnik LEGO A/S) | Stary NIP to Skłodowscy Yachting w likwidacji, bez związku z marką. |
| [Bydgoskie Meble](https://czypolskafirma.pl/firma/bydgoskie-meble) | 5540231119<br>"BYDGOSKIE FABRYKI MEBLI" SPÓŁKA AKCYJNA W LIKWIDACJI | **5272552325**<br>KRS 0000291100 | BELURO HOME SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000291100 (wspólnik IMS Europa Holding GmbH); pomorska.pl, 2026 (marka należy do Beluro Home z grupy IMS) | Stara spółka BFM S.A. jest w likwidacji. Zakład w Chełmnie to IMS Sofa (5561012546), też spółka Beluro. Właściciel w bazie (Berggruen, US) zgadza się z przejęciem IMS w 2007 r., ale brak nowszego potwierdzenia: pewność ŚREDNIA. Produkcja w Bydgoszczy wygaszona pod koniec 2025 r. |
| [Aero2](https://czypolskafirma.pl/firma/aero2) | 7010123529<br>AERO 2 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5271037727**<br>KRS 0000419430 | POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000419430 (wspólnik Cyfrowy Polsat); Grupa Polsat Plus: połączenie z Aero 2 30.11.2021 | Aero 2 wchłonięta przez Polkomtel, opis w bazie już o tym mówi. |
| [Wrodzinie](https://czypolskafirma.pl/firma/wrodzinie) | 7010123529<br>AERO 2 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5271037727**<br>KRS 0000419430 | POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000419430 | Jak Aero2: usługi świadczy Polkomtel. |
| [Atlas](https://czypolskafirma.pl/firma/atlas) | 7260004406<br>HURTOWNIA KSIĘGARSKA "WAX" SP.Z O.O. | **9471936467**<br>KRS 0000264887 | ATLAS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000264887 (wspólnik WKiZB Atlas sp. z o.o.) | Stary NIP to Hurtownia Księgarska WAX. |
| [Ceramika Paradyż](https://czypolskafirma.pl/firma/ceramika-paradyz) | 7260002442<br>PRZEDSIĘBIORSTWO PRODUKCYJNO-HANDLOWE "LOD-ART" SP.Z O.O. | **7681662555**<br>KRS 0000125109 | "CERAMIKA PARADYŻ" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000125109 (3 osoby fizyczne) | Stary NIP to PPH Lod-Art. |
| [Dr Gerard](https://czypolskafirma.pl/firma/dr-gerard) | 5492411874<br>SURMA - Marcin Surma | **5252562697**<br>KRS 0000474611 | DR GERARD SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000474611 (wspólnik Galletas Artiach S.A.U., grupa Adam Foods) | Stary NIP to jednoosobowa działalność. Właściciel w bazie (Adam Foods, ES) potwierdzony. |
| [Giacomo Conti](https://czypolskafirma.pl/firma/giacomo-conti) | 7831613915<br>SECRAFT SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **7792406269**<br>KRS 0001145039 | "DESIGN MAN PLUS" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | regulamin giacomo.pl (sprzedawca Design Man Plus sp. z o.o.); KRS 0001145039 (2 osoby fizyczne po 50%) | Stara spółka Secraft wykreślona z VAT. Pewność ŚREDNIA co do tożsamości wspólników (w API KRS nazwiska zamaskowane). |
| [InPost](https://czypolskafirma.pl/firma/inpost) | 6793089474<br>WOLFAN SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | **6793108059**<br>KRS 0000543759 | INPOST SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000543759 (wspólnik Integer Group Services) | Stary NIP to Wolfan sp. z o.o. sp.k., wykreślona. |
| [Provident](https://czypolskafirma.pl/firma/provident) | 5251571211<br>TOWARZYSTWO PRZEDSIĘBIORCZOŚCI"FORTUNA"SPÓŁKA Z O.O. | **5251571292**<br>KRS 0000009389 | PROVIDENT POLSKA SPÓŁKA AKCYJNA (Czynny) | KRS 0000009389 (wspólnik IPF International Ltd) | Stary NIP to TP Fortuna, nieistniejąca. |
| [Luksja](https://czypolskafirma.pl/firma/pz-cussons-luksja) | 5272364701<br>PZ CUSSONS POLSKA SPÓŁKA AKCYJNA W LIKWIDACJI | **5210418872**<br>KRS 0000158603 | SARANTIS POLSKA SPÓŁKA AKCYJNA (Czynny) | KRS 0000158603 (wspólnik GR. Sarantis S.A.) | Stary NIP to PZ Cussons Polska w likwidacji; marka od 2020 r. w Sarantis. |
| [BoConcept](https://czypolskafirma.pl/firma/boconcept) | 9251826771<br>"BOCONCEPT RETAIL POLAND" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ  W LIKWIDACJI | **9512369291**<br>KRS 0000469604 | DESIGN SOUL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000469604; Design Soul prowadzi boconcept.pl i salony w Warszawie | BoConcept Retail Poland jest w likwidacji, salony prowadzi franczyzobiorca Design Soul (3 osoby fizyczne). To zgodne z konwencją bazy (Subway to Royal Sub, KFC to AmRest). Marka i kraj (3i, GB) bez zmian. |
| [Ursus](https://czypolskafirma.pl/firma/ursus) | 7392388088<br>URSUS SPÓŁKA AKCYJNA W UPADŁOŚCI | **7011211603**<br>KRS 0001112913 | URSUS INDUSTRIES SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0001112913 (Ursus Industries, dawniej M.I. Crow); farmer.pl: zmiana nazwy 07.10.2025 | Stary NIP to Ursus S.A. w upadłości; przedsiębiorstwo i znaki kupiło M.I. Crow (Oleh Krot). Właściciel w bazie się zgadza. |
| [Endorfy](https://czypolskafirma.pl/firma/cooling-endorfy) | 6792975152<br> | **5223020887**<br>KRS 0000970871 | COOLING SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000970871 (3 osoby fizyczne; dawniej Cooling.pl Zdziech sp.j.); CRN/benchmark: Endorfy to marka Cooling sp. z o.o. | Stary NIP miał złą sumę kontrolną. Sklep endorfy.com prowadzi od 11.2025 Cooling B2C sp. z o.o. (5342704020, 2 osoby fizyczne), ale marka należy do Cooling sp. z o.o. |
| [Granna](https://czypolskafirma.pl/firma/granna) | 5210083207<br>"CONSILIUM"SPÓŁKA Z O.O. | **5252180783**<br>KRS 0000102728 | GRANNA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | sklep.granna.pl/kontakt; KRS 0000102728 (wspólnik Annagra sp. z o.o.) | Stary NIP to Consilium sp. z o.o., nieistniejąca. |
| [Helios](https://czypolskafirma.pl/firma/helios) | 7251893714<br>POLSCY INWESTORZY SPÓŁKA AKCYJNA | **7251482632**<br>KRS 0000005092 | HELIOS SPÓŁKA AKCYJNA (Czynny) | KRS 0000005092; Wikipedia: w grupie Agora od 2010 | Stary NIP to Polscy Inwestorzy S.A. |
| [Jaguar](https://czypolskafirma.pl/firma/jaguar) | 5213824147<br>FUNDACJA PRO MILITARIS | **5272930046**<br>KRS 0000847401 | INCHCAPE JLR POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000847401 (wspólnik Inchcape JLR Europe Ltd, JV JLR i Inchcape); jaguar.pl | Stary NIP to Fundacja Pro Militaris. Importer to Inchcape JLR Poland; marka (Tata, IN) bez zmian. |
| [Ferrari](https://czypolskafirma.pl/firma/ferrari) | 7010465365<br>"FERRARI POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | **6342827881**<br>KRS 0000510153 | SCUDERIA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000510153; ferrariwarszawa.com (Scuderia sp. z o.o., wyłączny importer od 2013) | Ferrari Polska sp. z o.o. jest w likwidacji. Importer Scuderia należy do dwóch polskich fundacji rodzinnych (Grupa Pietrzak), tak jak w konwencji bazy dla importerów (Maserati, Lamborghini). Marka (Exor, IT) bez zmian. |
| [Maxcom](https://czypolskafirma.pl/firma/maxcom) | 7781481614<br> | **6462537364**<br>KRS 0000410197 | "MAXCOM" SPÓŁKA AKCYJNA (Czynny) | KRS 0000410197 | Stary NIP miał złą sumę kontrolną. Spółka to Maxcom S.A., nie sp. z o.o. (popraw owner_name). |
| [Modecom](https://czypolskafirma.pl/firma/modecom) | 6922504223<br> | **1231326759**<br>KRS 0000643267 | MODECOM POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000643267 (wspólnik Modecom Hong Kong Ltd); rejestr.io/MarketScreener: kontrola założyciela Jakuba Łozowskiego przez spółki w HK/CY | Stary NIP miał złą sumę (ten sam co Relpol). Wg zasady ostatecznego właściciela zostaje PL. Modecom S.A. (1132115893) nie ma w wykazie VAT. |
| [myPhone](https://czypolskafirma.pl/firma/mptech-myphone) | 6792975152<br> | **8951845043**<br>KRS 0000243245 | "MPTECH" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | regulamin myphone.pl; KRS 0000243245 (wspólnik TelForceOne S.A.) | Stary NIP miał złą sumę (ten sam co Endorfy). |
| [Philips](https://czypolskafirma.pl/firma/philips) | 5211627116<br> | **5272921998**<br>KRS 0000830304 | VERSUNI POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000830304 (wspólnik Versuni Holding B.V.); regulamin sprzedaży online Versuni Poland na philips.com/pl | Stary NIP miał złą sumę. Opis w bazie dotyczy AGD pod kapitałem azjatyckim, więc Versuni (Hillhouse). Alternatywa: Philips Polska 5260210955 (Koninklijke Philips, NL), jeśli profil ma dotyczyć całej marki. |
| [Platinet](https://czypolskafirma.pl/firma/platinet) | 5832223443<br> | **6792844218**<br>KRS 0000233360 | PLATINET SPÓŁKA AKCYJNA (Czynny) | KRS 0000233360 | Stary NIP miał złą sumę. To Platinet S.A. (Kraków), nie sp. z o.o. |
| [Relpol](https://czypolskafirma.pl/firma/relpol) | 6922504223<br> | **9280007076**<br>KRS 0000088688 | "RELPOL" SPÓŁKA AKCYJNA (Czynny) | KRS 0000088688 | Stary NIP miał złą sumę (ten sam co Modecom). |
| [TikTok](https://czypolskafirma.pl/firma/tiktok) | IE3673525NH<br> | **5252785687**<br>KRS 0000779664 | HYPERBOLA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000779664 (Hyperbola sp. z o.o., wspólnik TikTok Information Technologies UK Ltd) | W bazie był irlandzki numer VAT (IE3673525NH). Polska spółka TikToka nazywa się Hyperbola. |
| [Tonsil](https://czypolskafirma.pl/firma/tonsil) | 8881014150<br> | **7891755091**<br>KRS 0000567787 | TONSIL POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000567787 (1 osoba fizyczna); skleptonsil.pl | Stary NIP miał złą sumę. Tonsil Poland sp. z o.o. sp.k. (7891770831) wykreślona z VAT 21.08.2026. Sklep internetowy prowadzi JDG Sławomir Wieszczeciński (7891558999). Właściciel w bazie się zgadza. |
| [Zortrax](https://czypolskafirma.pl/firma/zortrax) | 8943089203<br> | **5242756595**<br>KRS 0000499608 | ZORTRAX SPÓŁKA AKCYJNA (Czynny) | KRS 0000499608 | Stary NIP miał złą sumę. |
| [Kofola](https://czypolskafirma.pl/firma/kofola-hoop-cola) | 5272525699<br>HOOP POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5482247628**<br>KRS 0000162128 | "USTRONIANKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000162128 (wspólnik ZMB Capital); portalspozywczy.pl: od 01.2024 zakład Hoop należy do Ustronianki | Hoop Polska wykreślona z VAT 03.01.2024 (wchłonięta przez Ustroniankę). Właściciel (ZMB Capital) bez zmian. |
| [Costa Coffee](https://czypolskafirma.pl/firma/costa-coffee) | 5262403747<br>COSTA COFFEE POLSKA SPÓŁKA AKCYJNA | **5262100142**<br>KRS 0000048015 | LAGARDERE TRAVEL RETAIL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000048015; lagardere-tr.pl: masterfranczyza Costa Coffee od 02.2023; imsig: Costa Coffee Polska S.A. wchłonięta 2023 | Kawiarnie prowadzi masterfranczyzobiorca Lagardère Travel Retail (FR). Marka (Coca-Cola, US) bez zmian; w opisie można dopisać operatora. |
| [Fibaro](https://czypolskafirma.pl/firma/fibaro) | 7811858097<br>FIBAR GROUP SPÓŁKA AKCYJNA | **9521240786**<br>KRS 0000023328 | NICE - POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | newsroom.fibaro.com: połączenie Fibar Group z Nice-Polska 29.12.2023; KRS 0000023328 (wspólnik Nice S.p.A.) | Właściciel (Nice, IT) bez zmian. |
| [Interia](https://czypolskafirma.pl/firma/interia) | 5272644300<br>GRUPA INTERIA.PL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | **6772118727**<br>KRS 0001009169 | INTERIA.PL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0001009169 (wspólnik Telewizja Polsat sp. z o.o.) | Stara sp.k. wykreślona 2023. Właściciel bez zmian. |
| [Mieszko](https://czypolskafirma.pl/firma/mieszko) | 6391875874<br>MIESZKO DISTRIBUTION SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **6390010391**<br>KRS 0000073310 | MIESZKO SPÓŁKA AKCYJNA (Czynny) | KRS 0000073310 (wspólnik Bisantio Investments SE) | W bazie była Mieszko Distribution (wykreślona 2021). Właściciel bez zmian. |
| [Sokołów](https://czypolskafirma.pl/firma/sokolow) | 8231403819<br>"SOKOŁÓW-SERVICE" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **8230001444**<br>KRS 0000050909 | "SOKOŁÓW" SPÓŁKA AKCYJNA (Czynny) | KRS 0000050909 (wspólnik Danish Crown A/S) | W bazie była spółka serwisowa Sokołów-Service (wykreślona 09.10.2025). |
| [Takeda](https://czypolskafirma.pl/firma/takeda) | 5262868535<br>TAKEDA POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5262108132**<br>KRS 0000027645 | TAKEDA PHARMA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000027645 (wspólnik Takeda Pharmaceuticals International AG) | Takeda Polska połączona z Takeda Pharma 01.02.2019. |
| [Whirlpool](https://czypolskafirma.pl/firma/whirlpool) | 8960000492<br>WHIRLPOOL POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5252073573**<br>KRS 0000078147 | BEKO SPÓŁKA AKCYJNA (Czynny) | KRS 0000078147 (wspólnik Beko Europe B.V.); bnbn.pl: wspólna organizacja handlowa od 01.04.2026 | Whirlpool Polska wykreślona; AGD Whirlpool w Polsce sprzedaje Beko S.A. Właściciel (Arçelik, TR) bez zmian. |
| [ALAB laboratoria](https://czypolskafirma.pl/firma/alab-laboratoria) | 5272360548<br> | **5220000217**<br>KRS 0000040890 | ALAB LABORATORIA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000040890 (osoba fizyczna 55,6%, Parkstreet 30,4%, osoba fizyczna 14,0%); rejestr: Hans Jakob Limbach 54,8% | Stary NIP nieznany w MF. Właściciel (Limbach, DE) potwierdzony. |
| [Animex Foods](https://czypolskafirma.pl/firma/animex-foods) | 5272698951<br>ANIMEX FOODS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5262461288**<br>KRS 0000018550 | ANIMEX FOODS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000018550 (wspólnik Morliny Foods Holding Ltd); animex.pl: połączenie spółek 02.06.2025 | Animex Holding wchłonął Animex Foods i przejął jego nazwę. Właściciel (WH Group) bez zmian. |
| [Euvic](https://czypolskafirma.pl/firma/euvic) | 9691411637<br>EUVIC SPÓŁKA AKCYJNA | **5272604418**<br>KRS 0000332547 | EUVIC SPÓŁKA AKCYJNA (Czynny) | KRS 0000332547; strefainwestorow.pl: połączenie z eo Networks 02.01.2026, notowania na NewConnect | Nowy NIP i KRS po połączeniu odwrotnym z eo Networks. Opis „100% prywatny” jest nieaktualny, bo spółka jest na NewConnect: warto sprawdzić akcjonariat przy re-weryfikacji. |
| [Inglot](https://czypolskafirma.pl/firma/inglot) | 7952194802<br>INGLOT SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **7952194802**<br>KRS 0001246847 | INGLOT SPÓŁKA AKCYJNA (Czynny) | KRS 0001246847 (przekształcenie w S.A. 01.07.2026) | NIP bez zmian, zmieniają się KRS (0000164776 → 0001246847) i nazwa (Inglot S.A.). |
| [Kanani Europe](https://czypolskafirma.pl/firma/kanani-europe) | 5252638288<br>KANANI EUROPE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **9442043784**<br>KRS 0000982226 | BIELENDA GROUP SPÓŁKA AKCYJNA (Czynny) | bielenda.pl: plan połączenia Bielenda–Kanani (28.05.2024), Kanani wykreślona | Miya Cosmetics należy do Bielenda Group S.A. Opis w bazie już o tym mówi. |
| [Müller](https://czypolskafirma.pl/firma/muller) | 5222904791<br> | **7010213190**<br>KRS 0000341929 | MÜLLER DAIRY POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000341929 (wspólnik Molkerei Alois Müller GmbH & Co. KG) | Jest też Müller Dairy Polska sp. z o.o. sp.k. (5252435438); wybrałem sp. z o.o., bo ona publikuje strategię podatkową. Pewność ŚREDNIA. Adres strony w bazie (muellerpolska.pl) nie działa, poprawny to mullerpolska.pl. |
| [Muszynianka](https://czypolskafirma.pl/firma/muszynianka) | 7340007298<br> | **7343575005**<br>KRS 0000800687 | "MUSZYNIANKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000800687; money.pl: przekształcenie spółdzielni 09.2019 | Stary NIP należał do spółdzielni (wykreślonej). |
| [Objectivity](https://czypolskafirma.pl/firma/objectivity) | 8942941304<br>OBJECTIVITY SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5260015900**<br>KRS 0000019271 | "ACCENTURE" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | accenture.com: plan połączenia 22.05.2025; Objectivity sp. z o.o. wykreślona 08.09.2025 | Objectivity wchłonięta przez Accenture sp. z o.o. Marka zanika („part of Accenture”), więc warto rozważyć jej wycofanie. |
| [OSM Ryki](https://czypolskafirma.pl/firma/osm-ryki) | 5060003186<br> | **7160002164**<br>KRS 0000056619 | SPÓŁDZIELNIA MLECZARSKA RYKI (Czynny) | KRS 0000056619 (Spółdzielnia Mleczarska Ryki) | Stary NIP nieznany w MF. |
| [Sphinx](https://czypolskafirma.pl/firma/sphinx-sfinks) | 9291666687<br> | **7251752913**<br>KRS 0000016481 | "SFINKS POLSKA" SPÓŁKA AKCYJNA (Czynny) | KRS 0000016481 | Stary NIP nieznany w MF. |

## C. Zły NIP i nieaktualny opis właściciela (7)

| Firma | Było | Jest | Spółka wg MF (status VAT) | Źródło | Uwagi |
|---|---|---|---|---|---|
| [Beckers](https://czypolskafirma.pl/firma/beckers) | 8720003048<br>TIKKURILA POLSKA SPÓŁKA AKCYJNA | **8951760602**<br>KRS 0000068982 | PPG DECO POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000068982 (wspólnik PPG Cieszyn S.A.); poland.ppg.com (Tikkurila, Beckers, Jedynka w PPG Deco Polska) | ZMIANA KRAJU SE → US. Farby Beckers w Polsce to marka Tikkurili, którą w 2021 r. przejęło PPG Industries (USA). Lindéngruppen ma Beckers Group, czyli farby przemysłowe, nie markę sklepową. |
| [Reebok](https://czypolskafirma.pl/firma/reebok) | 5261014050<br>ADIDAS FINANCE POLAND SPÓŁKA AKCYJNA | **6922200609**<br>KRS 0000211692 | MODIVO SPÓŁKA AKCYJNA (Czynny) | Bankier.pl, 07.2023: 10-letnia licencja Authentic Brands Group dla Grupy CCC (dziś Modivo S.A.) na Reeboka w 28 krajach | Stary NIP to Adidas Finance Poland (wykreślona). W Polsce Reeboka sprzedaje licencjobiorca Modivo S.A. (dawniej CCC). Marka należy do ABG, więc kraj US zostaje; opis trzeba uzupełnić o licencję. Alternatywa: pusty NIP. |
| [Semilac](https://czypolskafirma.pl/firma/semilac) | 7792413878<br>NESPERTA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **5252837102**<br>KRS 0000860765 | NESPERTA EUROPE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ (Czynny) | KRS 0000860765 (Beauty Holdings S.à r.l. 70%, Specinvest 30%); Resource Partners: inwestycja w Nesperta 2021 | Właścicielem marki jest Nesperta Europe. 70% ma fundusz Resource Partners (GP w Warszawie, więc wg B1 kraj PL), 30% ma wehikuł założyciela. Kraj PL zostaje, opis „100% polscy właściciele” jest nieaktualny. |
| [Tołpa](https://czypolskafirma.pl/firma/tolpa) | 8950010885<br>TORF CORPORATION - FABRYKA LEKÓW SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | **9442043784**<br>KRS 0000982226 | BIELENDA GROUP SPÓŁKA AKCYJNA (Czynny) | ogłoszenie Bielendy o połączeniu z Torf Corporation (06.05.2024); Innova Capital | Torf Corporation połączona z Bielenda Group S.A. (kontrola: Innova Capital, GP w Warszawie, więc PL). Kraj PL zostaje, opis „100% polscy właściciele” do zmiany. |
| [Badura](https://czypolskafirma.pl/firma/badura) | 5512620406<br>BADURA STUDIO "STUDIO 69 SPÓŁKA Z OGRANICZONA ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI" SPÓŁKA KOMADYTOWA | **6922200609**<br>KRS 0000211692 | MODIVO SPÓŁKA AKCYJNA (Czynny) | money.pl/rp.pl: CCC kupiło markę Badura (2021); MF: 6922200609 = Modivo S.A. | Marka należy do Modivo S.A. (do 13.02.2026 nazwa CCC S.A.). W owner_name i opisie zamień „CCC S.A.” na „Modivo S.A. (dawniej CCC)”. |
| [Gino Rossi](https://czypolskafirma.pl/firma/gino-rossi) | 8390202281<br>"GINO ROSSI" SPÓŁKA AKCYJNA W LIKWIDACJI | **6922200609**<br>KRS 0000211692 | MODIVO SPÓŁKA AKCYJNA (Czynny) | Forbes.pl: zgoda UOKiK na przejęcie Gino Rossi przez CCC (2020); MF: 6922200609 = Modivo S.A. | Gino Rossi S.A. jest w likwidacji, marka należy do Modivo S.A. (dawniej CCC). Zaktualizuj owner_name jak przy Badurze. |
| [Shoper](https://czypolskafirma.pl/firma/shoper) | 9452156998<br>SHOPER SPÓŁKA AKCYJNA | **7792467259**<br>KRS 0000685595 | CYBER_FOLKS SPÓŁKA AKCYJNA (Czynny) | shoper.pl: od 01.09.2026 Shoper i cyber_Folks to jedna spółka; KRS 0000685595 | Shoper S.A. wchłonięty przez cyber_Folks S.A. (PL). Kraj PL zostaje, opis „akcjonariat rozproszony” do zmiany (właściciel: cyber_Folks S.A.). |

## B. NIP dobry, fałszywy alarm (7)

| Firma | NIP | Spółka w bazie | Źródło | Uwagi |
|---|---|---|---|---|
| [50 Style](https://czypolskafirma.pl/firma/50-style) | 6751187580 | MARKETING INVESTMENT GROUP SPÓŁKA AKCYJNA | KRS 0000521685 (wspólnik JD Sports Fashion Europe Holdings Ltd) | MIG S.A. to operator Sizeer, 50 style i JD Sports w Polsce. NIP dobry, trzy marki jednej spółki. |
| [JD Sports](https://czypolskafirma.pl/firma/jd-sports) | 6751187580 | MARKETING INVESTMENT GROUP SPÓŁKA AKCYJNA | KRS 0000521685 | Jak wyżej. Opis w bazie mówi o akcjonariacie rozproszonym JD Sports Fashion plc; kraj GB bez zmian. |
| [Sizeer](https://czypolskafirma.pl/firma/sizeer) | 6751187580 | MARKETING INVESTMENT GROUP SPÓŁKA AKCYJNA | KRS 0000521685 | Jak wyżej. |
| [Vivus](https://czypolskafirma.pl/firma/vivus) | 5252531320 | SOONLY FINANCE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | MF: 5252531320 = Soonly Finance (dawniej Vivus Finance), KRS 0000418977 | NIP dobry. Od 01.2025 marka działa jako Vivigo, więc warto dopisać alias. |
| [TVP – Telewizja Polska](https://czypolskafirma.pl/firma/tvp-telewizja-polska) | 5210412987 | "TELEWIZJA POLSKA" SPÓŁKA AKCYJNA W LIKWIDACJI | KRS 0000100679 | NIP dobry. „W likwidacji” od 12.2023 to spór polityczny, spółka działa. |
| [Polskie Radio](https://czypolskafirma.pl/firma/polskie-radio) | 5210414265 | POLSKIE RADIO - SPÓŁKA AKCYJNA W LIKWIDACJI | KRS 0000017753 | Jak TVP. |
| [Amazon Web Services](https://czypolskafirma.pl/firma/amazon-web-services) | 5252541034 | AMAZON DATA SERVICES POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | KRS 0000439010 (wspólnik A100 ROW, Inc., grupa Amazon) | NIP dobry, alarm dotyczył tylko słowa „Services” w nazwie. |

## D. Do decyzji (5)

| Firma | NIP | Spółka w bazie | Źródło | Uwagi |
|---|---|---|---|---|
| [Bobby Burger](https://czypolskafirma.pl/firma/bobby-burger) | 5252546149 | BOBBY BURGER SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | KRS 0000447567 (likwidacja od 30.12.2024) | NIP dobry, ale spółka jest w likwidacji, a w 2026 r. nie ma wieści o nowym inwestorze. Sprawdź, czy lokale działają; jeśli nie, zdecyduj o wycofaniu marki. |
| [Panek](https://czypolskafirma.pl/firma/panek) | 6922461623 | PANEK SPÓŁKA AKCYJNA | KRS 0000324104; money.pl/bankier.pl: carsharing zawieszony 29.03.2025 | NIP dobry. Panek S.A. jest w likwidacji od 29.07.2026, carsharing zawieszony w 03.2025, wynajem działa. Warto dopisać to w opisie. |
| [Spotify](https://czypolskafirma.pl/firma/spotify) | 1070021350 | SPOTIFY POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | imsig.pl: Spotify Poland sp. z o.o. wykreślona 26.02.2021 | W Polsce nie ma spółki Spotify, umowy zawiera Spotify AB. Proponuję wyczyścić NIP i KRS (SQL w sekcji D, zakomentowany). |
| [Kakadu](https://czypolskafirma.pl/firma/kakadu) | 5272332612 |  | globalpetindustry.com / aquael.pl: 82 sklepy Kakadu przechodzą do Aquael Zoo (umowa 25.08.2025); Super ZOO i Super ZOO Polska w likwidacji | Marka Kakadu znika: sklepy zmieniają szyld na Aquael Zoo (Fundacja Rodzinna Rodziny Jankiewicz, PL). Decyzja: wycofać Kakadu albo przerobić rekord na Aquael Zoo (nowa firma, PL). |
| [Telefonia Dialog](https://czypolskafirma.pl/firma/telefonia-dialog) | 6921990816 → 5260205575? | TELEFONIA DIALOG SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | inwestor.netia.pl: połączenie Netia–Telefonia Dialog 30.11.2018; telepolis.pl: marka Dialog miała zniknąć w ciągu 2 lat | Spółka wchłonięta przez Netię, a marka wygaszona. Proponuję wycofać markę. Jeśli ma zostać, NIP to Netia S.A. |

## Pozostałe sekcje raportu z 23.09

Sekcje 3–6 (NIP potwierdzony przez KRS mimo braku w VAT, marka niepodobna do nazwy spółki,
wspólny NIP, brak NIP-u) nie były częścią tego zadania. Sekcja 5 w dużej części wyjaśni się
sama po tym SQL (np. Modecom/Relpol i Endorfy/myPhone miały ten sam zły numer).
