-- Poprawki NIP po przeglądzie tożsamości (docs/POPRAWKI_NIP_2026-09-27.md).
-- Dane spółek z Białej Listy MF z dnia 2026-09-27. Każdy UPDATE ma warunek na stary NIP,
-- więc ponowne uruchomienie albo rekord zmieniony w międzyczasie nic nie psuje.
-- Zmienia tylko dane spółki (name, nip, krs, regon, adres, vat_czynny, registry_url).
-- Właściciel, kraj i opisy zostają; dla kategorii C zrób potem partię --reweryfikacja.
-- Przed uruchomieniem: backup (node tools/firmy/backup.mjs).

begin;

-- LEGO [A]: 5222906324 SKŁODOWSCY YACHTING SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI -> 5261011494
update companies set name = '"LEGO POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5261011494', krs = '0000033901', regon = '010835263', adres = 'WOŁOSKA 22A, 02-675 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/33901' where slug = 'lego' and nip = '5222906324';
-- Bydgoskie Meble [A]: 5540231119 "BYDGOSKIE FABRYKI MEBLI" SPÓŁKA AKCYJNA W LIKWIDACJI -> 5272552325
update companies set name = 'BELURO HOME SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5272552325', krs = '0000291100', regon = '141087894', adres = 'BOLESŁAWIECKA 10, 98-400 WIERUSZÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/291100' where slug = 'bydgoskie-meble' and nip = '5540231119';
-- Aero2 [A]: 7010123529 AERO 2 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5271037727
update companies set name = 'POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5271037727', krs = '0000419430', regon = '011307968', adres = 'KONSTRUKTORSKA 4, 02-673 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/419430' where slug = 'aero2' and nip = '7010123529';
-- Wrodzinie [A]: 7010123529 AERO 2 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5271037727
update companies set name = 'POLKOMTEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5271037727', krs = '0000419430', regon = '011307968', adres = 'KONSTRUKTORSKA 4, 02-673 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/419430' where slug = 'wrodzinie' and nip = '7010123529';
-- Atlas [A]: 7260004406 HURTOWNIA KSIĘGARSKA "WAX" SP.Z O.O. -> 9471936467
update companies set name = 'ATLAS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '9471936467', krs = '0000264887', regon = '100253695', adres = 'JANA KILIŃSKIEGO 2, 91-421 ŁÓDŹ', vat_czynny = true, registry_url = 'https://rejestr.io/krs/264887' where slug = 'atlas' and nip = '7260004406';
-- Beckers [C]: 8720003048 TIKKURILA POLSKA SPÓŁKA AKCYJNA -> 8951760602
update companies set name = 'PPG DECO POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '8951760602', krs = '0000068982', regon = '932708766', adres = 'KWIDZYŃSKA 8, 51-416 WROCŁAW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/68982' where slug = 'beckers' and nip = '8720003048';
-- Ceramika Paradyż [A]: 7260002442 PRZEDSIĘBIORSTWO PRODUKCYJNO-HANDLOWE "LOD-ART" SP.Z O.O. -> 7681662555
update companies set name = '"CERAMIKA PARADYŻ" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '7681662555', krs = '0000125109', regon = '592184659', adres = 'PIOTRKOWSKA 61, 26-300 OPOCZNO', vat_czynny = true, registry_url = 'https://rejestr.io/krs/125109' where slug = 'ceramika-paradyz' and nip = '7260002442';
-- Dr Gerard [A]: 5492411874 SURMA - Marcin Surma -> 5252562697
update companies set name = 'DR GERARD SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5252562697', krs = '0000474611', regon = '146843780', adres = 'RADZYŃSKA 9, 21-560 MIĘDZYRZEC PODLASKI', vat_czynny = true, registry_url = 'https://rejestr.io/krs/474611' where slug = 'dr-gerard' and nip = '5492411874';
-- Giacomo Conti [A]: 7831613915 SECRAFT SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 7792406269
update companies set name = '"DESIGN MAN PLUS" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '7792406269', krs = '0001145039', regon = '302138897', adres = 'KOPANINA 54/56, 60-105 POZNAŃ', vat_czynny = true, registry_url = 'https://rejestr.io/krs/1145039' where slug = 'giacomo-conti' and nip = '7831613915';
-- InPost [A]: 6793089474 WOLFAN SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA -> 6793108059
update companies set name = 'INPOST SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '6793108059', krs = '0000543759', regon = '360781085', adres = 'PANA TADEUSZA 4, 30-727 KRAKÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/543759' where slug = 'inpost' and nip = '6793089474';
-- Provident [A]: 5251571211 TOWARZYSTWO PRZEDSIĘBIORCZOŚCI"FORTUNA"SPÓŁKA Z O.O. -> 5251571292
update companies set name = 'PROVIDENT POLSKA SPÓŁKA AKCYJNA', nip = '5251571292', krs = '0000009389', regon = '011994880', adres = 'INFLANCKA 4A, 00-189 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/9389' where slug = 'provident' and nip = '5251571211';
-- Reebok [C]: 5261014050 ADIDAS FINANCE POLAND SPÓŁKA AKCYJNA -> 6922200609
update companies set name = 'MODIVO SPÓŁKA AKCYJNA', nip = '6922200609', krs = '0000211692', regon = '390716905', adres = 'STREFOWA 6, 59-101 POLKOWICE', vat_czynny = true, registry_url = 'https://rejestr.io/krs/211692' where slug = 'reebok' and nip = '5261014050';
-- Semilac [C]: 7792413878 NESPERTA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5252837102
update companies set name = 'NESPERTA EUROPE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5252837102', krs = '0000860765', regon = '387104337', adres = 'OBORNICKA 7, 62-002 JELONEK', vat_czynny = true, registry_url = 'https://rejestr.io/krs/860765' where slug = 'semilac' and nip = '7792413878';
-- Tołpa [C]: 8950010885 TORF CORPORATION - FABRYKA LEKÓW SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 9442043784
update companies set name = 'BIELENDA GROUP SPÓŁKA AKCYJNA', nip = '9442043784', krs = '0000982226', regon = '356357380', adres = 'FABRYCZNA 20, 31-553 KRAKÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/982226' where slug = 'tolpa' and nip = '8950010885';
-- Luksja [A]: 5272364701 PZ CUSSONS POLSKA SPÓŁKA AKCYJNA W LIKWIDACJI -> 5210418872
update companies set name = 'SARANTIS POLSKA SPÓŁKA AKCYJNA', nip = '5210418872', krs = '0000158603', regon = '010504922', adres = 'PUŁAWSKA 42C, 05-500 PIASECZNO', vat_czynny = true, registry_url = 'https://rejestr.io/krs/158603' where slug = 'pz-cussons-luksja' and nip = '5272364701';
-- Badura [C]: 5512620406 BADURA STUDIO "STUDIO 69 SPÓŁKA Z OGRANICZONA ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI" SPÓŁKA KOMADYTOWA -> 6922200609
update companies set name = 'MODIVO SPÓŁKA AKCYJNA', nip = '6922200609', krs = '0000211692', regon = '390716905', adres = 'STREFOWA 6, 59-101 POLKOWICE', vat_czynny = true, registry_url = 'https://rejestr.io/krs/211692' where slug = 'badura' and nip = '5512620406';
-- BoConcept [A]: 9251826771 "BOCONCEPT RETAIL POLAND" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ  W LIKWIDACJI -> 9512369291
update companies set name = 'DESIGN SOUL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '9512369291', krs = '0000469604', regon = '146779438', adres = 'JANA PAWŁA WORONICZA 31, 02-640 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/469604' where slug = 'boconcept' and nip = '9251826771';
-- Ursus [A]: 7392388088 URSUS SPÓŁKA AKCYJNA W UPADŁOŚCI -> 7011211603
update companies set name = 'URSUS INDUSTRIES SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '7011211603', krs = '0001112913', regon = '529028026', adres = 'WIOŚLARSKA 8, 00-411 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/1112913' where slug = 'ursus' and nip = '7392388088';
-- Endorfy [A]: 6792975152  -> 5223020887
update companies set name = 'COOLING SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5223020887', krs = '0000970871', regon = '360174497', adres = 'SOKOŁOWSKA 24, 05-806 SOKOŁÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/970871' where slug = 'cooling-endorfy' and nip = '6792975152';
-- Granna [A]: 5210083207 "CONSILIUM"SPÓŁKA Z O.O. -> 5252180783
update companies set name = 'GRANNA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5252180783', krs = '0000102728', regon = '016344939', adres = 'EDWARDA JELINKA 48, 01-646 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/102728' where slug = 'granna' and nip = '5210083207';
-- Helios [A]: 7251893714 POLSCY INWESTORZY SPÓŁKA AKCYJNA -> 7251482632
update companies set name = 'HELIOS SPÓŁKA AKCYJNA', nip = '7251482632', krs = '0000005092', regon = '471544933', adres = 'HENRYKA SIENKIEWICZA 82/84, 90-318 ŁÓDŹ', vat_czynny = true, registry_url = 'https://rejestr.io/krs/5092' where slug = 'helios' and nip = '7251893714';
-- Jaguar [A]: 5213824147 FUNDACJA PRO MILITARIS -> 5272930046
update companies set name = 'INCHCAPE JLR POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5272930046', krs = '0000847401', regon = '386368821', adres = 'WOŁOSKA 24, 02-675 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/847401' where slug = 'jaguar' and nip = '5213824147';
-- Ferrari [A]: 7010465365 "FERRARI POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ W LIKWIDACJI -> 6342827881
update companies set name = 'SCUDERIA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '6342827881', krs = '0000510153', regon = '243560015', adres = 'FELIKSA BOCHEŃSKIEGO 109, 40-816 KATOWICE', vat_czynny = true, registry_url = 'https://rejestr.io/krs/510153' where slug = 'ferrari' and nip = '7010465365';
-- Gino Rossi [C]: 8390202281 "GINO ROSSI" SPÓŁKA AKCYJNA W LIKWIDACJI -> 6922200609
update companies set name = 'MODIVO SPÓŁKA AKCYJNA', nip = '6922200609', krs = '0000211692', regon = '390716905', adres = 'STREFOWA 6, 59-101 POLKOWICE', vat_czynny = true, registry_url = 'https://rejestr.io/krs/211692' where slug = 'gino-rossi' and nip = '8390202281';
-- Maxcom [A]: 7781481614  -> 6462537364
update companies set name = '"MAXCOM" SPÓŁKA AKCYJNA', nip = '6462537364', krs = '0000410197', regon = '277703221', adres = 'TOWAROWA 23A, 43-100 TYCHY', vat_czynny = true, registry_url = 'https://rejestr.io/krs/410197' where slug = 'maxcom' and nip = '7781481614';
-- Modecom [A]: 6922504223  -> 1231326759
update companies set name = 'MODECOM POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '1231326759', krs = '0000643267', regon = '365706668', adres = 'PUŁAWSKA 145, 02-715 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/643267' where slug = 'modecom' and nip = '6922504223';
-- myPhone [A]: 6792975152  -> 8951845043
update companies set name = '"MPTECH" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '8951845043', krs = '0000243245', regon = '020167256', adres = 'NOWOGRODZKA 31, 00-511 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/243245' where slug = 'mptech-myphone' and nip = '6792975152';
-- Philips [A]: 5211627116  -> 5272921998
update companies set name = 'VERSUNI POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5272921998', krs = '0000830304', regon = '385623719', adres = 'GRZYBOWSKA 78, 00-844 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/830304' where slug = 'philips' and nip = '5211627116';
-- Platinet [A]: 5832223443  -> 6792844218
update companies set name = 'PLATINET SPÓŁKA AKCYJNA', nip = '6792844218', krs = '0000233360', regon = '120039390', adres = 'TADEUSZA ŚLIWIAKA 48, 30-798 KRAKÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/233360' where slug = 'platinet' and nip = '5832223443';
-- Relpol [A]: 6922504223  -> 9280007076
update companies set name = '"RELPOL" SPÓŁKA AKCYJNA', nip = '9280007076', krs = '0000088688', regon = '970010355', adres = '11 LISTOPADA 37, 68-200 ŻARY', vat_czynny = true, registry_url = 'https://rejestr.io/krs/88688' where slug = 'relpol' and nip = '6922504223';
-- TikTok [A]: IE3673525NH  -> 5252785687
update companies set name = 'HYPERBOLA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5252785687', krs = '0000779664', regon = '382990297', adres = 'GRZYBOWSKA 60, 00-844 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/779664' where slug = 'tiktok' and nip = 'IE3673525NH';
-- Tonsil [A]: 8881014150  -> 7891755091
update companies set name = 'TONSIL POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '7891755091', krs = '0000567787', regon = '362045077', adres = 'CZERNIEJEWSKA 11, 62-300 WRZEŚNIA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/567787' where slug = 'tonsil' and nip = '8881014150';
-- Zortrax [A]: 8943089203  -> 5242756595
update companies set name = 'ZORTRAX SPÓŁKA AKCYJNA', nip = '5242756595', krs = '0000499608', regon = '146496404', adres = 'ZAJĘCZA 15, 00-351 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/499608' where slug = 'zortrax' and nip = '8943089203';
-- Kofola [A]: 5272525699 HOOP POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5482247628
update companies set name = '"USTRONIANKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5482247628', krs = '0000162128', regon = '072317086', adres = 'JELENICA 72, 43-450 USTROŃ', vat_czynny = true, registry_url = 'https://rejestr.io/krs/162128' where slug = 'kofola-hoop-cola' and nip = '5272525699';
-- Costa Coffee [A]: 5262403747 COSTA COFFEE POLSKA SPÓŁKA AKCYJNA -> 5262100142
update companies set name = 'LAGARDERE TRAVEL RETAIL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5262100142', krs = '0000048015', regon = '012782720', adres = 'ALEJE JEROZOLIMSKIE 174, 02-486 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/48015' where slug = 'costa-coffee' and nip = '5262403747';
-- Fibaro [A]: 7811858097 FIBAR GROUP SPÓŁKA AKCYJNA -> 9521240786
update companies set name = 'NICE - POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '9521240786', krs = '0000023328', regon = '012250472', adres = 'PARZNIEWSKA 2A, 05-800 PRUSZKÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/23328' where slug = 'fibaro' and nip = '7811858097';
-- Interia [A]: 5272644300 GRUPA INTERIA.PL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ SPÓŁKA KOMANDYTOWA -> 6772118727
update companies set name = 'INTERIA.PL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '6772118727', krs = '0001009169', regon = '357054315', adres = 'KOTLARSKA 11, 31-539 KRAKÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/1009169' where slug = 'interia' and nip = '5272644300';
-- Mieszko [A]: 6391875874 MIESZKO DISTRIBUTION SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 6390010391
update companies set name = 'MIESZKO SPÓŁKA AKCYJNA', nip = '6390010391', krs = '0000073310', regon = '273243857', adres = 'ALEJE JEROZOLIMSKIE 181, 02-222 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/73310' where slug = 'mieszko' and nip = '6391875874';
-- Sokołów [A]: 8231403819 "SOKOŁÓW-SERVICE" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 8230001444
update companies set name = '"SOKOŁÓW" SPÓŁKA AKCYJNA', nip = '8230001444', krs = '0000050909', regon = '710023709', adres = 'ALEJA 550-LECIA 1, 08-300 SOKOŁÓW PODLASKI', vat_czynny = true, registry_url = 'https://rejestr.io/krs/50909' where slug = 'sokolow' and nip = '8231403819';
-- Takeda [A]: 5262868535 TAKEDA POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5262108132
update companies set name = 'TAKEDA PHARMA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5262108132', krs = '0000027645', regon = '012765897', adres = 'PROSTA 28, 00-838 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/27645' where slug = 'takeda' and nip = '5262868535';
-- Whirlpool [A]: 8960000492 WHIRLPOOL POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5252073573
update companies set name = 'BEKO SPÓŁKA AKCYJNA', nip = '5252073573', krs = '0000078147', regon = '013222874', adres = '1 SIERPNIA 6A, 02-134 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/78147' where slug = 'whirlpool' and nip = '8960000492';
-- ALAB laboratoria [A]: 5272360548  -> 5220000217
update companies set name = 'ALAB LABORATORIA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5220000217', krs = '0000040890', regon = '008105218', adres = 'STĘPIŃSKA 22/30, 00-739 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/40890' where slug = 'alab-laboratoria' and nip = '5272360548';
-- Animex Foods [A]: 5272698951 ANIMEX FOODS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5262461288
update companies set name = 'ANIMEX FOODS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5262461288', krs = '0000018550', regon = '016398935', adres = 'TYTUSA CHAŁUBIŃSKIEGO 8, 00-613 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/18550' where slug = 'animex-foods' and nip = '5272698951';
-- Euvic [A]: 9691411637 EUVIC SPÓŁKA AKCYJNA -> 5272604418
update companies set name = 'EUVIC SPÓŁKA AKCYJNA', nip = '5272604418', krs = '0000332547', regon = '141905973', adres = 'PRZEWOZOWA 32, 44-100 GLIWICE', vat_czynny = true, registry_url = 'https://rejestr.io/krs/332547' where slug = 'euvic' and nip = '9691411637';
-- Inglot [A]: 7952194802 INGLOT SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 7952194802
update companies set name = 'INGLOT SPÓŁKA AKCYJNA', nip = '7952194802', krs = '0001246847', regon = '651419373', adres = 'LWOWSKA 154, 37-700 PRZEMYŚL', vat_czynny = true, registry_url = 'https://rejestr.io/krs/1246847' where slug = 'inglot' and nip = '7952194802';
-- Kanani Europe [A]: 5252638288 KANANI EUROPE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 9442043784
update companies set name = 'BIELENDA GROUP SPÓŁKA AKCYJNA', nip = '9442043784', krs = '0000982226', regon = '356357380', adres = 'FABRYCZNA 20, 31-553 KRAKÓW', vat_czynny = true, registry_url = 'https://rejestr.io/krs/982226' where slug = 'kanani-europe' and nip = '5252638288';
-- Müller [A]: 5222904791  -> 7010213190
update companies set name = 'MÜLLER DAIRY POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '7010213190', krs = '0000341929', regon = '142145607', adres = 'STRZESZYŃSKA 38/42, 60-479 POZNAŃ', vat_czynny = true, registry_url = 'https://rejestr.io/krs/341929' where slug = 'muller' and nip = '5222904791';
-- Muszynianka [A]: 7340007298  -> 7343575005
update companies set name = '"MUSZYNIANKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '7343575005', krs = '0000800687', regon = '000413274', adres = 'TADEUSZA KOŚCIUSZKI 58, 33-380 KRYNICA-ZDRÓJ', vat_czynny = true, registry_url = 'https://rejestr.io/krs/800687' where slug = 'muszynianka' and nip = '7340007298';
-- Objectivity [A]: 8942941304 OBJECTIVITY SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ -> 5260015900
update companies set name = '"ACCENTURE" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', nip = '5260015900', krs = '0000019271', regon = '010360920', adres = 'SIENNA 39, 00-121 WARSZAWA', vat_czynny = true, registry_url = 'https://rejestr.io/krs/19271' where slug = 'objectivity' and nip = '8942941304';
-- OSM Ryki [A]: 5060003186  -> 7160002164
update companies set name = 'SPÓŁDZIELNIA MLECZARSKA RYKI', nip = '7160002164', krs = '0000056619', regon = '000440905', adres = 'ŻYTNIA 3, 08-500 RYKI', vat_czynny = true, registry_url = 'https://rejestr.io/krs/56619' where slug = 'osm-ryki' and nip = '5060003186';
-- Shoper [C]: 9452156998 SHOPER SPÓŁKA AKCYJNA -> 7792467259
update companies set name = 'CYBER_FOLKS SPÓŁKA AKCYJNA', nip = '7792467259', krs = '0000685595', regon = '367731587', adres = 'WIERZBIĘCICE 1B, 61-569 POZNAŃ', vat_czynny = true, registry_url = 'https://rejestr.io/krs/685595' where slug = 'shoper' and nip = '9452156998';
-- Sphinx [A]: 9291666687  -> 7251752913
update companies set name = '"SFINKS POLSKA" SPÓŁKA AKCYJNA', nip = '7251752913', krs = '0000016481', regon = '472247798', adres = 'MŁODYCH WILCZĄT 36, 05-540 ZALESIE GÓRNE', vat_czynny = true, registry_url = 'https://rejestr.io/krs/16481' where slug = 'sphinx-sfinks' and nip = '9291666687';

-- ---------- D: do decyzji właściciela, domyślnie wyłączone ----------
-- Spotify: brak polskiej spółki (Spotify Poland wykreślona 2021).
-- update companies set nip = null, krs = null, registry_url = null, vat_czynny = null where slug = 'spotify' and nip = '1070021350';

commit;
