import { kodyKrajow } from "./tekst.mjs";

// Prompty i schematy JSON dla kroków automatu. Metodologia jest tu wpisana raz,
// w wersji V2 (docs/METODOLOGIA_V2_przypadki_brzegowe.md), i wstrzykiwana do kroków 3 i 4.

export const METODOLOGIA = `
METODOLOGIA KLASYFIKACJI (stosuj bezwzględnie; pierwsza pasująca reguła drzewa wygrywa)

Zasady bazowe:
1. Ostateczny Właściciel: ignoruj wehikuły inwestycyjne i raje podatkowe (Cypr, Luksemburg, Malta, Holandia jako holding). Patrz na szczyt piramidy. Polski założyciel przez spółkę na Cyprze = kapitał polski.
2. Efektywna Kontrola: decyduje >50% GŁOSÓW (nie kapitału) albo największy pojedynczy pakiet realnie pozwalający powoływać zarząd. Fundusze pasywne (indeksowe, ETF, BlackRock/Vanguard jako portfel, OFE jako portfel) NIE liczą się jako kontrolujący.
3. Złota Klatka: historycznie polska marka przejęta przez obcy kapitał = zagraniczna.
4. Klasyfikacja binarna: status "polska" (PL) tylko przy polskiej efektywnej kontroli.

Drzewo decyzyjne:
D1. Jest podmiot z >50% głosów → kraj tego podmiotu (po zasadzie 1).
D2. Jest największy pojedynczy pakiet dający realną kontrolę (typowo ≥25-30% przy rozproszonej reszcie, obsada zarządu/rady) → kraj tego podmiotu.
D3. Akcjonariat w pełni rozproszony, nikt nie kontroluje → kraj siedziby centrali korporacyjnej (faktycznego zarządu) + dopisek "akcjonariat rozproszony".
D4. Nie da się ustalić → country_code pusty, opisz czego brakuje.

Reguły brzegowe (podaj kod reguły w polu "regula", gdy użyta):
B1. Fundusz PE/VC → kraj zarządzającego funduszem (GP), nie inwestorów ani wehikułu.
B2. Skarb Państwa / samorząd → PL, w opisie "kontrola Skarbu Państwa" (także gdy SP ma <50%, ale faktyczną kontrolę).
B3. Franczyza → klasyfikuj właściciela marki i systemu, nie franczyzobiorców; wyjaśnij w opisie.
B4. Marka zagraniczna produkowana w Polsce na licencji → kraj właściciela marki.
B5. Joint venture 50/50 bez kontroli → zagraniczna; pełna struktura w opisie.
B6. Dual-class / uprzywilejowanie głosowe → liczy się % głosów.
B7. Polski założyciel przez zagraniczny trust/fundację → PL (beneficjent rzeczywisty).
B8. Spółdzielnia → PL.
B9. Akcjonariat pracowniczy/ESOP → jak rozproszony, chyba że jeden podmiot głosujący.
B10. Dwie centrale/spółki bliźniacze → kraj faktycznego centrum decyzyjnego; nierozstrzygalne → kraj głównego notowania + wyjaśnienie.
B11. Kapitał RU/BY → klasyfikuj normalnie, minimum 2 niezależne źródła, opis wyłącznie faktograficzny.
B12. Trwająca, niezamknięta transakcja → stan prawny na dziś + wzmianka z datą.

Hierarchia źródeł (przy konflikcie wygrywa wyższe):
1. KRS / CRBR / raporty bieżące i roczne spółek (ESPI/EBI), prospekty
2. Oficjalne strony relacji inwestorskich, zawiadomienia o znacznych pakietach
3. Renomowane media biznesowe (PB, Parkiet, Rzeczpospolita, Reuters, FT, Bloomberg) z datą
4. Wikipedia i agregatory: tylko trop, nigdy źródło finalne
5. Twoja własna wiedza bez źródła: nigdy nie rozstrzyga, służy tylko do hipotez
Każda liczba (procent, kwota, rok) musi mieć źródło i datę stanu. Liczba bez źródła nie wchodzi do wyniku.`;

// ---------- krok 0: seed listy dla kategorii ----------
export const SCHEMAT_SEED = {
  type: "object",
  properties: { firmy: { type: "array", items: { type: "object", properties: { nazwa: { type: "string" }, uzasadnienie: { type: "string" } }, required: ["nazwa"] } } },
  required: ["firmy"],
};

export function promptSeed({ kategoria, opisKategorii, ile, juzWBazie }) {
  return `Podaj listę ${ile} najbardziej rozpoznawalnych przez polskiego konsumenta marek/firm działających w Polsce w kategorii: "${kategoria}".
${opisKategorii ? `Opis kategorii: ${opisKategorii}\n` : ""}
Kryteria: marki, które zwykły człowiek zna z półki, ulicy, reklamy albo rachunku. Mieszanka firm polskich i zagranicznych obecnych na polskim rynku. Jedna pozycja = jedna marka konsumencka (nie grupa kapitałowa), np. "Biedronka", nie "Jerónimo Martins".
Pomiń marki, które już są w bazie: ${juzWBazie.slice(0, 400).join(", ") || "(brak)"}.
Zwróć JSON: {"firmy":[{"nazwa":"...","uzasadnienie":"jedno zdanie, skąd konsument ją zna"}]}`;
}

// ---------- krok 1: tożsamość ----------
export const SCHEMAT_TOZSAMOSC = {
  type: "object",
  properties: {
    nazwa_marki: { type: "string" },
    nazwa_spolki: { type: "string", description: "pełna nazwa głównej spółki operacyjnej w Polsce, jak w KRS" },
    nip: { type: "string" },
    krs: { type: "string" },
    website_url: { type: "string" },
    forma: { type: "string" },
    notowana_gpw: { type: "boolean" },
    ticker_bankier: { type: "string", description: "ticker spółki na bankier.pl, jeśli notowana na GPW (np. DINOPL, PEPCO)" },
    kandydaci_alternatywni: { type: "array", items: { type: "object", properties: { nazwa_spolki: { type: "string" }, nip: { type: "string" }, dlaczego: { type: "string" } } } },
    zrodla: { type: "array", items: { type: "string" } },
    pewnosc: { type: "string", enum: ["wysoka", "srednia", "niska"] },
    uwagi: { type: "string" },
  },
  required: ["nazwa_marki", "nazwa_spolki", "nip", "pewnosc"],
};

// Krok 1 jest tylko wyszukaniem numeru: NIP i tak weryfikuje kod w Białej Liście MF i w KRS.
// Dlatego twardy limit wyszukiwań i zakaz pobierania stron - to one robiły z kroku 1 najdroższą
// część partii (pobrana strona wchodzi w całości do kontekstu i jest czytana w każdej turze).
// Wersja `dokladnie` (drugie podejście, mocniejszy model) wolno pobierać strony.
export function promptTozsamosc({ nazwa, dokladnie = false }) {
  const definicja = `Szukasz operatora marki na polskim rynku (sieć sklepów, producent, usługodawca), nie spółki celowej, nie e-commerce, nie spółki nieruchomościowej, nie córki od logistyki. Jeśli marka należy do zagranicznej grupy, podaj jej polską spółkę operacyjną (np. dla Biedronki: Jeronimo Martins Polska S.A.). Jeśli marka jest jedną z marek polskiej grupy, podaj spółkę-matkę (np. dla Tymbarku: Maspex).
Nie ustalaj struktury właścicielskiej, historii spółki ani przychodów - to osobny krok. Jeśli spółka jest notowana na GPW, podaj notowana_gpw=true i ticker w formacie bankier.pl (np. DINOPL).
Zwróć wyłącznie JSON wg schematu.`;

  if (dokladnie) {
    return `Ustal spółkę zarejestrowaną w Polsce, która prowadzi działalność pod marką "${nazwa}", i podaj jej NIP. Poprzednie, pobieżne podejście dało numer, którego nie potwierdziły rejestry, więc tym razem sprawdź rzecz dokładnie.

Użyj wyszukiwania, a gdy trzeba, pobierz źródło, w którym NIP lub KRS jest podany wprost: wyszukiwarka KRS, rejestr.io, aleo.com, stopka strony firmy, KRS w regulaminie sklepu. Masz najwyżej 4 wyszukiwania i 3 pobrania stron. NIP musi mieć 10 cyfr i poprawną sumę kontrolną. Nie podawaj NIP-u z pamięci: jeśli nie znajdziesz go w źródle, wpisz pewnosc "niska" i opisz w "uwagi".
Jeśli jest kilka spółek pod podobną nazwą (np. "X S.A." i "X E-COM sp. z o.o."), wybierz operacyjną, a pozostałe (najwyżej dwie, jedno zdanie uzasadnienia) wypisz w kandydaci_alternatywni.

${definicja}`;
  }

  return `Ustal spółkę zarejestrowaną w Polsce, która prowadzi działalność pod marką "${nazwa}", i podaj jej NIP.

TWARDY LIMIT: wykonaj najwyżej DWA wyszukiwania i nie pobieraj stron. Pierwsze wyszukanie: "${nazwa} NIP KRS". Numery bardzo często są już w samych wynikach wyszukiwania. Gdy masz NIP (10 cyfr, poprawna suma kontrolna) albo numer KRS (10 cyfr), natychmiast kończ i zwróć JSON. Numer i tak zostanie niezależnie sprawdzony w Białej Liście MF i w KRS.
Jeśli po dwóch wyszukiwaniach nie masz numeru, zwróć pewnosc "niska" i napisz w uwagach, czego zabrakło. Pole "uwagi" to najwyżej jedno zdanie, "zrodla" najwyżej dwa adresy.

${definicja}`;
}

// ---------- krok 3: śledztwo właścicielskie ----------
export const SCHEMAT_SLEDZTWO = {
  type: "object",
  properties: {
    lancuch: {
      type: "array",
      description: "od spółki polskiej w górę do ostatecznego właściciela; każde ogniwo = kto posiada poprzednie",
      items: {
        type: "object",
        properties: {
          podmiot: { type: "string" },
          kraj: { type: "string", description: "ISO2 kraju siedziby/rejestracji tego podmiotu" },
          rola: { type: "string", enum: ["spolka_polska", "posrednik", "kontrolujacy", "ostateczny", "mniejszosciowy", "free_float"] },
          proc_glosow: { type: ["number", "null"] },
          proc_kapitalu: { type: ["number", "null"] },
          zrodlo_url: { type: ["string", "null"] },
          zrodlo_tytul: { type: ["string", "null"] },
          stan_na: { type: ["string", "null"], description: "data stanu wg źródła, RRRR-MM lub RRRR-MM-DD" },
          uwaga: { type: ["string", "null"] },
        },
        required: ["podmiot", "kraj", "rola"],
      },
    },
    ostateczny_wlasciciel: { type: "string", description: "krótka nazwa do pola owner_name, np. 'Rodzina Mokrysz', 'Skarb Państwa', 'CVC Capital Partners'" },
    typ_wlasciciela: { type: "string", enum: ["osoba/rodzina", "skarb_panstwa", "korporacja_gieldowa", "korporacja_prywatna", "fundusz_pe_vc", "spoldzielnia", "fundacja", "rozproszony", "inny"] },
    country_code: { type: "string", description: "ISO2 kraju kapitału wg metodologii; pusty gdy nie da się ustalić" },
    regula: { type: "string", description: "np. 'D1', 'D2', 'D3', 'D1+B1', 'D2+B2'" },
    uzasadnienie: { type: "string", description: "2-4 zdania: dlaczego ten podmiot kontroluje i dlaczego ten kraj" },
    historia: { type: "array", items: { type: "object", properties: { rok: { type: "string" }, zdarzenie: { type: "string" }, zrodlo_url: { type: ["string", "null"] } }, required: ["rok", "zdarzenie"] } },
    transakcja_w_toku: { type: ["string", "null"], description: "ogłoszona, niezamknięta zmiana właściciela z datą, albo null" },
    luki: { type: "array", items: { type: "string" }, description: "czego nie udało się potwierdzić w źródle" },
    zrodla: { type: "array", items: { type: "object", properties: { url: { type: "string" }, tytul: { type: "string" }, data: { type: ["string", "null"] }, czego_dotyczy: { type: "string" } }, required: ["url", "czego_dotyczy"] } },
    uwagi: { type: ["string", "null"] },
  },
  required: ["lancuch", "ostateczny_wlasciciel", "typ_wlasciciela", "country_code", "regula", "uzasadnienie", "luki", "zrodla"],
};

export function promptSledztwo({ nazwa, tozsamosc, rejestr, historiaKrs, gielda, crbr, dzisiaj }) {
  const fakty = [];
  if (rejestr && !rejestr.blad) {
    fakty.push(`KRS ${rejestr.krs} (stan z dnia ${rejestr.stanZDnia}): ${rejestr.nazwa}, ${rejestr.formaPrawna}, NIP ${rejestr.nip}, kapitał ${rejestr.kapitalZakladowy || "?"}.`);
    if (rejestr.wspolnicy?.length) fakty.push(`Wspólnicy wg KRS: ${rejestr.wspolnicy.map((w) => `${w.nazwa} (${w.udzialy}${w.calosc ? ", całość udziałów" : ""})`).join("; ")}.`);
    if (rejestr.jedynyAkcjonariusz?.length) fakty.push(`Jedyny akcjonariusz wg KRS: ${rejestr.jedynyAkcjonariusz.map((w) => w.nazwa).join("; ")}.`);
    if (!rejestr.wspolnicy?.length && !rejestr.jedynyAkcjonariusz?.length) fakty.push(`KRS nie wykazuje wspólników/jedynego akcjonariusza (typowe dla S.A. z wieloma akcjonariuszami).`);
    if (rejestr.emisjeAkcji?.some((e) => e.uprzywilejowanie)) fakty.push(`Akcje uprzywilejowane wg KRS: ${rejestr.emisjeAkcji.filter((e) => e.uprzywilejowanie).map((e) => `seria ${e.seria}: ${e.uprzywilejowanie}`).join("; ")}.`);
  } else if (rejestr?.blad) {
    fakty.push(`KRS: nie pobrano (${rejestr.blad}).`);
  }
  if (historiaKrs?.historia?.length) {
    fakty.push(`Historia wspólników/jedynego akcjonariusza wg KRS (odpis pełny): ${historiaKrs.historia.map((h) => `${h.nazwa} [od ${h.od || "?"}${h.do ? ` do ${h.do}` : ", nadal"}]`).join(" → ")}.`);
  }
  if (crbr && !crbr.blad && !crbr.brak) {
    fakty.push(`${crbr.podsumowanie} (stan CRBR na ${crbr.stanNa || "?"}; dane osobowe pominięte).`);
  }
  if (gielda?.akcjonariusze?.length) {
    fakty.push(`Akcjonariat wg bankier.pl (${gielda.url}, pobrano ${gielda.pobrano}): ${gielda.akcjonariusze.map((a) => `${a.nazwa} ${a.procGlosow ?? a.procKapitalu}% głosów${a.dataZmiany ? ` (zmiana ${a.dataZmiany})` : ""}`).join("; ")}. To jest trop; potwierdź w raporcie spółki lub na stronie IR.`);
  }
  return `Jesteś analitykiem struktur właścicielskich. Data dzisiejsza: ${dzisiaj}.
Zbadaj, kto ostatecznie kontroluje markę "${nazwa}" (spółka: ${tozsamosc?.nazwa_spolki || "?"}, NIP ${tozsamosc?.nip || "?"}) i ustal kraj pochodzenia kapitału.

FAKTY Z REJESTRÓW (pobrane przez program, nie podlegają dyskusji; jeśli Twoje ustalenia się z nimi kłócą, opisz to w "uwagi"):
${fakty.length ? fakty.map((f) => "- " + f).join("\n") : "- brak (rejestr nie odpowiedział)"}
${METODOLOGIA}

ZADANIE
1. Zbuduj łańcuch własności od polskiej spółki w górę, aż do ostatecznego właściciela (osoba, rodzina, państwo, korporacja giełdowa z rozproszonym akcjonariatem, GP funduszu). Każde ogniwo: kto posiada poprzednie, z jakim % głosów, na podstawie jakiego źródła (URL) i na jaką datę.
2. Użyj WebSearch i WebFetch. Preferuj: raporty bieżące/roczne spółek, strony relacji inwestorskich, zawiadomienia o pakietach, KRS/rejestry innych krajów, potem media biznesowe. Wikipedia tylko jako trop.
3. Zastosuj drzewo decyzyjne i podaj regułę. Dla franczyz, licencji, JV, spółek Skarbu Państwa i funduszy podaj kod reguły brzegowej.
   country_code wybierz WYŁĄCZNIE z listy: ${Object.keys(kodyKrajow()).join(", ")}. Kody spoza listy (np. JE, KY, VG, LU jako wehikuł, CY, MT) nie są dopuszczalne: to jurysdykcje rejestrowe, a nie kraj kapitału; wskaż kraj zarządzającego/założyciela zgodnie z zasadą 1 i regułą B1. Jeśli kraj kapitału naprawdę jest spoza listy (np. Islandia), wpisz country_code pusty i wyjaśnij w "uwagi".
4. Wypisz historię zmian właściciela (założenie, przejęcia, IPO, wezwania) z latami i źródłami.
5. Czego nie potwierdzisz w źródle, nie podawaj jako faktu: wpisz do "luki".
Zwróć wyłącznie JSON wg schematu.`;
}

// ---------- krok 4: samokontrola ----------
export const SCHEMAT_KONTROLA = {
  type: "object",
  properties: {
    zgadza_sie: { type: "boolean", description: "czy mechaniczne zastosowanie drzewa do łańcucha daje ten sam kraj i właściciela" },
    country_code: { type: "string" },
    ostateczny_wlasciciel: { type: "string" },
    regula: { type: "string" },
    zastrzezenia: { type: "array", items: { type: "string" } },
    zrodla_zweryfikowane: { type: "array", items: { type: "object", properties: { url: { type: "string" }, potwierdza: { type: ["boolean", "null"] }, uwaga: { type: ["string", "null"] } }, required: ["url", "potwierdza"] } },
    brakujace_zrodla: { type: "array", items: { type: "string" } },
    pewnosc_proponowana: { type: "string", enum: ["WYSOKA", "SREDNIA", "KONFLIKT"] },
  },
  required: ["zgadza_sie", "country_code", "ostateczny_wlasciciel", "regula", "zastrzezenia", "zrodla_zweryfikowane", "pewnosc_proponowana"],
};

export function promptKontrola({ nazwa, sledztwo, rejestr, dzisiaj }) {
  const rej = rejestr && !rejestr.blad
    ? `KRS (stan ${rejestr.stanZDnia}): forma ${rejestr.formaPrawna}; wspólnicy: ${(rejestr.wspolnicy || []).map((w) => `${w.nazwa}${w.calosc ? " (100%)" : ` (${w.udzialy})`}`).join("; ") || "brak"}; jedyny akcjonariusz: ${(rejestr.jedynyAkcjonariusz || []).map((w) => w.nazwa).join("; ") || "brak"}.`
    : "KRS: brak danych.";
  return `Jesteś audytorem. Data dzisiejsza: ${dzisiaj}. Nie prowadzisz własnego śledztwa; sprawdzasz cudze.
${METODOLOGIA}

DANE Z REJESTRU (fakt): ${rej}

USTALENIA ANALITYKA dla marki "${nazwa}" (do sprawdzenia):
${JSON.stringify({ lancuch: sledztwo.lancuch, ostateczny_wlasciciel: sledztwo.ostateczny_wlasciciel, country_code: sledztwo.country_code, regula: sledztwo.regula, uzasadnienie: sledztwo.uzasadnienie, transakcja_w_toku: sledztwo.transakcja_w_toku, luki: sledztwo.luki }, null, 1)}

ZADANIE
1. Zastosuj drzewo decyzyjne MECHANICZNIE do podanego łańcucha (nie do własnej wiedzy). Jaki kraj i jaki właściciel z niego wynika? Jaka reguła?
2. Pobierz (WebFetch) źródła podane przy ogniwach z rolą "kontrolujacy"/"ostateczny" i przy pakietach ≥25%. Dla każdego: czy strona faktycznie potwierdza podmiot i procent? Jeśli strona nie odpowiada, potwierdza=null.
3. Sprawdź zgodność z danymi z rejestru: wspólnik 100% z KRS musi być w łańcuchu.
4. Wypisz zastrzeżenia: brak źródła dla pakietu kontrolnego, procent kapitału zamiast głosów, fundusz pasywny policzony jako kontrolujący, pominięta reguła brzegowa, nieaktualna data (starsza niż 24 miesiące przy spółce giełdowej).
5. Zaproponuj pewność: WYSOKA (kontrola udokumentowana źródłem poziomu 1-2, bez zastrzeżeń), SREDNIA (tylko media albo drobne luki), KONFLIKT (brak źródła kontroli, sprzeczność, reguła B5/B10/B11/B12).
Zwróć wyłącznie JSON wg schematu.`;
}

// ---------- krok 5: opisy ----------
export const SCHEMAT_OPISY = {
  type: "object",
  properties: {
    display_name: { type: "string", description: "nazwa marki do wyświetlania z poprawnymi diakrytykami i wielkością liter, np. 'Żabka', 'PKO BP'" },
    ownership_description: { type: "string" },
    business_description: { type: "string" },
    brands: { type: "array", items: { type: "object", properties: { name: { type: "string" }, domain: { type: ["string", "null"] } }, required: ["name"] } },
    website_url: { type: ["string", "null"] },
    category_slug: { type: ["string", "null"] },
  },
  required: ["display_name", "ownership_description", "business_description", "brands"],
};

export function promptOpisy({ nazwa, tozsamosc, sledztwo, rejestr, kategorie, dzisiaj }) {
  return `Piszesz dwa opisy do encyklopedycznego serwisu o pochodzeniu kapitału firm. Data: ${dzisiaj}. Marka: "${nazwa}", spółka: ${tozsamosc?.nazwa_spolki || "?"}.

DANE (jedyne dopuszczalne źródło liczb i nazw do opisu właścicielskiego):
${JSON.stringify({ lancuch: sledztwo.lancuch, ostateczny_wlasciciel: sledztwo.ostateczny_wlasciciel, country_code: sledztwo.country_code, regula: sledztwo.regula, uzasadnienie: sledztwo.uzasadnienie, historia: sledztwo.historia, transakcja_w_toku: sledztwo.transakcja_w_toku, forma_prawna: rejestr?.formaPrawna || null }, null, 1)}

1. ownership_description: 3-5 zdań wg schematu KTO kontroluje (z % głosów, gdy jest w danych) → JAK do tego doszło (rok założenia, przejęcia, IPO, strony transakcji) → STAN OBECNY (free float, pakiety mniejszościowe, wehikuły pośrednie z krajem rejestracji) → NIUANS (nieoczywiste przypisanie kraju: franczyza, fundusz, Skarb Państwa, holding w Luksemburgu). Ton suchy, encyklopedyczny, liczby zamiast przymiotników. Liczby i daty WYŁĄCZNIE z danych powyżej. Bez zdań "jest polska/zagraniczna" jako werdyktu, to wynika z kraju. Wzór: "Sieć Biedronka należy do portugalskiej grupy Jerónimo Martins, obecnej w Polsce od 1995 roku. Jej operator, Jeronimo Martins Polska S.A., jest spółką zależną notowanego w Lizbonie koncernu Jerónimo Martins SGPS S.A. Największym akcjonariuszem koncernu (ok. 56% akcji) jest holding Sociedade Francisco Manuel dos Santos, kontrolowany przez rodzinę Soares dos Santos."
2. business_description: 2-3 zdania o tym, czym firma się zajmuje (produkty, usługi, sektor, znane marki produktowe). Zero wątków właścicielskich, zero "lider rynku". Wzór: "Producent leków Rx, OTC i wyrobów medycznych. Działa w obszarach gastroenterologii, hepatologii, neurologii, dermatologii oraz okulistyki (marka Bausch + Lomb)." Możesz pobrać stronę firmy (WebFetch), żeby nie zgadywać oferty.
3. brands: marki konsumenckie należące OBECNIE do tej firmy w Polsce (nazwy z półki/szyldu), z domeną strony marki tylko, gdy jesteś jej pewien. Nie wpisuj samej nazwy firmy, chyba że jest też marką flagową obok innych. Bez marek: pusta lista.
4. category_slug: jedna z: ${kategorie.map((k) => k.slug).join(", ")}.
5. Zakazy stylu: żadnych myślników em-dash/en-dash (używaj przecinka, dwukropka, kropki), żadnych frazesów, żadnych ocen.
Zwróć wyłącznie JSON wg schematu.`;
}

// ---------- konsylium: prompt do innych modeli (Gemini, GPT, Grok, Perplexity) ----------
export function promptKonsylium(firmy) {
  const wiersze = firmy.map((f) => `| ${f.nazwa} | ${f.rekord?.nip || ""} | ${f.rekord?.country_code || "?"} | ${f.rekord?.owner_name || "?"} | ${(f.sledztwo?.uzasadnienie || "").replace(/\|/g, "/").slice(0, 220)} |`).join("\n");
  return `Jesteś niezależnym audytorem struktur właścicielskich. Poniżej ustalenia innego analityka dla firm działających w Polsce: kraj pochodzenia kapitału (kod ISO2) i ostateczny właściciel (szczyt piramidy, z pominięciem wehikułów i rajów podatkowych; kontrola = >50% głosów albo największy pakiet dający realną kontrolę; fundusze pasywne nie liczą się; historycznie polska marka przejęta przez obcy kapitał = zagraniczna; fundusz PE = kraj zarządzającego; Skarb Państwa = PL; franczyza = właściciel marki).

Sprawdź każdą pozycję z użyciem wyszukiwania w internecie, jeśli je masz. Odpowiedz WYŁĄCZNIE tabelą Markdown o kolumnach:
name | country_code | ultimate_owner | zgoda | uwagi | zrodlo
gdzie: name = dokładnie nazwa z kolumny pierwszej poniżej; country_code i ultimate_owner = Twoje ustalenie; zgoda = TAK, jeśli Twoje ustalenie kraju i właściciela zgadza się z analitykiem, NIE, jeśli nie; uwagi = jedno zdanie (przy NIE obowiązkowo: co jest inaczej i od kiedy); zrodlo = URL potwierdzający Twoje ustalenie albo "brak".

| name | nip | kraj wg analityka | właściciel wg analityka | uzasadnienie analityka |
|---|---|---|---|---|
${wiersze}`;
}
