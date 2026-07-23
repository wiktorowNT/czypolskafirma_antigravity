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

## Kolejka (priorytet: marki rozpoznawalne)

- [x] `biedronka`  — zgłoszone 2026-07-23
- [x] `zabka`  — zgłoszone 2026-07-23
- [x] `lidl`  — zgłoszone 2026-07-23
- [x] `kaufland`  — zgłoszone 2026-07-23
- [ ] `netto`
- [ ] `aldi`
- [ ] `auchan`
- [ ] `carrefour`
- [ ] `stokrotka`
- [ ] `polomarket`
- [ ] `lewiatan`
- [x] `pepco`  — zgłoszone 2026-07-23
- [x] `rossmann`  — zgłoszone 2026-07-23
- [ ] `hebe`
- [ ] `super-pharm`
- [x] `orlen`  — zgłoszone 2026-07-23
- [ ] `bp`
- [ ] `shell`
- [ ] `circle-k`
- [ ] `moya`
- [ ] `amic-energy`
- [ ] `pko-bp`
- [ ] `mbank`
- [ ] `ing`
- [ ] `pekao`
- [ ] `alior-bank`
- [ ] `millennium`
- [ ] `bnp-paribas`
- [ ] `credit-agricole`
- [ ] `velobank`
- [ ] `nest-bank`
- [x] `allegro`  — zgłoszone 2026-07-23
- [ ] `empik`
- [ ] `media-expert`
- [ ] `rtv-euro-agd`
- [ ] `x-kom`
- [ ] `morele`
- [ ] `komputronik`
- [ ] `ccc`
- [ ] `deichmann`
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
- [ ] `zara`
