# Linki zewnętrzne — plan zdobywania autorytetu domeny

> Stan na 2026-09-12. To jedyny element strategii SEO, którego **nie da się zrobić
> z poziomu repozytorium** — wymaga Twoich działań na zewnątrz.

## Dlaczego to jest priorytet, a nie dodatek

Dane z Search Console (90 dni, stan 2026-09-12):

| Metryka | Wartość | Co znaczy |
|---|---|---|
| Żądania Googlebota | 2,76 tys. / 90 dni (~30 dziennie) | mikroskopijny budżet indeksowania |
| Przeznaczenie: odświeżanie | **97%** | bot krąży po stronach, które już zna |
| Przeznaczenie: **wykrywalność** | **3%** (~1 żądanie dziennie) | tyle mocy idzie na odkrywanie nowych stron |
| Zindeksowane | **70 / 778** | 9% serwisu |
| Średni czas odpowiedzi | 241 ms | **serwer nie jest problemem** |
| Stan hosta | bez zastrzeżeń | **hosting nie jest problemem** |

Budżet indeksowania jest pochodną autorytetu domeny. Serwis jest technicznie
poprawny (sitemapa, canonicale, meta robots, 750 linków wewnętrznych server-side,
szybkie odpowiedzi) — Google po prostu nie ma powodu, żeby go często odwiedzać,
bo prawie nikt do niego nie linkuje.

**Konsekwencja:** przy 1 żądaniu wykrywawczym dziennie pozostałe ~700 profili
wchodziłoby do indeksu ponad dwa lata. Ręczne zgłoszenia (11/dzień) to obejście,
nie rozwiązanie — kolejka wyczerpie się po ~9 dniach i zostanie 650 stron.

Linki zewnętrzne to jedyna dźwignia, która **podnosi sufit**. Wszystko inne
optymalizuje ruch pod istniejącym sufitem.

## Co działa na korzyść projektu

Serwis ma nietypowo dobrą pozycję wyjściową do zdobywania linków redakcyjnych:

- **Dane, nie opinie.** Struktura właścicielska firm to fakt weryfikowalny (KRS, NIP),
  a nie content marketingowy. Dziennikarze i blogerzy linkują do źródeł danych.
- **Metodologia jest jawna** (`/metodologia`) — to buduje wiarygodność cytowania.
- **Temat jest medialnie nośny** i wraca cyklicznie (przejęcia, „polskość" marek).
- **Blog już się broni** — CTR 5,7% na wpisie o Superfish/Koral vs 0,3% na profilach firm.

## Kierunki działania (w kolejności stosunku efektu do wysiłku)

### 1. Reaktywne komentowanie newsów o przejęciach

Najwyższy zwrot. Gdy pojawia się news o przejęciu polskiej marki przez zagraniczny
kapitał (albo odwrotnie), serwis ma gotową, sprawdzoną odpowiedź na pytanie
„a kto to właściwie jest właścicielem?".

- Masz już do tego skille: `lowca-newsow` i `komentator-x`.
- Cel: żeby przy okazji takiego newsa ktoś zalinkował profil firmy jako źródło.
- Praktyka: komentarz musi wnosić **konkretną liczbę albo fakt** z serwisu,
  nie być zaproszeniem do kliknięcia.

### 2. Dziennikarze i redakcje biznesowe

Redakcje szukają gotowych zestawień. Propozycja: przygotować cytowalne
zestawienie (np. „ile z 50 najpopularniejszych sieci handlowych w Polsce ma polski
kapitał") i wysłać do dziennikarzy piszących o handlu i FMCG.

- To jest zestawienie, które umiesz wygenerować z bazy — i którego nikt inny nie ma.
- Jeden link z dużego portalu biznesowego jest wart więcej niż 100 linków z katalogów.

### 3. Społeczności i fora tematyczne

Miejsca, gdzie pytanie „czy X to polska firma?" pada naturalnie i regularnie.
Linkowanie ma sens **tylko** jako odpowiedź na konkretne pytanie.

- Wykop, grupy na Facebooku o patriotyzmie gospodarczym, r/Polska.
- Uwaga: agresywna autopromocja przyniesie odwrotny skutek. Zasada: odpowiedz
  na pytanie w pełni w treści posta, link jako źródło, nie jako clickbait.

### 4. Współpraca z twórcami

Kanały o finansach osobistych i zakupach — serwis jest dla nich użytecznym
narzędziem, nie konkurencją.

### Czego NIE robić

- **Katalogi stron i farmy linków.** W 2026 to w najlepszym razie zero, w gorszym
  sygnał spamowy.
- **Kupowanie linków.** Ryzyko ręcznego filtra przy projekcie, którego cała wartość
  opiera się na wiarygodności.
- **Wymiany linków** z niepowiązanymi tematycznie stronami.

## Jak mierzyć postęp

Nie liczbą linków, tylko tym, czy rośnie sufit. W Search Console:

1. **Statystyki indeksowania → według przeznaczenia.** Udział „wykrywalność" powyżej
   3% = działa. To jest wskaźnik numer jeden.
2. **Łączna liczba żądań** — wzrost powyżej ~30/dzień.
3. **Zindeksowane strony** w `/sitemap-firmy.xml` — po podziale sitemapy widać
   tę sekcję osobno.

Realistyczny horyzont: efekty linków w budżecie indeksowania widać po 4–8 tygodniach,
nie po kilku dniach.

## Powiązane dokumenty

- `docs/seo-kolejka-indeksacji.md` — ręczne zgłaszanie (obejście na teraz)
- `docs/STRATEGIA_WZROSTU.md`
- `docs/AUTOMATYZACJA_TRESCI.md`
