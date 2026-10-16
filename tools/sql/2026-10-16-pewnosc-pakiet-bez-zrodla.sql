-- 2026-10-16: poziom pewności (confidence) po zmianie reguły „pakiet kontrolny bez źródła”.
-- Brak źródła pakietu kontrolnego nie jest już konfliktem, tylko uwagą. 53 zaimportowane firmy
-- miały KONFLIKT wyłącznie z tego powodu; dostają status przeliczony w plikach partii.
-- Zmienia tylko kolumnę confidence (strona jej nie wyświetla). Warunek confidence = KONFLIKT
-- sprawia, że ponowne uruchomienie niczego nie psuje.

update companies set confidence = 'SREDNIA'
where confidence = 'KONFLIKT' and slug in (
  'olimp-sport-nutrition', 'avia', 'wibo', 'avec-pharma', 'benefit-systems', 'pol-skone', 'radaway', 'airbnb', 'regiojet', 'fermy-drobiu-wozniak', 'creepy-jar', 'artifex-mundi', 'the-farm-51', 'esperanza', 'hewalex', 'galmet', 'defro', 'spokey', 'espiro', 'wader', 'browar-witnica', 'nikon', 'biawar', 'fiskars', 'bat', 'hotele-golebiewski', 'insert', 'beskidzkie', 'septoral', 'leibniz', 'pick-up', 'pall-mall', 'lucky-strike', 'glo', 'vuse', 'velo', 'nibe', 'mini', 'rolls-royce', 'bmw-motorrad', 'frontline', 'firestone', 'kormoran', 'imperium-prunum', 'black-boss', 'boss-beer', 'notino', 'home-you', 'chorten', 'przysnacki', 'oskroba'
);

update companies set confidence = 'WYSOKA'
where confidence = 'KONFLIKT' and slug in (
  'mastercard', 'amazon'
);

-- Kontrola: powinno zwrócić 0.
select count(*) from companies where confidence = 'KONFLIKT' and slug in (
  'olimp-sport-nutrition', 'avia', 'wibo', 'avec-pharma', 'benefit-systems', 'pol-skone', 'radaway', 'mastercard', 'airbnb', 'regiojet', 'fermy-drobiu-wozniak', 'creepy-jar', 'artifex-mundi', 'the-farm-51', 'esperanza', 'hewalex', 'galmet', 'defro', 'spokey', 'espiro', 'wader', 'browar-witnica', 'nikon', 'biawar', 'fiskars', 'bat', 'hotele-golebiewski', 'insert', 'beskidzkie', 'septoral', 'leibniz', 'pick-up', 'pall-mall', 'lucky-strike', 'glo', 'vuse', 'velo', 'nibe', 'mini', 'rolls-royce', 'bmw-motorrad', 'frontline', 'firestone', 'kormoran', 'imperium-prunum', 'black-boss', 'boss-beer', 'amazon', 'notino', 'home-you', 'chorten', 'przysnacki', 'oskroba'
);
