# Kolejka zgłoszeń do indeksu Google (GSC)

> Priorytetowa lista firm do ręcznego zgłoszenia w Google Search Console
> (**Sprawdzenie adresu URL → Poproś o zindeksowanie**). Kolejność = rozpoznawalność
> marki (najczęściej wyszukiwane najpierw). Odhaczamy to, co już zgłoszone.

## Jak to działa (codzienny rytuał)

1. Otwórz Claude Code z **zalogowanym Google Search Console w Chrome**
   (właściwość `sc-domain:czypolskafirma.pl`).
2. Powiedz: **„zrób dzisiejszą partię"**.
3. Claude bierze kolejnych **~11 niezaznaczonych** firm z listy poniżej (dzienny limit
   Google to ~11–12 URL-i), zgłasza je w GSC i odhacza je w tym pliku.
4. Po wyczerpaniu limitu Google pokaże „Przekroczono limit" — wtedy kończymy do jutra.

**Uwaga:** to wymaga Twojej obecności i zalogowanej przeglądarki — agent w chmurze nie
ma do niej dostępu, więc nie da się tego w pełni zautomatyzować bez Ciebie.

## Kontekst

- Masową indeksację i tak robi **sitemapa** (naprawiona i przesłana 2026-07-23,
  Google widzi 778 stron). Ręczne zgłoszenia tylko przyspieszają **najważniejsze** marki.
- Po wyczerpaniu tej priorytetowej listy (~106 marek, ~10 dni po 11/dzień) **reszta
  z 750 firm zdaje się na sitemapę** — dalsze ręczne klikanie nie ma sensu.
- URL profilu: `https://czypolskafirma.pl/firma/<slug>`.

## Log dzienny

| Data | Zgłoszono | Uwagi |
|------|-----------|-------|
| 2026-07-23 | strona główna, /companies, zabka, lidl, orlen, rossmann, kaufland, pepco, inpost, allegro, reserved (11) | Biedronka już była w indeksie. Orlen miał stary „błąd przekierowania" — teraz zwraca 200 OK. Limit dzienny wyczerpany (mBank odbił się o limit). |
| 2026-09-12 | netto, aldi, auchan, carrefour, stokrotka, polomarket, lewiatan, hebe, super-pharm, bp, shell (11) | Wznowienie po 7 tygodniach przerwy. Limit wyczerpany na 12. URL-u (circle-k odbił się o limit — pierwszy na jutro). Przy okazji: ponownie przesłana sitemapa (ostatni odczyt Google był 23.07) i uruchomiona walidacja poprawki dla `/firma/zara`. |
| 2026-09-24 | circle-k, moya, amic-energy, pko-bp, mbank, ing, pekao, alior-bank, millennium, bnp-paribas, credit-agricole (11) | Limit wyczerpany na 12. URL-u (velobank odbił się o limit — pierwszy na jutro). Wszystkie 11 miały „Adres URL nie znajduje się w Google" i „Nie wykryto odsyłających map witryn" — to normalne przed pierwszym skanem; sitemapa OK (odczyt 23.09, 792 strony). Stan indeksu: 91 zindeksowanych, 695 „wykryta – niezindeksowana". `/firma/zara` zwraca już 200, walidacja wciąż „Rozpoczęto" (Google nie skanował od 2.07) — zgłosić jutro razem z velobankiem. Dodano `www` w Vercelu (308 → wersja bez www). |
| 2026-09-25 | velobank, zara, nest-bank, empik, media-expert, rtv-euro-agd, x-kom, morele, komputronik, ccc, deichmann (11) | Limit liczony ok. 24 h od zgłoszeń — próba o 14:20 odbiła się od razu, wieczorem przeszło. Limit wyczerpany na 12. URL-u (cropp odbił się o limit — pierwszy na jutro). `zara` ponownie zgłoszona: test wersji opublikowanej przeszedł, czekamy na zamknięcie walidacji „Błąd przekierowania". |

## Kolejka (priorytet: marki rozpoznawalne)

- [x] `biedronka`  — zgłoszone 2026-07-23
- [x] `zabka`  — zgłoszone 2026-07-23
- [x] `lidl`  — zgłoszone 2026-07-23
- [x] `kaufland`  — zgłoszone 2026-07-23
- [x] `netto`  — zgłoszone 2026-09-12
- [x] `aldi`  — zgłoszone 2026-09-12
- [x] `auchan`  — zgłoszone 2026-09-12
- [x] `carrefour`  — zgłoszone 2026-09-12
- [x] `stokrotka`  — zgłoszone 2026-09-12
- [x] `polomarket`  — zgłoszone 2026-09-12
- [x] `lewiatan`  — zgłoszone 2026-09-12
- [x] `pepco`  — zgłoszone 2026-07-23
- [x] `rossmann`  — zgłoszone 2026-07-23
- [x] `hebe`  — zgłoszone 2026-09-12
- [x] `super-pharm`  — zgłoszone 2026-09-12
- [x] `orlen`  — zgłoszone 2026-07-23
- [x] `bp`  — zgłoszone 2026-09-12
- [x] `shell`  — zgłoszone 2026-09-12
- [x] `circle-k`  — zgłoszone 2026-09-24
- [x] `moya`  — zgłoszone 2026-09-24
- [x] `amic-energy`  — zgłoszone 2026-09-24
- [x] `pko-bp`  — zgłoszone 2026-09-24
- [x] `mbank`  — zgłoszone 2026-09-24
- [x] `ing`  — zgłoszone 2026-09-24
- [x] `pekao`  — zgłoszone 2026-09-24
- [x] `alior-bank`  — zgłoszone 2026-09-24
- [x] `millennium`  — zgłoszone 2026-09-24
- [x] `bnp-paribas`  — zgłoszone 2026-09-24
- [x] `credit-agricole`  — zgłoszone 2026-09-24
- [x] `velobank`  — zgłoszone 2026-09-25
- [x] `nest-bank`  — zgłoszone 2026-09-25
- [x] `allegro`  — zgłoszone 2026-07-23
- [x] `empik`  — zgłoszone 2026-09-25
- [x] `media-expert`  — zgłoszone 2026-09-25
- [x] `rtv-euro-agd`  — zgłoszone 2026-09-25
- [x] `x-kom`  — zgłoszone 2026-09-25
- [x] `morele`  — zgłoszone 2026-09-25
- [x] `komputronik`  — zgłoszone 2026-09-25
- [x] `ccc`  — zgłoszone 2026-09-25
- [x] `deichmann`  — zgłoszone 2026-09-25
- [x] `reserved`  — zgłoszone 2026-07-23
- [ ] `cropp`
- [ ] `house`
- [ ] `mohito`
- [ ] `sinsay`
- [ ] `4f`
- [ ] `martes-sport`
- [ ] `decathlon`
- [ ] `tk-maxx`
- [ ] `jysk`
- [ ] `agata-meble`
- [ ] `black-red-white`
- [ ] `leroy-merlin`
- [ ] `castorama`
- [ ] `obi`
- [ ] `bricomarche`
- [ ] `selgros`
- [ ] `makro`
- [ ] `play`
- [ ] `plus`
- [ ] `orange`
- [ ] `t-mobile`
- [ ] `heyah`
- [ ] `virgin-mobile`
- [x] `inpost`  — zgłoszone 2026-07-23
- [ ] `dpd`
- [ ] `dhl`
- [ ] `poczta-polska`
- [ ] `apart`
- [ ] `w-kruk`
- [ ] `yes`
- [ ] `apple`
- [ ] `samsung`
- [ ] `xiaomi`
- [ ] `hortex`
- [ ] `wawel`
- [ ] `mieszko`
- [ ] `danone`
- [ ] `zott`
- [ ] `mlekovita`
- [ ] `mlekpol`
- [ ] `piatnica`
- [ ] `animex-foods`
- [ ] `sokolow`
- [ ] `tarczynski`
- [ ] `indykpol`
- [ ] `kompania-piwowarska`
- [ ] `coca-cola`
- [ ] `zywiec-zdroj`
- [ ] `muszynianka`
- [ ] `naleczowianka`
- [ ] `cd-projekt-red`
- [ ] `11-bit-studios`
- [ ] `techland`
- [ ] `people-can-fly`
- [ ] `adidas`
- [ ] `nike`
- [ ] `vistula`
- [ ] `wolczanka`
- [ ] `bytom`
- [ ] `local-heroes`
- [ ] `medicine`
- [ ] `diverse`
- [ ] `big-star`
- [ ] `wrangler`
- [x] `zara`  — zgłoszone 2026-09-25
