# Przegląd tożsamości firm w bazie (2026-09-23)

> Wygenerowane przez `node tools/firmy/przeglad-tozsamosci.mjs` (backlog 2026-09, zadanie 7).
> Tylko odczyt: baza (klucz publiczny), Biała Lista VAT MF, API KRS. **Żadnych zmian w bazie.**
> Dalej decyduje właściciel: dla potwierdzonych błędów partia `--reweryfikacja` bez NIP-u
> (automat znajdzie numer od nowa) albo poprawka NIP-u w panelu.

## Podsumowanie

| | Liczba |
|---|---|
| Firm w bazie | 750 |
| Sprawdzonych w MF / odpisów KRS | 749 / 681 |
| **1. Mocne podejrzenie, że NIP wskazuje zły podmiot** | **42** |
| 2. Do sprawdzenia | 22 |
| 3. Brak w wykazie VAT lub wykreślone, ale KRS potwierdza NIP | 21 |
| 4. Marka niepodobna do nazwy spółki, brak innych sygnałów | 119 |
| 5. Kilka firm z tym samym NIP-em | 32 |
| 6. Brak NIP-u | 1 |

Jak czytać: pole `name` w bazie to nazwa prawna spółki pod danym NIP-em, więc błędny NIP
nie rzuca się w oczy (np. marka LEGO z nazwą „Skłodowscy Yachting”). Skrypt porównuje markę
z nazwą spółki i łączy to z sygnałami z rejestrów. Samo „marka niepodobna” jest normalne
(Biedronka i Jeronimo Martins Polska), dlatego to osobna, najsłabsza lista.

## 1. Mocne podejrzenie

Suma kontrolna, KRS z innym NIP-em, spółka w likwidacji albo niepodobna nazwa połączona
z wykreśleniem z VAT lub brakiem w rejestrach. Tu najpewniej są błędy jak przy Mokate.

| Firma | NIP | Spółka wg rejestru | Sygnały |
|---|---|---|---|
| [LEGO](https://czypolskafirma.pl/firma/lego) | 5222906324 | SKŁODOWSCY YACHTING SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji; marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2021-03-01; KRS 0000319001: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [bydgoskie meble](https://czypolskafirma.pl/firma/bydgoskie-meble) | 5540231119 | "BYDGOSKIE FABRYKI MEBLI" SPÓŁKA AKCYJNA W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji; marka niepodobna do nazwy spółki (0.25); NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000010819: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [50 style](https://czypolskafirma.pl/firma/50-style) | 6751187580 | MARKETING INVESTMENT GROUP SPÓŁKA AKCYJNA | marka niepodobna do nazwy spółki (0.00); nazwa jak spółka celowa (e-com, holding, finanse, dystrybucja…) |
| [aero2](https://czypolskafirma.pl/firma/aero2) | 7010123529 | AERO 2 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2021-11-30; KRS 0000305767: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [atlas](https://czypolskafirma.pl/firma/atlas) | 7260004406 | HURTOWNIA KSIĘGARSKA "WAX" SP.Z O.O. | marka niepodobna do nazwy spółki (0.00); NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000003868: brak podmiotu w rejestrze przedsiębiorców (404) |
| [beckers](https://czypolskafirma.pl/firma/beckers) | 8720003048 | TIKKURILA POLSKA SPÓŁKA AKCYJNA | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2023-10-31; KRS 0000033601: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [Ceramika Paradyż](https://czypolskafirma.pl/firma/ceramika-paradyz) | 7260002442 | PRZEDSIĘBIORSTWO PRODUKCYJNO-HANDLOWE "LOD-ART" SP.Z O.O. | marka niepodobna do nazwy spółki (0.00); NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000001647: brak podmiotu w rejestrze przedsiębiorców (404) |
| [dr gerard](https://czypolskafirma.pl/firma/dr-gerard) | 5492411874 | MARCIN SURMA | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2022-02-28 |
| [giacomo conti](https://czypolskafirma.pl/firma/giacomo-conti) | 7831613915 | SECRAFT SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2025-09-03 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [InPost](https://czypolskafirma.pl/firma/inpost) | 6793089474 | WOLFAN SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2021-12-21; KRS 0000450783: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [JD Sports](https://czypolskafirma.pl/firma/jd-sports) | 6751187580 | MARKETING INVESTMENT GROUP SPÓŁKA AKCYJNA | marka niepodobna do nazwy spółki (0.00); nazwa jak spółka celowa (e-com, holding, finanse, dystrybucja…) |
| [provident](https://czypolskafirma.pl/firma/provident) | 5251571211 | TOWARZYSTWO PRZEDSIĘBIORCZOŚCI"FORTUNA"SPÓŁKA Z O.O. | marka niepodobna do nazwy spółki (0.00); NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000043771: brak podmiotu w rejestrze przedsiębiorców (404) |
| [reebok](https://czypolskafirma.pl/firma/reebok) | 5261014050 | ADIDAS FINANCE POLAND SPÓŁKA AKCYJNA | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2022-12-01; KRS 0000021544: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze); nazwa jak spółka celowa (e-com, holding, finanse, dystrybucja…) |
| [semilac](https://czypolskafirma.pl/firma/semilac) | 7792413878 | NESPERTA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2021-12-31; KRS 0000463701: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [sizeer](https://czypolskafirma.pl/firma/sizeer) | 6751187580 | MARKETING INVESTMENT GROUP SPÓŁKA AKCYJNA | marka niepodobna do nazwy spółki (0.00); nazwa jak spółka celowa (e-com, holding, finanse, dystrybucja…) |
| [Tołpa](https://czypolskafirma.pl/firma/tolpa) | 8950010885 | TORF CORPORATION - FABRYKA LEKÓW SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | marka niepodobna do nazwy spółki (0.00); NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000098834: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [vivus](https://czypolskafirma.pl/firma/vivus) | 5252531320 | SOONLY FINANCE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | marka niepodobna do nazwy spółki (0.00); nazwa jak spółka celowa (e-com, holding, finanse, dystrybucja…) |
| [wrodzinie](https://czypolskafirma.pl/firma/wrodzinie) | 7010123529 | AERO 2 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2021-11-30; KRS 0000305767: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [Luksja](https://czypolskafirma.pl/firma/pz-cussons-luksja) | 5272364701 | PZ CUSSONS POLSKA SPÓŁKA AKCYJNA W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji |
| [badura](https://czypolskafirma.pl/firma/badura) | 5512620406 | BADURA STUDIO "STUDIO 69 SPÓŁKA Z OGRANICZONA ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI" SPÓŁKA KOMADYTOWA | spółka w likwidacji, upadłości lub restrukturyzacji; NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000807393: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [BoConcept](https://czypolskafirma.pl/firma/boconcept) | 9251826771 | "BOCONCEPT RETAIL POLAND" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ  W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji; NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000153439: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [ursus](https://czypolskafirma.pl/firma/ursus) | 7392388088 | URSUS SPÓŁKA AKCYJNA W UPADŁOŚCI | spółka w likwidacji, upadłości lub restrukturyzacji |
| [bobby burger](https://czypolskafirma.pl/firma/bobby-burger) | 5252546149 | BOBBY BURGER SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji; VAT: Niezarejestrowany, wykreślony 2025-07-29; KRS 0000447567: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [Endorfy](https://czypolskafirma.pl/firma/cooling-endorfy) | 6792975152 |  | NIP ma złą sumę kontrolną albo długość |
| [granna](https://czypolskafirma.pl/firma/granna) | 5210083207 | "CONSILIUM"SPÓŁKA Z O.O. | marka niepodobna do nazwy spółki (0.00); NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000024817: brak podmiotu w rejestrze przedsiębiorców (404) |
| [helios](https://czypolskafirma.pl/firma/helios) | 7251893714 | POLSCY INWESTORZY SPÓŁKA AKCYJNA | marka niepodobna do nazwy spółki (0.00); NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000394095: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [jaguar](https://czypolskafirma.pl/firma/jaguar) | 5213824147 | FUNDACJA PRO MILITARIS | marka niepodobna do nazwy spółki (0.00); VAT: Niezarejestrowany, wykreślony 2025-02-01 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [ferrari](https://czypolskafirma.pl/firma/ferrari) | 7010465365 | "FERRARI POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji; NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000543174: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [gino rossi](https://czypolskafirma.pl/firma/gino-rossi) | 8390202281 | "GINO ROSSI" SPÓŁKA AKCYJNA W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji; VAT: Niezarejestrowany, wykreślony 2024-03-26; KRS 0000043459: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [maxcom](https://czypolskafirma.pl/firma/maxcom) | 7781481614 |  | NIP ma złą sumę kontrolną albo długość |
| [modecom](https://czypolskafirma.pl/firma/modecom) | 6922504223 |  | NIP ma złą sumę kontrolną albo długość |
| [myPhone](https://czypolskafirma.pl/firma/mptech-myphone) | 6792975152 |  | NIP ma złą sumę kontrolną albo długość |
| [panek](https://czypolskafirma.pl/firma/panek) | 6922461623 | PANEK SPÓŁKA AKCYJNA W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji |
| [philips](https://czypolskafirma.pl/firma/philips) | 5211627116 |  | NIP ma złą sumę kontrolną albo długość |
| [platinet](https://czypolskafirma.pl/firma/platinet) | 5832223443 |  | NIP ma złą sumę kontrolną albo długość |
| [spotify](https://czypolskafirma.pl/firma/spotify) | 1070021350 | SPOTIFY POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji; NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000407957: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [TVP – Telewizja Polska](https://czypolskafirma.pl/firma/tvp-telewizja-polska) | 5210412987 | "TELEWIZJA POLSKA" SPÓŁKA AKCYJNA W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji |
| [polskie radio](https://czypolskafirma.pl/firma/polskie-radio) | 5210414265 | POLSKIE RADIO - SPÓŁKA AKCYJNA W LIKWIDACJI | spółka w likwidacji, upadłości lub restrukturyzacji |
| [relpol](https://czypolskafirma.pl/firma/relpol) | 6922504223 |  | NIP ma złą sumę kontrolną albo długość |
| [TikTok](https://czypolskafirma.pl/firma/tiktok) | 3673525 |  | NIP ma złą sumę kontrolną albo długość |
| [tonsil](https://czypolskafirma.pl/firma/tonsil) | 8881014150 |  | NIP ma złą sumę kontrolną albo długość |
| [zortrax](https://czypolskafirma.pl/firma/zortrax) | 8943089203 |  | NIP ma złą sumę kontrolną albo długość |

## 2. Do sprawdzenia

Jeden słabszy sygnał: NIP nieznany w wykazie VAT bez potwierdzenia w KRS, rozbieżny KRS,
wykreślenie z VAT bez potwierdzenia w KRS albo nazwa jak spółka celowa.

| Firma | NIP | Spółka wg rejestru | Sygnały |
|---|---|---|---|
| [Kofola](https://czypolskafirma.pl/firma/kofola-hoop-cola) | 5272525699 | HOOP POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2024-01-03; KRS 0000269410: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [amazon web services](https://czypolskafirma.pl/firma/amazon-web-services) | 5252541034 | AMAZON DATA SERVICES POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | nazwa jak spółka celowa (e-com, holding, finanse, dystrybucja…) |
| [costa coffee](https://czypolskafirma.pl/firma/costa-coffee) | 5262403747 | COSTA COFFEE POLSKA SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2023-05-31; KRS 0000054944: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [fibaro](https://czypolskafirma.pl/firma/fibaro) | 7811858097 | FIBAR GROUP SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2023-12-29; KRS 0000553265: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [interia](https://czypolskafirma.pl/firma/interia) | 5272644300 | GRUPA INTERIA.PL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | VAT: Niezarejestrowany, wykreślony 2023-08-01; KRS 0000416593: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [mieszko](https://czypolskafirma.pl/firma/mieszko) | 6391875874 | MIESZKO DISTRIBUTION SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2021-08-23; KRS 0000240341: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [Sokołów](https://czypolskafirma.pl/firma/sokolow) | 8231403819 | 'SOKOŁÓW-SERVICE' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2025-09-30; KRS 0000025402: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [takeda](https://czypolskafirma.pl/firma/takeda) | 5262868535 | TAKEDA POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000237611: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [whirlpool](https://czypolskafirma.pl/firma/whirlpool) | 8960000492 | WHIRLPOOL POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000510111: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [ALAB laboratoria](https://czypolskafirma.pl/firma/alab-laboratoria) | 5272360548 |  | NIP nieznany w wykazie VAT, brak KRS do sprawdzenia |
| [animex foods](https://czypolskafirma.pl/firma/animex-foods) | 5272698951 | ANIMEX FOODS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2025-06-01; KRS 0000471961: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [euvic](https://czypolskafirma.pl/firma/euvic) | 9691411637 | EUVIC SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2026-01-02; KRS 0001005322: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [inglot](https://czypolskafirma.pl/firma/inglot) | 7952194802 | INGLOT SPÓŁKA AKCYJNA | KRS w bazie 0000164776, w MF 0001246847 |
| [kakadu](https://czypolskafirma.pl/firma/kakadu) | 5272332612 |  | NIP nieznany w wykazie VAT, brak KRS do sprawdzenia |
| [kanani europe](https://czypolskafirma.pl/firma/kanani-europe) | 5252638288 | KANANI EUROPE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2024-08-13; KRS 0000589718: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [Müller](https://czypolskafirma.pl/firma/muller) | 5222904791 |  | NIP nieznany w wykazie VAT, brak KRS do sprawdzenia |
| [muszynianka](https://czypolskafirma.pl/firma/muszynianka) | 7340007298 |  | NIP nieznany w wykazie VAT, brak KRS do sprawdzenia |
| [objectivity](https://czypolskafirma.pl/firma/objectivity) | 8942941304 | OBJECTIVITY SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2025-08-31; KRS 0000303475: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [OSM Ryki](https://czypolskafirma.pl/firma/osm-ryki) | 5060003186 |  | NIP nieznany w wykazie VAT, brak KRS do sprawdzenia |
| [shoper](https://czypolskafirma.pl/firma/shoper) | 9452156998 | SHOPER SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2026-08-31; KRS 0000395171: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |
| [Sphinx](https://czypolskafirma.pl/firma/sphinx-sfinks) | 9291666687 |  | NIP nieznany w wykazie VAT, brak KRS do sprawdzenia |
| [telefonia dialog](https://czypolskafirma.pl/firma/telefonia-dialog) | 6921990816 | TELEFONIA DIALOG SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | NIP nieznany w wykazie VAT i KRS go nie potwierdza; KRS 0000419488: KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze) |

## 3. Wykaz VAT mówi „brak” lub „wykreślony”, ale KRS potwierdza NIP

Zwykle grupa VAT (od 2023 r. duże grupy rozliczają VAT wspólnie, a spółki znikają z wykazu)
albo oddział zagranicznej spółki. NIP jest najpewniej dobry; informacyjnie.

| Firma | NIP | Spółka wg rejestru | Sygnały |
|---|---|---|---|
| [avon](https://czypolskafirma.pl/firma/avon) | 5260303823 | AVON COSMETICS POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2023-06-30 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [BMW](https://czypolskafirma.pl/firma/bmw) | 5213890492 | BMW POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [bridgestone](https://czypolskafirma.pl/firma/bridgestone) | 1080021067 | BRIDGESTONE EUROPE NV/SA SPÓŁKA AKCYJNA ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [honda](https://czypolskafirma.pl/firma/honda) | 1080013487 | HONDA MOTOR EUROPE LIMITED (SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ) ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [hugo boss](https://czypolskafirma.pl/firma/hugo-boss) | 1080027271 | HUGO BOSS AG (SPÓŁKA AKCYJNA) ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [inbank](https://czypolskafirma.pl/firma/inbank) | 1070036848 | AS INBANK SPÓŁKA AKCYJNA-ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [ING](https://czypolskafirma.pl/firma/ing) | 6340135475 | ING BANK ŚLĄSKI SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2024-06-30 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [monster energy](https://czypolskafirma.pl/firma/monster-energy) | 1070016716 | MONSTER ENERGY EUROPE LIMITED SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [Mrówka](https://czypolskafirma.pl/firma/mrowka) | 6551974758 | GRUPA POLSKIE SKŁADY BUDOWLANE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony); marka niepodobna do nazwy spółki (0.00) |
| [nest bank](https://czypolskafirma.pl/firma/nest-bank) | 5261021021 | NEST BANK SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2025-03-31 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [neuca](https://czypolskafirma.pl/firma/neuca) | 8790017162 | NEUCA SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2024-10-31 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [nutricia](https://czypolskafirma.pl/firma/nutricia) | 8241000856 | NUTRICIA POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | VAT: Niezarejestrowany, wykreślony 2024-10-31 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [panasonic](https://czypolskafirma.pl/firma/panasonic) | 1070016082 | PANASONIC MARKETING EUROPE GMBH (SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ) ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [prudential](https://czypolskafirma.pl/firma/prudential) | 1080022285 | PRUDENTIAL INTERNATIONAL ASSURANCE PLC SPÓŁKA AKCYJNA ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [PZU](https://czypolskafirma.pl/firma/pzu) | 5260251049 | POWSZECHNY ZAKŁAD UBEZPIECZEŃ SPÓŁKA AKCYJNA | VAT: Niezarejestrowany, wykreślony 2026-03-31 (KRS aktywny z tym NIP-em, pewnie grupa VAT) |
| [raiffeisen](https://czypolskafirma.pl/firma/raiffeisen) | 1080022664 | RAIFFEISEN BANK INTERNATIONAL AG (SPÓŁKA AKCYJNA) ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [revolut](https://czypolskafirma.pl/firma/revolut) | 1060005786 | REVOLUT LTD (SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ) ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [sony](https://czypolskafirma.pl/firma/sony) | 1080022836 | SONY EUROPE B.V. (SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ) ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [UniCredit](https://czypolskafirma.pl/firma/unicredit) | 1080023480 | UNICREDIT S.A. SPÓŁKA AKCYJNA ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [yamaha](https://czypolskafirma.pl/firma/yamaha) | 1070031615 | YAMAHA MOTOR EUROPE N.V. (SPÓŁKA AKCYJNA) ODDZIAŁ W POLSCE | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |
| [zelmer](https://czypolskafirma.pl/firma/zelmer) | 7831813531 | ZELMER POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony) |

## 4. Marka niepodobna do nazwy spółki, brak innych sygnałów

Najczęściej w porządku (marka handlowa inna niż nazwa spółki). Warto przejrzeć wzrokiem
górę listy, posortowanej od najmniej podobnych.

| Firma | NIP | Spółka wg rejestru | Podob. |
|---|---|---|---|
| [4F](https://czypolskafirma.pl/firma/4f) | 9451978451 | OTCF SPÓŁKA AKCYJNA | 0.00 |
| [a2mobile](https://czypolskafirma.pl/firma/a2mobile) | 9542746551 | PREMIUM MOBILE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [alexander](https://czypolskafirma.pl/firma/alexander) | 5891439727 | PIOTR PUNDZIS | 0.00 |
| [alfa romeo](https://czypolskafirma.pl/firma/alfa-romeo) | 5470048627 | FCA POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [audi](https://czypolskafirma.pl/firma/audi) | 7822463563 | VOLKSWAGEN GROUP POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [AVA Laboratorium](https://czypolskafirma.pl/firma/ava-laboratorium) | 1130016141 | LARYSA DYSPUT-GOŁAWSKA | 0.00 |
| [biedronka](https://czypolskafirma.pl/firma/biedronka) | 7791011327 | JERONIMO MARTINS POLSKA SPÓŁKA AKCYJNA | 0.00 |
| [BLIK](https://czypolskafirma.pl/firma/blik) | 5213664494 | POLSKI STANDARD PŁATNOŚCI SPÓŁKA AKCYJNA | 0.00 |
| [brand24](https://czypolskafirma.pl/firma/brand24) | 5252515479 | BRAND 24 SPÓŁKA AKCYJNA | 0.00 |
| [Bricomarché](https://czypolskafirma.pl/firma/bricomarche) | 7780000892 | "ITM POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [burger king](https://czypolskafirma.pl/firma/burger-king) | 5260211104 | "AMREST" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [bytom](https://czypolskafirma.pl/firma/bytom) | 6750000361 | VRG SPÓŁKA AKCYJNA | 0.00 |
| [calvin klein](https://czypolskafirma.pl/firma/calvin-klein) | 5252312380 | PVH BRANDS POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [calzedonia](https://czypolskafirma.pl/firma/calzedonia) | 5252313681 | CALZ POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [ceneo](https://czypolskafirma.pl/firma/ceneo) | 5252674798 | ALLEGRO SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [Citroën](https://czypolskafirma.pl/firma/citroen) | 5260151365 | STELLANTIS POLSKA  SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [comforty](https://czypolskafirma.pl/firma/comforty) | 6222353050 | COM40 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | 0.00 |
| [cropp](https://czypolskafirma.pl/firma/cropp) | 5831014898 | LPP SPÓŁKA AKCYJNA | 0.00 |
| [CUPRA](https://czypolskafirma.pl/firma/cupra) | 7822552806 | "MAŁGORZATA" DEKORACJA I AUTOMATYKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [dacia](https://czypolskafirma.pl/firma/dacia) | 5260205983 | RENAULT POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [dekoral](https://czypolskafirma.pl/firma/dekoral) | 8951760602 | PPG DECO POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [dekoria](https://czypolskafirma.pl/firma/dekoria) | 8842486272 | "FRANC - TEXTIL" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [diverse](https://czypolskafirma.pl/firma/diverse) | 5840303202 | "ETOS" SPÓŁKA AKCYJNA | 0.00 |
| [dolina noteci](https://czypolskafirma.pl/firma/dolina-noteci) | 7642679020 | DNP SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [Domino's Pizza](https://czypolskafirma.pl/firma/domino-s-pizza) | 5242712882 | DP POLSKA SPÓŁKA AKCYJNA | 0.00 |
| [dulux](https://czypolskafirma.pl/firma/dulux) | 1180047014 | AKZO NOBEL DECORATIVE PAINTS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [E.ON](https://czypolskafirma.pl/firma/e-on) | 5250001090 | POLSKA WYTWÓRNIA PAPIERÓW WARTOŚCIOWYCH SPÓŁKA AKCYJNA | 0.00 |
| [eobuwie.pl](https://czypolskafirma.pl/firma/eobuwie-pl) | 9291353356 | MODIVO.COM SPÓŁKA AKCYJNA | 0.00 |
| [fakt](https://czypolskafirma.pl/firma/fakt) | 5271037727 | POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [fiat](https://czypolskafirma.pl/firma/fiat) | 5470048627 | FCA POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [fujitsu](https://czypolskafirma.pl/firma/fujitsu) | 1132172342 | TECHNOLOGY SOLUTIONS 360 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [gatta](https://czypolskafirma.pl/firma/gatta) | 8291004247 | FERAX SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [gazeta wyborcza](https://czypolskafirma.pl/firma/gazeta-wyborcza) | 5260305644 | AGORA SPÓŁKA AKCYJNA | 0.00 |
| [glovo](https://czypolskafirma.pl/firma/glovo) | 7252012779 | "RESTAURANT PARTNER POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [gorenje](https://czypolskafirma.pl/firma/gorenje) | 5210524350 | HISENSE POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [hebe](https://czypolskafirma.pl/firma/hebe) | 2090001776 | JERONIMO MARTINS DROGERIE I FARMACJA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [heyah](https://czypolskafirma.pl/firma/heyah) | 5261040567 | T-MOBILE POLSKA SPÓŁKA AKCYJNA | 0.00 |
| [house](https://czypolskafirma.pl/firma/house) | 5831014898 | LPP SPÓŁKA AKCYJNA | 0.00 |
| [intimissimi](https://czypolskafirma.pl/firma/intimissimi) | 5252313681 | CALZ POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [jeep](https://czypolskafirma.pl/firma/jeep) | 5470048627 | FCA POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [JSW](https://czypolskafirma.pl/firma/jsw) | 6330005110 | JASTRZĘBSKA SPÓŁKA WĘGLOWA SPÓŁKA AKCYJNA | 0.00 |
| [junak](https://czypolskafirma.pl/firma/junak) | 5562678193 | ALMOT MIKOŁAJ SIBORA SPÓŁKA KOMANDYTOWA | 0.00 |
| [kernau](https://czypolskafirma.pl/firma/kernau) | 8151664972 | GT GROUP TOMASZEK SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [KFC](https://czypolskafirma.pl/firma/kfc) | 5260211104 | "AMREST" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [lajt.mobile](https://czypolskafirma.pl/firma/lajt-mobile) | 5441014413 | TELESTRADA SPÓŁKA AKCYJNA | 0.00 |
| [lamborghini](https://czypolskafirma.pl/firma/lamborghini) | 6461002655 | PORSCHE INTER AUTO POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [lancerto](https://czypolskafirma.pl/firma/lancerto) | 8151747126 | G8 SPÓŁKA AKCYJNA | 0.00 |
| [land rover](https://czypolskafirma.pl/firma/land-rover) | 5272930046 | INCHCAPE JLR POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [lasocki](https://czypolskafirma.pl/firma/lasocki) | 6922200609 | MODIVO SPÓŁKA AKCYJNA | 0.00 |
| [E.Leclerc](https://czypolskafirma.pl/firma/leclerc) | 5222586670 | "GALEC" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [lexus](https://czypolskafirma.pl/firma/lexus) | 5210123177 | TOYOTA CENTRAL EUROPE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [local heroes](https://czypolskafirma.pl/firma/local-heroes) | 6760000782 | GREENPOINT SPÓŁKA AKCYJNA | 0.00 |
| [maserati](https://czypolskafirma.pl/firma/maserati) | 1133091516 | GRAND AUTOMOTIVE POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [media expert](https://czypolskafirma.pl/firma/media-expert) | 7671004218 | TERG SPÓŁKA AKCYJNA | 0.00 |
| [medicine](https://czypolskafirma.pl/firma/medicine) | 6793049718 | BRANDBQ SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [mitsubishi](https://czypolskafirma.pl/firma/mitsubishi) | 9512324704 | ASTARA NIP POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [mobile vikings](https://czypolskafirma.pl/firma/mobile-vikings) | 8971793639 | VIKINGCO POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [mohito](https://czypolskafirma.pl/firma/mohito) | 5831014898 | LPP SPÓŁKA AKCYJNA | 0.00 |
| [MOYA](https://czypolskafirma.pl/firma/moya) | 5270011878 | ANWIM SPÓŁKA AKCYJNA | 0.00 |
| [MPM](https://czypolskafirma.pl/firma/mpm) | 5222681285 | MARCIN STAŃCZAK | 0.00 |
| [Nałęczowianka](https://czypolskafirma.pl/firma/naleczowianka) | 5270203968 | NESTLE POLSKA SPÓŁKA AKCYJNA | 0.00 |
| [NeoNail](https://czypolskafirma.pl/firma/neonail) | 9721241158 | COSMO GROUP SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [nju mobile](https://czypolskafirma.pl/firma/nju-mobile) | 5260250995 | ORANGE POLSKA SPÓŁKA AKCYJNA | 0.00 |
| [onet](https://czypolskafirma.pl/firma/onet) | 5272644323 | WYDAWNICTWO BAUER SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA JAWNA | 0.00 |
| [opel](https://czypolskafirma.pl/firma/opel) | 5260151365 | STELLANTIS POLSKA  SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [OSM Krasnystaw](https://czypolskafirma.pl/firma/osm-krasnystaw) | 5640000939 | OKRĘGOWA SPÓŁDZIELNIA MLECZARSKA W KRASNYMSTAWIE | 0.00 |
| [OSM Piątnica](https://czypolskafirma.pl/firma/osm-piatnica) | 7180000240 | OKRĘGOWA SPÓŁDZIELNIA MLECZARSKA W PIĄTNICY | 0.00 |
| [pamapol](https://czypolskafirma.pl/firma/pamapol) | 8321761681 | FOODHUB SPÓŁKA AKCYJNA | 0.00 |
| [payback](https://czypolskafirma.pl/firma/payback) | 5272558871 | LOYALTY PARTNER POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [People Can Fly](https://czypolskafirma.pl/firma/people-can-fly) | 5213451404 | PCF GROUP SPÓŁKA AKCYJNA | 0.00 |
| [peugeot](https://czypolskafirma.pl/firma/peugeot) | 5260151365 | STELLANTIS POLSKA  SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [PGNiG](https://czypolskafirma.pl/firma/pgnig) | 5272706082 | MYORLEN SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [Piątnica](https://czypolskafirma.pl/firma/piatnica) | 7180000240 | OKRĘGOWA SPÓŁDZIELNIA MLECZARSKA W PIĄTNICY | 0.00 |
| [pizza hut](https://czypolskafirma.pl/firma/pizza-hut) | 5260211104 | "AMREST" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [play](https://czypolskafirma.pl/firma/play) | 9512120077 | P4 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [plus](https://czypolskafirma.pl/firma/plus) | 5271037727 | POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [plush](https://czypolskafirma.pl/firma/plush) | 5271037727 | POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [polkomtel infrastruktura](https://czypolskafirma.pl/firma/polkomtel-infrastruktura) | 1132868871 | TOWERLINK POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [POLOmarket](https://czypolskafirma.pl/firma/polomarket) | 5562125117 | POLSKIE SUPERMARKETY SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [profim](https://czypolskafirma.pl/firma/profim) | 6680000366 | FLOKK SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [przelewy24](https://czypolskafirma.pl/firma/przelewy24) | 7792369887 | PAYPRO SPÓŁKA AKCYJNA | 0.00 |
| [Pyszne.pl](https://czypolskafirma.pl/firma/pyszne-pl) | 8971886884 | TAKEAWAY.COM EXPRESS POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [reserved](https://czypolskafirma.pl/firma/reserved) | 5831014898 | LPP SPÓŁKA AKCYJNA | 0.00 |
| [ringier axel springer polska](https://czypolskafirma.pl/firma/ringier-axel-springer-polska) | 5271037727 | POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [Ryłko](https://czypolskafirma.pl/firma/rylko) | 5512269794 | YRK SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWO-AKCYJNA | 0.00 |
| [rzeczpospolita](https://czypolskafirma.pl/firma/rzeczpospolita) | 5220103673 | GREMI MEDIA SPÓŁKA AKCYJNA | 0.00 |
| [SEAT](https://czypolskafirma.pl/firma/seat) | 7822463563 | VOLKSWAGEN GROUP POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [selgros](https://czypolskafirma.pl/firma/selgros) | 7811011998 | TRANSGOURMET POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [sinsay](https://czypolskafirma.pl/firma/sinsay) | 5831014898 | LPP SPÓŁKA AKCYJNA | 0.00 |
| [sits](https://czypolskafirma.pl/firma/sits) | 8741704017 | ACTONA POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [Škoda](https://czypolskafirma.pl/firma/skoda) | 7822463563 | VOLKSWAGEN GROUP POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [starbucks](https://czypolskafirma.pl/firma/starbucks) | 5260211104 | "AMREST" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [subway](https://czypolskafirma.pl/firma/subway) | 7010210116 | ROYAL SUB SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [super express](https://czypolskafirma.pl/firma/super-express) | 5260008745 | ZPR MEDIA FILM & TV SPÓŁKA AKCYJNA | 0.00 |
| [tago](https://czypolskafirma.pl/firma/tago) | 1250007357 | MEBLE 21 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [TaniaKsiazka.pl](https://czypolskafirma.pl/firma/taniaksiazka-pl) | 5423151157 | GLOSEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | 0.00 |
| [tatuum](https://czypolskafirma.pl/firma/tatuum) | 7251019880 | "KAN" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [telepizza](https://czypolskafirma.pl/firma/telepizza) | 5270202489 | T-PIZZA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [TietoEVRY](https://czypolskafirma.pl/firma/tietoevry) | 8542085557 | TIETO TECH CONSULTING POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [TK Maxx](https://czypolskafirma.pl/firma/tk-maxx) | 7010180987 | TJX POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [TOK FM](https://czypolskafirma.pl/firma/tok-fm) | 5261001248 | "INFORADIO" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [tommy hilfiger](https://czypolskafirma.pl/firma/tommy-hilfiger) | 5252312380 | PVH BRANDS POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [top market](https://czypolskafirma.pl/firma/top-market) | 5262685674 | PGS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [tpay](https://czypolskafirma.pl/firma/tpay) | 7773061579 | KRAJOWY INTEGRATOR PŁATNOŚCI SPÓŁKA AKCYJNA | 0.00 |
| [venezia](https://czypolskafirma.pl/firma/venezia) | 9521000409 | ARTIMOD SPÓŁKA AKCYJNA | 0.00 |
| [virgin mobile](https://czypolskafirma.pl/firma/virgin-mobile) | 9512120077 | P4 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [vistula](https://czypolskafirma.pl/firma/vistula) | 6750000361 | VRG SPÓŁKA AKCYJNA | 0.00 |
| [WFM Kuchnie](https://czypolskafirma.pl/firma/wfm-kuchnie) | 7441586760 | "SZYNAKA-MEBLE" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.00 |
| [Wólczanka](https://czypolskafirma.pl/firma/wolczanka) | 6750000361 | VRG SPÓŁKA AKCYJNA | 0.00 |
| [kam meble](https://czypolskafirma.pl/firma/kam-meble) | 5780000460 | "SPÓŁKA MEBLOWA KAM"-K.KOSIAK, M.SZEWCZUK, A.WOŁOSZ, T.ZARZĘBSKI-SPÓŁKA JAWNA | 0.09 |
| [citi handlowy](https://czypolskafirma.pl/firma/citi-handlowy) | 5260300291 | BANK HANDLOWY W WARSZAWIE SPÓŁKA AKCYJNA | 0.20 |
| [Kopernik Toruńskie Pierniki](https://czypolskafirma.pl/firma/kopernik-torunskie-pierniki) | 8790168458 | FABRYKA CUKIERNICZA "KOPERNIK" SPÓŁKA AKCYJNA | 0.20 |
| [MK Foam Koło](https://czypolskafirma.pl/firma/mk-foam-kolo) | 6660003806 | M&K FOAM GMBH SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.20 |
| [Bank Pekao](https://czypolskafirma.pl/firma/pekao) | 5260006841 | BANK POLSKA KASA OPIEKI - SPÓŁKA AKCYJNA | 0.20 |
| [polfa tarchomin](https://czypolskafirma.pl/firma/polfa-tarchomin) | 5250000564 | TARCHOMIŃSKIE ZAKŁADY FARMACEUTYCZNE "POLFA" SPÓŁKA AKCYJNA | 0.20 |
| [PPL Koral](https://czypolskafirma.pl/firma/ppl-koral) | 7370000295 | PRZEDSIĘBIORSTWO PRODUKCJI LODÓW KORAL SPÓŁKA JAWNA | 0.20 |
| [FB Antczak](https://czypolskafirma.pl/firma/fb-antczak) | 6181012144 | FIRMA BUDOWLANA ANTCZAK SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.25 |
| [RTV EURO AGD](https://czypolskafirma.pl/firma/rtv-euro-agd) | 5270005984 | "EURO - NET" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | 0.25 |
| [SKOK Kasa Stefczyka](https://czypolskafirma.pl/firma/skok-kasa-stefczyka) | 5861040096 | SPÓŁDZIELCZA KASA OSZCZĘDNOŚCIOWO - KREDYTOWA IM. FRANCISZKA STEFCZYKA | 0.25 |

## 5. Kilka firm z tym samym NIP-em

Jedna spółka z kilkoma markami jest w porządku, ale sprawdź, czy każda marka naprawdę do niej należy.

| NIP | Spółka | Firmy |
|---|---|---|
| 6751187580 | MARKETING INVESTMENT GROUP SPÓŁKA AKCYJNA | [50 style](https://czypolskafirma.pl/firma/50-style), [JD Sports](https://czypolskafirma.pl/firma/jd-sports), [sizeer](https://czypolskafirma.pl/firma/sizeer) |
| 9542746551 | PREMIUM MOBILE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [a2mobile](https://czypolskafirma.pl/firma/a2mobile), [premium mobile](https://czypolskafirma.pl/firma/premium-mobile) |
| 7010123529 | AERO 2 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [aero2](https://czypolskafirma.pl/firma/aero2), [wrodzinie](https://czypolskafirma.pl/firma/wrodzinie) |
| 5260305644 | AGORA SPÓŁKA AKCYJNA | [agora](https://czypolskafirma.pl/firma/agora), [gazeta wyborcza](https://czypolskafirma.pl/firma/gazeta-wyborcza) |
| 5470048627 | FCA POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [alfa romeo](https://czypolskafirma.pl/firma/alfa-romeo), [fiat](https://czypolskafirma.pl/firma/fiat), [jeep](https://czypolskafirma.pl/firma/jeep) |
| 5252674798 | ALLEGRO SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [allegro](https://czypolskafirma.pl/firma/allegro), [ceneo](https://czypolskafirma.pl/firma/ceneo) |
| 7822463563 | VOLKSWAGEN GROUP POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [audi](https://czypolskafirma.pl/firma/audi), [SEAT](https://czypolskafirma.pl/firma/seat), [Škoda](https://czypolskafirma.pl/firma/skoda), [volkswagen](https://czypolskafirma.pl/firma/volkswagen) |
| 9442043784 | BIELENDA GROUP SPÓŁKA AKCYJNA | [bielenda](https://czypolskafirma.pl/firma/bielenda), [dermika](https://czypolskafirma.pl/firma/dermika), [soraya](https://czypolskafirma.pl/firma/soraya) |
| 5260211104 | 'AMREST' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [burger king](https://czypolskafirma.pl/firma/burger-king), [KFC](https://czypolskafirma.pl/firma/kfc), [pizza hut](https://czypolskafirma.pl/firma/pizza-hut), [starbucks](https://czypolskafirma.pl/firma/starbucks) |
| 6750000361 | VRG SPÓŁKA AKCYJNA | [bytom](https://czypolskafirma.pl/firma/bytom), [vistula](https://czypolskafirma.pl/firma/vistula), [Wólczanka](https://czypolskafirma.pl/firma/wolczanka) |
| 5252312380 | PVH BRANDS POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [calvin klein](https://czypolskafirma.pl/firma/calvin-klein), [tommy hilfiger](https://czypolskafirma.pl/firma/tommy-hilfiger) |
| 5252313681 | 'CALZ POLSKA' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [calzedonia](https://czypolskafirma.pl/firma/calzedonia), [intimissimi](https://czypolskafirma.pl/firma/intimissimi) |
| 6922200609 | MODIVO SPÓŁKA AKCYJNA | [CCC](https://czypolskafirma.pl/firma/ccc), [lasocki](https://czypolskafirma.pl/firma/lasocki) |
| 5260151365 | STELLANTIS POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [Citroën](https://czypolskafirma.pl/firma/citroen), [opel](https://czypolskafirma.pl/firma/opel), [peugeot](https://czypolskafirma.pl/firma/peugeot) |
| 6222353050 | COM40 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | [com40](https://czypolskafirma.pl/firma/com40), [comforty](https://czypolskafirma.pl/firma/comforty) |
| 5831014898 | LPP SPÓŁKA AKCYJNA | [cropp](https://czypolskafirma.pl/firma/cropp), [house](https://czypolskafirma.pl/firma/house), [mohito](https://czypolskafirma.pl/firma/mohito), [reserved](https://czypolskafirma.pl/firma/reserved), [sinsay](https://czypolskafirma.pl/firma/sinsay) |
| 5260205983 | RENAULT POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [dacia](https://czypolskafirma.pl/firma/dacia), [renault](https://czypolskafirma.pl/firma/renault) |
| 8960005673 | ERSTE BANK POLSKA SPÓŁKA AKCYJNA | [erste bank](https://czypolskafirma.pl/firma/erste-bank), [santander bank polska](https://czypolskafirma.pl/firma/santander-bank-polska) |
| 5271037727 | POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [fakt](https://czypolskafirma.pl/firma/fakt), [plus](https://czypolskafirma.pl/firma/plus), [plush](https://czypolskafirma.pl/firma/plush), [ringier axel springer polska](https://czypolskafirma.pl/firma/ringier-axel-springer-polska) |
| 5210524350 | HISENSE POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [gorenje](https://czypolskafirma.pl/firma/gorenje), [hisense](https://czypolskafirma.pl/firma/hisense) |
| 5261040567 | T-MOBILE POLSKA SPÓŁKA AKCYJNA | [heyah](https://czypolskafirma.pl/firma/heyah), [T-Mobile](https://czypolskafirma.pl/firma/t-mobile) |
| 5220101645 | GROUPE SEB POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [krups](https://czypolskafirma.pl/firma/krups), [tefal](https://czypolskafirma.pl/firma/tefal) |
| 6461002655 | PORSCHE INTER AUTO POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [lamborghini](https://czypolskafirma.pl/firma/lamborghini), [porsche](https://czypolskafirma.pl/firma/porsche) |
| 5213845149 | LEEWRANGLER POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [lee](https://czypolskafirma.pl/firma/lee), [wrangler](https://czypolskafirma.pl/firma/wrangler) |
| 5210123177 | TOYOTA CENTRAL EUROPE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [lexus](https://czypolskafirma.pl/firma/lexus), [toyota](https://czypolskafirma.pl/firma/toyota) |
| 5270203968 | NESTLE POLSKA SPÓŁKA AKCYJNA | [Nałęczowianka](https://czypolskafirma.pl/firma/naleczowianka), [Nestlé](https://czypolskafirma.pl/firma/nestle) |
| 5260250995 | ORANGE POLSKA SPÓŁKA AKCYJNA | [nju mobile](https://czypolskafirma.pl/firma/nju-mobile), [orange](https://czypolskafirma.pl/firma/orange) |
| 7792433421 | GRUPA OLX SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [OLX](https://czypolskafirma.pl/firma/olx), [otodom](https://czypolskafirma.pl/firma/otodom), [otomoto](https://czypolskafirma.pl/firma/otomoto) |
| 7180000240 | OKRĘGOWA SPÓŁDZIELNIA MLECZARSKA W PIĄTNICY | [OSM Piątnica](https://czypolskafirma.pl/firma/osm-piatnica), [Piątnica](https://czypolskafirma.pl/firma/piatnica) |
| 9512120077 | 'P4 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' | [play](https://czypolskafirma.pl/firma/play), [virgin mobile](https://czypolskafirma.pl/firma/virgin-mobile) |
| 5272015509 | GRUPA RMF SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA | [RMF FM](https://czypolskafirma.pl/firma/rmf-fm), [RMF MAXX](https://czypolskafirma.pl/firma/rmf-maxx) |
| 7441586760 | "SZYNAKA-MEBLE" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ | [szynaka meble](https://czypolskafirma.pl/firma/szynaka-meble), [WFM Kuchnie](https://czypolskafirma.pl/firma/wfm-kuchnie) |

## 6. Brak NIP-u

[Żywiec Zdrój](https://czypolskafirma.pl/firma/zywiec-zdroj)
