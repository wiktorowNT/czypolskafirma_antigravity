# Metodologia klasyfikacji V2 — przypadki brzegowe i drzewo decyzyjne

> Rozszerzenie 4 zasad z `SOP_dodawanie_firm.md` o reguły dla przypadków, w których
> zasady bazowe są niejednoznaczne. Cel: każdy przypadek brzegowy ma jedną, mechaniczną
> regułę, którą tańszy model (lub człowiek) zastosuje bez interpretacji.

## Drzewo decyzyjne (stosować od góry, pierwsza pasująca reguła wygrywa)

1. **Czy istnieje podmiot z >50% głosów** (uwaga: głosów, nie kapitału)? → klasyfikuj wg kraju tego podmiotu (po zasadzie Ostatecznego Właściciela).
2. **Czy istnieje największy pojedynczy pakiet dający realną kontrolę** (typowo ≥25–30% przy rozproszonej reszcie, obsada zarządu/rady)? → klasyfikuj wg tego podmiotu. Fundusze pasywne (indeksowe, ETF — BlackRock, Vanguard, OFE jako portfel) **nie liczą się** jako kontrolujący, nawet gdy formalnie są największym akcjonariuszem.
3. **Akcjonariat w pełni rozproszony, nikt nie kontroluje** → klasyfikuj wg kraju siedziby centrali korporacyjnej (miejsca faktycznego zarządu), z dopiskiem w opisie „akcjonariat rozproszony".
4. **Nie da się ustalić** (brak danych w KRS/CRBR/raportach) → status `[DO WERYFIKACJI]`, firma nie wchodzi do bazy do czasu wyjaśnienia.

## Reguły dla przypadków brzegowych

**B1. Fundusze private equity / VC.** Krajem jest kraj **zarządzającego funduszem (GP)**, nie inwestorów (LP) ani wehikułu rejestrowego. CVC → Luksemburg jako wehikuł, ale GP brytyjsko-luksemburski → przypisujemy wg siedziby GP. Jeśli GP nieoczywisty — kraj, z którego fundusz jest faktycznie zarządzany.

**B2. Spółki Skarbu Państwa i samorządowe.** Kapitał **polski** (Orlen, PKO BP, KGHM — nawet gdy SP ma <50%, działa reguła nr 2: największy pakiet + faktyczna kontrola). W opisie zawsze zaznaczyć „kontrola Skarbu Państwa" — czytelnicy rozróżniają „polska prywatna" od „państwowa", warto rozważyć osobną odznakę w UI.

**B3. Franczyza.** Klasyfikujemy **właściciela marki i systemu**, nie franczyzobiorców. Żabka = zagraniczna (CVC), mimo że sklepy prowadzą polscy przedsiębiorcy — tę nieintuicyjność zawsze wyjaśniać w NIUANSIE opisu. Analogicznie McDonald's = US, mimo polskich operatorów restauracji.

**B4. Licencja / produkcja lokalna.** Marka należąca do zagranicznego koncernu, produkowana w Polsce na licencji (napoje, piwo, nabiał) = **zagraniczna**. Fakt „produkowane w Polsce, polscy pracownicy" → do opisu, nie do statusu.

**B5. Joint venture 50/50 PL–zagranica.** Nikt nie ma kontroli → z Klasyfikacji Binarnej wynika status **zagraniczna** (status „polska" wymaga polskiej kontroli). W opisie obowiązkowo pełna struktura — to przypadki najbardziej sporne.

**B6. Dual-class shares / uprzywilejowanie głosowe.** Liczy się % **głosów na WZA**, nie % kapitału. Założyciel z 30% kapitału i 55% głosów = kontrola założyciela.

**B7. Polski założyciel przez zagraniczny trust/fundację rodzinną.** Zasada Ostatecznego Właściciela: beneficjentem rzeczywistym jest polska rodzina → **polska**. Źródłem prawdy jest CRBR (Centralny Rejestr Beneficjentów Rzeczywistych) — zawsze sprawdzać przy strukturach wielopiętrowych.

**B8. Spółdzielnie** (Mlekovita, Mlekpol, SM, banki spółdzielcze). Właścicielami są członkowie-Polacy → **polska**. Opis: forma spółdzielcza jako NIUANS.

**B9. Akcjonariat pracowniczy / ESOP.** Traktować jak akcjonariat rozproszony (reguła 3), chyba że zorganizowany w jeden podmiot głosujący.

**B10. Podwójna struktura krajowa** (np. koncern z centralami w dwóch krajach, spółki bliźniacze). Wybrać kraj faktycznego centrum decyzyjnego; jeśli nierozstrzygalne — kraj notowania głównego + wyjaśnienie.

**B11. Kapitał z krajów wrażliwych** (RU/BY). Klasyfikować normalnie wg zasad, bez łagodzenia — ale traktować jako przypadki wysokiego ryzyka reputacyjnego: minimum 2 niezależne źródła, opis wyłącznie faktograficzny.

**B12. Trwająca transakcja** (ogłoszone, niezamknięte przejęcie). Klasyfikujemy wg **stanu prawnego dziś**; wzmianka o transakcji w opisie z datą. Po zamknięciu — re-weryfikacja (patrz niżej).

## Hierarchia źródeł (przy konflikcie wygrywa wyższe)

1. KRS / CRBR / raporty bieżące i roczne spółek (ESPI/EBI), prospekty
2. Oficjalne strony IR spółek, zawiadomienia o znacznych pakietach akcji
3. Renomowane media biznesowe (PB, Parkiet, Rzeczpospolita, Reuters, FT) z datą
4. Wikipedia i agregatory — tylko jako trop, nigdy jako źródło finalne
5. Wiedza modeli AI bez źródła — **nigdy** nie rozstrzyga; służy do generowania hipotez

Każdy wpis powinien być weryfikowalny: w opisie liczby z datami („stan na XI 2025"), a przy syntezie odrzucamy każdą liczbę, którą podał tylko jeden model bez źródła.

## Świeżość danych i re-weryfikacja

Struktury właścicielskie się zmieniają — baza bez dat gnije w ciszy. Rekomendacje:

1. Dodać do tabeli `companies` pole `verified_at` (data ostatniej weryfikacji) i pokazywać ją na profilu — to buduje wiarygodność i chroni prawnie („stan na dzień X").
2. Cykl re-weryfikacji: 12 miesięcy dla zwykłych firm, 6 dla spółek giełdowych i portfelowych PE.
3. Trigger natychmiastowy: news o przejęciu/IPO/sprzedaży pakietu → re-weryfikacja poza cyklem (spina się z formatem „newsjacking" ze `STRATEGIA_WZROSTU.md`).

## Ochrona prawna (higiena, nie porada prawna)

Serwis publicznie etykietuje firmy — spory są kwestią czasu. Minimalizacja ryzyka: opisy wyłącznie faktograficzne z liczbami i źródłami (fakt prawdziwy i rzetelnie podany to najlepsza obrona), widoczna metodologia (już jest — `/metodologia`), data weryfikacji przy każdym wpisie, sprawna ścieżka sprostowań (formularz „zgłoś poprawkę" już istnieje — warto dodać publiczną deklarację SLA, np. „korekty rozpatrujemy w 7 dni") oraz changelog korekt (przyznawanie się do błędów buduje zaufanie — zbieżne z pozycjonowaniem à la Demagog). Do rozważenia konsultacja prawnicza szablonu opisu.
