-- Propozycje ujednolicenia zapisu companies.owner_name (audyt 2026-11-04, tools/audyt-danych/audyt-danych.mjs).
-- NIE URUCHAMIAĆ bez decyzji właściciela. Dane z żywej strony, nie z bazy.
-- Każdy UPDATE ma strażnika `owner_name = <stary zapis>`: powtórne uruchomienie nic nie zmienia,
-- a rekord poprawiony w międzyczasie zostaje w spokoju. `slug` to surowy slug z bazy.
-- Po co: sekcja „Inne firmy, których właścicielem jest …” (app/firma/[slug]/page.tsx,
-- getCompanyFamily) dopasowuje po równości owner_name, więc każdy wariant zapisu to osobny właściciel.

begin;

-- ===== A. Kosmetyka zapisu (pewne): wielkość liter, kropki, przecinek przed Inc., cudzysłowy =====

-- A: „Agora S.A.” (3 prof.) ← „Agora SA” (1)
-- różnica: kropki/spacje
update companies set owner_name = 'Agora S.A.'
  where slug in ('radio-zet')
    and owner_name = 'Agora SA';

-- A: „Rodzina Kwiecień (grupa Wistil)” (2 prof.) ← „Rodzina Kwiecień (Grupa Wistil)” (2)
-- różnica: wielkość liter
update companies set owner_name = 'Rodzina Kwiecień (grupa Wistil)'
  where slug in ('cmielow', 'lubiana')
    and owner_name = 'Rodzina Kwiecień (Grupa Wistil)';

-- A: „Kontoor Brands, Inc.” (1 prof.) ← „Kontoor Brands Inc.” (1)
-- różnica: kropki/spacje
update companies set owner_name = 'Kontoor Brands, Inc.'
  where slug in ('wrangler')
    and owner_name = 'Kontoor Brands Inc.';

-- Pominięte celowo (właściciel „ogólny”, ujednolicenie POŁĄCZYŁOBY niepowiązane firmy w sekcji właściciela):
--   „Polscy wspólnicy (osoby fizyczne)” / „Polscy wspólnicy, osoby fizyczne”

-- ===== A2. Literówki (pewne): po poprawce zapis trafia w OGOLNI_WLASCICIELE i przestaje łączyć firmy =====

-- A2: „Akconariat rozproszony” (4 prof.) → „Akcjonariat rozproszony”
update companies set owner_name = 'Akcjonariat rozproszony'
  where slug in ('adidas', 'nike', 'ibm', 'michelin')
    and owner_name = 'Akconariat rozproszony';

-- ===== B. Dopisek w nawiasie (ten sam podmiot). DO DECYZJI: odkomentuj wybrane bloki. =====
-- Kanoniczny = najczęstszy wariant. Dopisek bywa informacją (np. pośredni holding), wtedy lepiej
-- przenieść go do ownership_description niż trzymać dwa zapisy właściciela.

-- -- B: „Rodzina Mulliez” (12 prof.) ← „Rodzina Mulliez (ADEO)” (1), „Rodzina Mulliez (Association Familiale Mulliez)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Mulliez'
--   where slug in ('leroy-merlin')
--     and owner_name = 'Rodzina Mulliez (ADEO)';
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Mulliez'
--   where slug in ('bricoman')
--     and owner_name = 'Rodzina Mulliez (Association Familiale Mulliez)';

-- -- B: „Zygmunt Solorz (Fundacja TiVi / Reddev)” (9 prof.) ← „Zygmunt Solorz” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Zygmunt Solorz (Fundacja TiVi / Reddev)'
--   where slug in ('plus-bank')
--     and owner_name = 'Zygmunt Solorz';

-- -- B: „Rodzina Lauder” (9 prof.) ← „Rodzina Lauder (The Estée Lauder Companies)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Lauder'
--   where slug in ('bumble-and-bumble')
--     and owner_name = 'Rodzina Lauder (The Estée Lauder Companies)';

-- -- B: „Danone S.A. (akcjonariat rozproszony)” (7 prof.) ← „Danone S.A.” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Danone S.A. (akcjonariat rozproszony)'
--   where slug in ('nutricia')
--     and owner_name = 'Danone S.A.';

-- -- B: „Luis Amaral” (5 prof.) ← „Luis Amaral (Grupa Eurocash)” (2)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Luis Amaral'
--   where slug in ('delikatesy-centrum', 'lewiatan')
--     and owner_name = 'Luis Amaral (Grupa Eurocash)';

-- -- B: „Alphabet Inc. (kontrola: Larry Page i Sergey Brin)” (6 prof.) ← „Alphabet Inc.” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Alphabet Inc. (kontrola: Larry Page i Sergey Brin)'
--   where slug in ('google-cloud')
--     and owner_name = 'Alphabet Inc.';

-- -- B: „Rodzina Persson” (5 prof.) ← „Rodzina Persson (Ramsbury Invest)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Persson'
--   where slug in ('h-m')
--     and owner_name = 'Rodzina Persson (Ramsbury Invest)';

-- -- B: „Rodzina Furmanów” (4 prof.) ← „Rodzina Furmanów (Aflofarm)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Furmanów'
--   where slug in ('trec-nutrition')
--     and owner_name = 'Rodzina Furmanów (Aflofarm)';

-- -- B: „Rodzina Aleotti (Menarini)” (4 prof.) ← „Rodzina Aleotti” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Aleotti (Menarini)'
--   where slug in ('berlin-chemie-menarini')
--     and owner_name = 'Rodzina Aleotti';

-- -- B: „Spółdzielnia (rolnicy)” (4 prof.) ← „Spółdzielnia (członkowie)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Spółdzielnia (rolnicy)'
--   where slug in ('skok-kasa-stefczyka')
--     and owner_name = 'Spółdzielnia (członkowie)';

-- -- B: „Sandro Veronesi” (2 prof.) ← „Sandro Veronesi (Oniverse)” (2)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Sandro Veronesi'
--   where slug in ('intimissimi', 'calzedonia')
--     and owner_name = 'Sandro Veronesi (Oniverse)';

-- -- B: „Rodzina Quandt (Stefan Quandt, Susanne Klatten)” (3 prof.) ← „Rodzina Quandt” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Quandt (Stefan Quandt, Susanne Klatten)'
--   where slug in ('bmw')
--     and owner_name = 'Rodzina Quandt';

-- -- B: „Rodzina af Jochnick” (2 prof.) ← „Rodzina af Jochnick (Celox Holding)” (1), „Rodzina af Jochnick (Celox Holding AB)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina af Jochnick'
--   where slug in ('centrum-medyczne-damiana')
--     and owner_name = 'Rodzina af Jochnick (Celox Holding)';
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina af Jochnick'
--   where slug in ('synevo')
--     and owner_name = 'Rodzina af Jochnick (Celox Holding AB)';

-- -- B: „Avallon MBO” (3 prof.) ← „Avallon MBO (fundusz PE)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Avallon MBO'
--   where slug in ('clovin')
--     and owner_name = 'Avallon MBO (fundusz PE)';

-- -- B: „Jan Kolański (Colian)” (3 prof.) ← „Jan Kolański” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Jan Kolański (Colian)'
--   where slug in ('colian')
--     and owner_name = 'Jan Kolański';

-- -- B: „MCI Capital” (2 prof.) ← „MCI Capital (Tomasz Czechowicz)” (2)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'MCI Capital'
--   where slug in ('thomas-cook', 'morele')
--     and owner_name = 'MCI Capital (Tomasz Czechowicz)';

-- -- B: „Lars Wingefors (Embracer Group)” (3 prof.) ← „Lars Wingefors” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Lars Wingefors (Embracer Group)'
--   where slug in ('rebel')
--     and owner_name = 'Lars Wingefors';

-- -- B: „Pfeifer & Langen (grupa rodzinna)” (2 prof.) ← „Pfeifer & Langen” (1), „Pfeifer & Langen (rodziny właścicielskie z Kolonii)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Pfeifer & Langen (grupa rodzinna)'
--   where slug in ('przysnacki')
--     and owner_name = 'Pfeifer & Langen';
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Pfeifer & Langen (grupa rodzinna)'
--   where slug in ('diamant')
--     and owner_name = 'Pfeifer & Langen (rodziny właścicielskie z Kolonii)';

-- -- B: „Rodzina Reimann (JAB)” (2 prof.) ← „Rodzina Reimann (JAB Holding)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Reimann (JAB)'
--   where slug in ('coty')
--     and owner_name = 'Rodzina Reimann (JAB Holding)';

-- -- B: „Fundacja Rodzinna Irena Eris (rodzina Eris-Orfinger)” (2 prof.) ← „Fundacja Rodzinna Irena Eris” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Fundacja Rodzinna Irena Eris (rodzina Eris-Orfinger)'
--   where slug in ('dr-irena-eris')
--     and owner_name = 'Fundacja Rodzinna Irena Eris';

-- -- B: „Toyota Motor Corporation” (2 prof.) ← „Toyota Motor Corporation (rozproszony akcjonariat)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Toyota Motor Corporation'
--   where slug in ('toyota')
--     and owner_name = 'Toyota Motor Corporation (rozproszony akcjonariat)';

-- -- B: „ZMB Capital (Ustronianka)” (1 prof.) ← „ZMB Capital (Michał Bożek)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'ZMB Capital (Ustronianka)'
--   where slug in ('arctic')
--     and owner_name = 'ZMB Capital (Michał Bożek)';

-- -- B: „Restaurant Brands International” (1 prof.) ← „Restaurant Brands International (akcjonariat rozproszony)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Restaurant Brands International'
--   where slug in ('popeyes')
--     and owner_name = 'Restaurant Brands International (akcjonariat rozproszony)';

-- -- B: „Rodzina Komorowskich (BZK Group)” (1 prof.) ← „Rodzina Komorowskich (Grupa BZK)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Komorowskich (BZK Group)'
--   where slug in ('polskie-mlyny')
--     and owner_name = 'Rodzina Komorowskich (Grupa BZK)';

-- -- B: „Lars Larsen Group” (1 prof.) ← „Lars Larsen Group (Actona Group)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Lars Larsen Group'
--   where slug in ('sits')
--     and owner_name = 'Lars Larsen Group (Actona Group)';

-- -- B: „Rodzina Szynaka” (1 prof.) ← „Rodzina Szynaka (Szynaka-Meble, właściciel Wolsztyńskiej Fabryki Mebli)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Szynaka'
--   where slug in ('wfm-kuchnie')
--     and owner_name = 'Rodzina Szynaka (Szynaka-Meble, właściciel Wolsztyńskiej Fabryki Mebli)';

-- -- B: „Allegro” (1 prof.) ← „Allegro (akcjonariat rozproszony)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Allegro'
--   where slug in ('ceneo')
--     and owner_name = 'Allegro (akcjonariat rozproszony)';

-- -- B: „Amazon.com, Inc.” (1 prof.) ← „Amazon.com, Inc. (akcjonariat rozproszony)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Amazon.com, Inc.'
--   where slug in ('amazon')
--     and owner_name = 'Amazon.com, Inc. (akcjonariat rozproszony)';

-- -- B: „Rodzina Herz (maxingvest AG)” (1 prof.) ← „Rodzina Herz (Maxingvest / Beiersdorf)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Herz (maxingvest AG)'
--   where slug in ('beiersdorf')
--     and owner_name = 'Rodzina Herz (Maxingvest / Beiersdorf)';

-- -- B: „Ringier Axel Springer” (1 prof.) ← „Ringier Axel Springer (Axel Springer SE i Ringier AG)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Ringier Axel Springer'
--   where slug in ('jakdojade')
--     and owner_name = 'Ringier Axel Springer (Axel Springer SE i Ringier AG)';

-- -- B: „Groupe LDC” (1 prof.) ← „Groupe LDC (Drosed Holding)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Groupe LDC'
--   where slug in ('indykpol')
--     and owner_name = 'Groupe LDC (Drosed Holding)';

-- -- B: „Ewa Szmidt-Belcarz” (1 prof.) ← „Ewa Szmidt-Belcarz (Grupa Empik)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Ewa Szmidt-Belcarz'
--   where slug in ('going')
--     and owner_name = 'Ewa Szmidt-Belcarz (Grupa Empik)';

-- -- B: „Rodzina Chung” (1 prof.) ← „Rodzina Chung (Hyundai Motor Group)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Rodzina Chung'
--   where slug in ('kia')
--     and owner_name = 'Rodzina Chung (Hyundai Motor Group)';

-- -- B: „Tata Motors” (1 prof.) ← „Tata Motors (rodzina Tata)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Tata Motors'
--   where slug in ('land-rover')
--     and owner_name = 'Tata Motors (rodzina Tata)';

-- -- B: „Krzysztof Tokarz” (1 prof.) ← „Krzysztof Tokarz (GK Specjał)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Krzysztof Tokarz'
--   where slug in ('spar')
--     and owner_name = 'Krzysztof Tokarz (GK Specjał)';

-- -- B: „Sebastian Kulczyk” (1 prof.) ← „Sebastian Kulczyk (Kulczyk Investments)” (1)
-- -- różnica: dopisek w nawiasie
-- update companies set owner_name = 'Sebastian Kulczyk'
--   where slug in ('qemetica')
--     and owner_name = 'Sebastian Kulczyk (Kulczyk Investments)';

commit;

-- ===== C. Poza zakresem owner_name: nazwa spółki (name) z "X" zamiast 'X'. DO DECYZJI. =====
-- getCompanyFamily pomija nazwy z cudzysłowem podwójnym, więc te profile nie pokazują innych marek
-- tej samej spółki, a pozostałe marki nie pokazują ich. Większość bazy ma już zapis z apostrofami.

-- update companies set name = '''DANONE'' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('danone') and name = 'DANONE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = '''DAX COSMETICS'' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('dax-cosmetics') and name = '"DAX COSMETICS" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = '''PRZEDSIĘBIORSTWO PRODUKCJI FARMACEUTYCZNEJ HASCO - LEK'' SPÓŁKA AKCYJNA' where slug in ('hasco-lek') and name = '"PRZEDSIĘBIORSTWO PRODUKCJI FARMACEUTYCZNEJ HASCO - LEK" SPÓŁKA AKCYJNA';
-- update companies set name = '''USTRONIANKA'' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('kofola-hoop-cola', 'ustronianka') and name = '"USTRONIANKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = 'DEICHMANN-OBUWIE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('deichmann') and name = '"DEICHMANN-OBUWIE SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ"';
-- update companies set name = '''ELECTROLUX POLAND'' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('electrolux') and name = '"ELECTROLUX POLAND" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = '''ETOS'' SPÓŁKA AKCYJNA' where slug in ('diverse') and name = '"ETOS" SPÓŁKA AKCYJNA';
-- update companies set name = 'EUROCASH SPÓŁKA AKCYJNA' where slug in ('eurocash') and name = '"EUROCASH" SPÓŁKA AKCYJNA';
-- update companies set name = 'HOCHLAND POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('hochland') and name = '"HOCHLAND POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = '''ASUS POLSKA'' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('asus') and name = '"ASUS POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = '''ITM POLSKA'' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('bricomarche') and name = '"ITM POLSKA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = 'DAWTONA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('drugie-sniadanie') and name = '"DAWTONA" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = 'DELIA COSMETICS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('delia-cosmetics') and name = '"DELIA COSMETICS" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = 'HYUNDAI MOTOR POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ' where slug in ('genesis') and name = '"HYUNDAI MOTOR POLAND" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ';
-- update companies set name = 'ZAKŁADY FARMACEUTYCZNE POLPHARMA SPÓŁKA AKCYJNA' where slug in ('polpharma') and name = 'ZAKŁADY FARMACEUTYCZNE "POLPHARMA" SPÓŁKA AKCYJNA';
