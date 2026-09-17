# Walidacja automatu dodawania firm (2026-09-17)

> Etap 2 zadania z `docs/prompty-fable/1-audyt-procesow-i-automat-firm.md`. Kod: `tools/firmy/`.
> Procedura: `docs/SOP_dodawanie_firm.md`. Plik partii z pełnymi wynikami (łańcuchy, źródła,
> kontrola, opisy): `data/robocze/automat/partia-walidacja.json`. Przegląd:
> `node tools/firmy/przeglad.mjs --partia walidacja`.

## Jak przeprowadzono test

Claude Code na tym komputerze nie było zalogowane (`claude auth status` → `loggedIn: false`),
więc automat pracował w trybie ręcznym (`--reczny`): każdy krok modelu zapisał prompt do pliku,
a prompty wykonały subagenty na **Sonnecie** (ten sam model, który ma pracować w produkcji),
z WebSearch i WebFetch. Kod (tożsamość, MF, KRS, walidacja, pewność, składanie rekordu,
przegląd, import w trybie próbnym) działał normalnie. Odpowiedzi modeli leżą
w `data/robocze/automat/reczne/walidacja/` (katalog poza gitem).

Zestaw: 5 firm z bazy z podanym NIP (Żabka, Orlen, Dino, Biedronka, Mokate) w trybie
`--reweryfikacja` oraz 3 nowe po samej nazwie (Medcom, KIDS&Co, Vila).

## Wynik

| Firma | Automat | Baza dziś | Pewność | Co zatrzymało |
|---|---|---|---|---|
| Żabka | **JE** / CVC Capital Partners, D2+B1+B12 | GB / CVC Capital Partners | KONFLIKT | trwające wezwanie Couche-Tard (B12); kraj JE spoza słownika; różnica z bazą (GB); kraj GP tylko z Wikipedii |
| Orlen | PL / Skarb Państwa, D2+B2 | PL / Skarb Państwa | ŚREDNIA | kontrola: statutowy limit głosów (10–20%) nie jest potwierdzony w cytowanym źródle |
| Dino | PL / Tomasz Biernacki, D1 | PL / Tomasz Biernacki | KONFLIKT | źródło (bankier) podaje 50,99%, łańcuch 51,16%; BT Kapitał nie występuje w źródle |
| Biedronka | PT / rodzina Soares dos Santos, D1 | PT / rodzina Soares dos Santos | ŚREDNIA | brak daty „stan na" dla 56,14%; źródło Warta→JM starsze niż 24 mies. |
| Mokate | PL / rodzina Mokrysz, D1 | PL / rodzina Mokrysz | ŚREDNIA | podział 50/50 tylko z agregatorów KRS; **NIP w bazie wskazuje Mokate E-COM sp. z o.o., nie Mokate S.A.** |
| Medcom (nowa) | PL / Marek Niewiadomski, D1+B12 | — | KONFLIKT | umowa z Mitsubishi Electric (5.08.2026) niezamknięta; pakiet 50,8% tylko z rejestr.io; API KRS maskuje nazwiska wspólników |
| KIDS&Co (nowa) | PL / Equitin Partners (GP w Warszawie), D1+B1+B12 | — | KONFLIKT | przejęcie przez AcadeMedia (7.08.2026) niezamknięte; siedziba GP słabo udokumentowana; **brak kategorii „edukacja"** |
| Vila (nowa) | DK / rodzina Holch Povlsen, D1 | — | KONFLIKT | trzy ogniwa pośrednie bez %; 95/5 w Heartland tylko z duńskiej Wikipedii |

Klasyfikacja kraju i właściciela zgodna z bazą w 4 z 5 firm z bazy; jedyna różnica (Żabka
GB→JE) to spór o interpretację reguły B1, nie błąd faktograficzny. Wszystkie trzy nowe firmy
dostały poprawną tożsamość (NIP potwierdzony w MF i KRS, właściwa spółka operacyjna, w tym
zmiana nazwy Bestseller Retail → Only Stores Poland z maja 2025).

## Rozbieżności z obecnymi rekordami

1. **Mokate: NIP w bazie jest zły.** `6511749127` / KRS `0001142134` to MOKATE E-COM sp. z o.o.
   (rejestracja grudzień 2024, spółka e-commerce). Operatorem marki jest MOKATE S.A., KRS
   `0000010037`, NIP `5482135881` (sprawdzone w KRS API). Automat oznaczył to dwoma uwagami
   (nazwa spółki wygląda na celową; uwaga modelu). Naprawa: uruchomić Mokate po samej nazwie,
   bez NIP-u, zatwierdzić, import zrobi UPDATE. Warto przeszukać bazę pod kątem podobnych
   przypadków (nazwy z E-COM, ONLINE, LOGISTYKA, NIERUCHOMOŚCI w KRS).
2. **Żabka: GB czy JE.** Baza ma GB (CVC jako GP z Londynu). Model przypisał JE po siedzibie
   CVC Capital Partners plc (Jersey), a kontrola słusznie zauważyła, że to tylko Wikipedia.
   Słownik krajów celowo nie ma JE, więc rekord nie przejdzie importu bez Twojej decyzji.
   Niezależnie od tego: wezwanie Couche-Tard ma się rozliczyć na przełomie września
   i października 2026, po czym Żabka powinna dostać CA. To dobry pierwszy kandydat do
   re-weryfikacji w październiku.
3. **Dino: 50,99% vs 51,16%.** Oba z 2025–2026; rekord w bazie nie podaje liczby. Do
   poprawienia jednym kliknięciem w przeglądzie (opis) albo do przyjęcia jako „ok. 51%".
4. **Orlen, Biedronka:** zgodne. Nowe opisy mają daty stanu i procenty; obecne nie.

## Co działa, co poprawiłem w trakcie, co zostaje do dostrojenia

**Działa.** Tożsamość z weryfikacją MF+KRS (3/3 nowe trafione), pobieranie KRS z historią
wspólników (np. Żabka Polska: Vistra → Heket Investments → Heket Holdings → Zabka Group,
z datami), samokontrola z pobieraniem cytowanych źródeł (wykryła rozjazd 50,99/51,16 i Wikipedię
jako jedyne źródło), strona przeglądu (konflikty na górze, edycja pól, konsylium innych modeli,
hurtowe zatwierdzanie), import w trybie próbnym (poprawnie rozpoznał Orlen jako UPDATE).

**Poprawione w trakcie walidacji.**
- Ogniwa łańcucha potwierdzone w KRS (wspólnik 100%, sama spółka) dostają automatycznie KRS
  jako źródło poziomu 1 (wcześniej Mokate wpadał w KONFLIKT „pakiet kontrolny bez źródła").
- Samokontrola może tylko obniżyć pewność: jej ŚREDNIA blokuje WYSOKA, jej KONFLIKT dodaje
  konflikt (wcześniej Orlen wychodził jako WYSOKA mimo zastrzeżeń kontroli).
- Bankier i inne agregatory giełdowe zdegradowane do poziomu 3 (były 1).
- Wspólnicy będący osobami fizycznymi (API KRS maskuje nazwiska) są reprezentowani jako
  „osoba fizyczna", zamiast znikać z listy.
- Uwagi modelu z kroków 1 i 3 oraz ostrzeżenie o nazwie spółki celowej trafiają do karty firmy.
- Flaga `--przelicz` do ponownego policzenia pewności po zmianie reguł, bez wołania modelu.

**Do dostrojenia po pierwszej prawdziwej partii.**
- W tej próbce **żadna firma nie dostała WYSOKA**, więc przycisk „Zatwierdź wszystkie WYSOKA"
  nie miał czego zatwierdzać. Sonnet w roli audytora zawsze znajduje zastrzeżenie (brak daty,
  agregator zamiast raportu). Trzy opcje: (a) zostawić, bo to dokładnie ten rygor, o który chodzi,
  a ŚREDNIA i tak zatwierdza się jednym kliknięciem; (b) w trybie re-weryfikacji dopuścić hurtowe
  zatwierdzanie ŚREDNIA, gdy kraj i właściciel są zgodne z bazą; (c) złagodzić prompt kontroli
  (ŚREDNIA tylko przy braku źródła dla pakietu kontrolnego). Proponuję (b) po 2–3 partiach.
- Reguła B12 (trwająca transakcja) daje KONFLIKT zawsze, także gdy stan prawny na dziś jest
  jasny. Dla newsów o przejęciach (Medcom, KIDS&Co) to celowe: Ty decydujesz, czy dodać firmę
  teraz, czy po zamknięciu.
- Brak kategorii „edukacja" (KIDS&Co) i ogólnie: kategoria bywa pusta, gdy nic nie pasuje.
  Import blokuje rekord bez kategorii, więc nic nie przecieka.
- Kod kraju spoza słownika (JE, także np. KY, VG, JE, GG) zawsze blokuje. To zgodne z zasadą
  ignorowania rajów, ale model powinien dostać jawną listę dozwolonych kodów w prompcie śledztwa.
  Dodam przy następnej zmianie promptu.
- CRBR pominięty w MVP (endpoint tylko z przeglądarki, zwraca PESEL-e). Dla B7 (polski
  założyciel przez zagraniczny wehikuł) KIDS&Co pokazał, że da się to zrobić bez CRBR
  (cypryjski EQUITIN → GP w Warszawie), ale ze słabszymi źródłami.

## Koszt i czas (zmierzone na Sonnecie)

| Krok | Czas | Tokeny wejścia na wywołanie (kontekst subagenta) |
|---|---|---|
| 1. tożsamość | 1,5–4 min | 70–85 tys. |
| 3. śledztwo | 2–6,5 min | 80–110 tys. |
| 4. kontrola | 1,5–3 min | 75–82 tys. |
| 5. opisy | 1–3,5 min | 71–81 tys. |

Razem ok. 300–350 tys. tokenów wejścia i ok. 10 tys. wyjścia na firmę, czyli więcej niż
szacunek z audytu (150 tys.), bo pobrane strony są duże. Na subskrypcji: 0 zł. Przez API
(Sonnet 5): ok. 0,8–1,0 $ na firmę, partia 40 firm ok. 35–40 $. Cała partia 8 firm zajęła
ok. 15 minut zegarowych przy 4–8 równoległych wywołaniach; na jednym komputerze
z `--rownolegle 3` partia 40 firm to szacunkowo 1,5–2 h bez Twojego udziału.

## Następne kroki (Ty)

1. `claude auth login` w terminalu (jednorazowo), potem `claude auth status` → `loggedIn: true`.
2. Supabase → rotacja klucza `service_role` (pkt 0.1 audytu), nowy klucz do `.env.local`.
3. Supabase SQL Editor → `tools/sql/2026-09-17-sources-confidence.sql`.
4. Pierwsza prawdziwa partia, np. kandydaci z ostatnich PR-ów automatu treści:
   `node tools/firmy/automat.mjs --firmy "Mokate, Inea, Fiberhost, Inglot, Wedel" --partia proba --reweryfikacja`
   (dla Mokate bez NIP-u, żeby automat sam ustalił właściwą spółkę), przegląd, konsylium
   w Gemini/GPT, import próbny, import.
