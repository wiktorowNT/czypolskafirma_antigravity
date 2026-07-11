# 🏭 SOP: Rurociąg Danych (Data Pipeline) — Schemat Dodawania Firm do Bazy

> **Projekt:** czypolskafirma.pl  
> **Cel dokumentu:** Ustandaryzowany proces zbierania, weryfikacji i importu danych o firmach do Supabase.  
> **Źródło:** zsynchronizowane z Notion („Projekt czypolskafirma" → SOP Rurociąg Danych). Powiązane: `docs/SOP_logotypy.md`.

---

## 🗂️ Checklist Startowy (Przygotowanie)

- [ ] Odpalony Arkusz Google (Google Sheets)
- [ ] Odpalony Supabase (zakładka Table Editor → `companies`)
- [ ] Odpalone 5 zakładek z modelami AI (np. Grok, Claude, Gemini, Perplexity, ChatGPT)

---

## 🛠️ KROK 1: Generowanie Listy (Seed)

**Cel:** Zebranie surowej listy (~40 firm) najpopularniejszych firm działających w Polsce z danej kategorii.

1. Skopiuj poniższy prompt i wklej do swoich modeli AI.
2. Porównaj wyniki i wybierz tylko te firmy, które się powtarzają lub mają sens.
3. Wklej wybrane nazwy do Kolumny A w Google Sheets.

```text
Podaj listę 40 najpopularniejszych i najbardziej rozpoznawalnych firm działających w Polsce w kategorii: [WPISZ KATEGORIĘ].

Opis tej kategorii: ""
Zwróć tylko surową listę nazw firm (bez punktorów, bez opisów).
```

---

## ⚙️ KROK 2: Pozyskanie NIP (Twarde dane)

**Cel:** Wyszukanie numerów NIP dla firm z listy — chodzi o numery NIP dla głównych spółek działających w Polsce.

1. Skopiuj listę firm z Arkusza.
2. Wklej do modelu AI wraz z poniższym promptem.
3. Uzupełnij numery NIP w Kolumnie B (`nip`) w Google Sheets.

```text
Dla poniższej listy firm znajdź ich oficjalne numery NIP z rejestru KRS/CEIDG. Na liście są firmy polskie ale też zagraniczne, wypisz NIP dla głównych spółek zarejestrowanych w Polsce dla tych firm.
Zwróć wynik jako dwukolumnową tabelę: [Nazwa Firmy] | [NIP].

Lista firm:
```

---

## 🕵️ KROK 3: Śledztwo Kapitałowe (Master Prompt)

**Cel:** Ustalenie struktury właścicielskiej i tego, czy to polska firma.

1. Skopiuj poniższy Master Prompt do swoich modeli AI.
2. Wklej listę firm z Kroku 2.
3. Porównaj wygenerowane wyniki, zbuduj finalną, najlepszą tabelę.
4. Wstaw tabelę do Google Sheets.

### Metodologia Weryfikacji (4 zasady)

**1. Zasada Ostatecznego Właściciela (Przejrzystość)**  
Ignorujemy wehikuły inwestycyjne, fundusze powiernicze i raje podatkowe (Cypr, Luksemburg, Malta). Patrzymy na szczyt piramidy. Jeśli za zagraniczną spółką stoi polski założyciel — kapitał jest polski. Jeśli właścicielem polskiej sp. z o.o. jest zagraniczny fundusz — kapitał przypisujemy do kraju funduszu.

**2. Zasada Efektywnej Kontroli**  
O przynależności firmy decyduje podmiot posiadający pakiet kontrolny: ponad 50% udziałów LUB największy pojedynczy pakiet akcji (np. 40%), który realnie pozwala powoływać zarząd i dyktować strategię. Mocno rozproszony drobny akcjonariat nie wpływa na główny status firmy.

**3. Zasada "Złotej Klatki" (Przejęcia)**  
Historyczne pochodzenie marki nie ma znaczenia. Jeśli firma została założona w Polsce i zbudowana przez Polaków (np. Allegro, Żabka, Wedel), ale jej pakiet kontrolny został wykupiony przez zagraniczny kapitał — firma klasyfikowana jest jako podmiot zagraniczny.

**4. Klasyfikacja Binarna**  
Firma otrzymuje status "Polska Firma" tylko wtedy, gdy ostateczny właściciel sprawujący efektywną kontrolę jest podmiotem polskim. Przypadki mieszane opisujemy w profilu firmy, jednak nie uprawniają one do uzyskania statusu polskiej firmy.

### Master Prompt

```text
Jesteś starszym analitykiem finansowym i ekspertem wywiadu gospodarczego (KYC). Twoim zadaniem jest zbadanie struktury właścicielskiej poniższej listy firm operujących w Polsce i ustalenie ich kraju pochodzenia.

MUSISZ bezwzględnie stosować się do poniższej Metodologii Weryfikacji:

1. Zasada Ostatecznego Właściciela (Przejrzystość)
Ignorujemy wehikuły inwestycyjne, fundusze powiernicze i tzw. raje podatkowe (Cypr, Luksemburg, Malta). Patrzymy na szczyt piramidy. Jeśli za zagraniczną spółką stoi polski założyciel – kapitał jest polski. Jeśli właścicielem polskiej spółki z o.o. jest zagraniczny fundusz – kapitał przypisujemy do kraju funduszu.

2. Zasada Efektywnej Kontroli
O przynależności firmy decyduje podmiot posiadający pakiet kontrolny. Wymagane jest ponad 50% udziałów LUB posiadanie największego, pojedynczego pakietu akcji (np. 40%), który realnie pozwala powoływać zarząd i dyktować strategię. Mocno rozproszony drobny akcjonariat nie wpływa na główny status firmy.

3. Zasada "Złotej Klatki" (Przejęcia)
Historyczne pochodzenie marki nie ma znaczenia. Jeśli firma została założona w Polsce i zbudowana przez Polaków (np. Allegro, Żabka, Wedel), ale jej pakiet kontrolny został wykupiony przez zagraniczny kapitał, tracąc niezależność – firma klasyfikowana jest jako podmiot zagraniczny.

4. Klasyfikacja Binarna
Firma otrzymuje status "Polska Firma" tylko wtedy, gdy ostateczny właściciel sprawujący efektywną kontrolę jest podmiotem polskim. Przypadki mieszane i niuanse (np. mniejszościowe pakiety udziałów w rękach polskich) opisujemy w profilu firmy, jednak nie uprawniają one do uzyskania statusu polskiej firmy.

Zwróć wynik TYLKO jako tabelę Markdown z dokładnie 4 kolumnami oddzielonymi znakiem | (pipe). Pierwsza linia to nagłówek, druga linia to separator (|---|---|---|---|), następnie dane — jedna firma per linia.
Kolumny: name | ultimate_owner | country_code | ownership_description
Nie dodawaj żadnego tekstu przed ani po tabeli.

Opis pól:
1. name — Nazwa z mojej listy
2. ultimate_owner — Krótka nazwa ostatecznego właściciela/funduszu/osoby na szczycie. Pomiń spółki pośrednie.
3. country_code — Tylko 2-literowy kod ISO kraju pochodzenia ostatecznego właściciela, np. PL, US, DE, FR.
4. ownership_description — Krótkie uzasadnienie w max. kilku zdaniach. Wskaż głównego udziałowca i jego kraj. KLUCZOWE: Jeśli historycznie polska marka została przejęta przez zagraniczny kapitał, MUSISZ podać rok przejęcia, wielkość pakietu i kto ją kupił. Ton: suchy, encyklopedyczny. Zignoruj informację, że spółka z.o.o jest polskim oddziałem zagranicznej firmy — opisuj ogólną sytuację firmy, nie skupiaj się na konkretnej spółce dla której jest podany NIP.

Tutaj lista moich firm do badania (kolumny: slug | nip):
```

---

## ✍️ KROK 4: Generowanie Opisów Działalności (Copywriting)

**Cel:** Stworzenie czystych, encyklopedycznych opisów tego, czym zajmuje się firma (produkty/usługi), bez mieszania w to struktury własnościowej.

> ⚠️ **WAŻNE:** Otwórz **NOWY, czysty czat** w modelach AI — kluczowe, aby wyczyścić kontekst ze śledztwa kapitałowego i uniknąć halucynacji.

1. Otwórz nowy, czysty czat w modelach AI.
2. Skopiuj poniższy prompt i doklej do niego listę firm.
3. Skopiuj wygenerowaną tabelę i uzupełnij kolumnę `business_description` w Google Sheets.

```text
Jesteś copywriterem biznesowym. Twoim zadaniem jest napisanie krótkich, encyklopedycznych opisów działalności dla poniższej listy firm operujących w Polsce.

Wytyczne:
1. Skup się WYŁĄCZNIE na tym, czym firma się zajmuje (produkty, usługi, sektor). Możesz podawać nazwy produktów, które są bardzo znane od tej firmy, np. dla BEIERSDORF: "Właściciel globalnych marek takich jak NIVEA, Eucerin czy La Prairie."
2. Całkowicie ZIGNORUJ kwestie właścicielskie, kapitałowe, zarząd i historię przejęć (mam to przeanalizowane w osobnej sekcji).
3. Styl: Profesjonalny, zwięzły, obiektywny (bez pustych frazesów typu "lider na rynku", "najwyższa jakość"). Maksymalnie 2–3 zdania.

Przykład dobrego opisu: "Producent leków Rx, OTC i wyrobów medycznych. Działa w obszarach gastroenterologii, hepatologii, neurologii, dermatologii oraz okulistyki (marka Bausch + Lomb)."

Zwróć wynik jako tabelę Markdown z dwiema kolumnami:
1. slug — Nazwa firmy z mojej listy
2. business_description — Wygenerowany opis działalności

Lista firm do opisania (slug | NIP | opis kwestii właścicielskich — po to, abyś nie powtarzał tych informacji w opisie działalności):
```

---

## 🚀 KROK 5: Import do Supabase (Produkcja)

**Cel:** Przerzucenie zatwierdzonych i zweryfikowanych danych na stronę.

1. Sprawdź, czy nagłówki w Google Sheets (wiersz 1) to: `nip`, `slug`, `owner_name`, `category_slug`, `category_id`, `business_description`, `ownership_description`.
2. W Google Sheets: **Plik → Pobierz → Wartości rozdzielane przecinkami (.csv)**.
3. Przejdź do Supabase → **Table Editor** → tabela `companies`.
4. Kliknij **Insert → Import data from CSV**.

---

## 📋 Schemat kolumn Google Sheets

| Kolumna | Pole w Supabase | Opis |
|---|---|---|
| A | `slug` / `name` | Nazwa firmy |
| B | `nip` | Numer NIP |
| C | `ultimate_owner` | Ostateczny właściciel |
| D | `country_code` | Kod kraju (ISO 2-literowy) |
| E | `ownership_description` | Uzasadnienie struktury właścicielskiej |
| F | `business_description` | Opis działalności firmy |
| G | `category_slug` | Slug kategorii |
| H | `category_id` | ID kategorii w Supabase |
| I | `website_url` | Strona główna firmy |
| J | `registry_url` | Link do rejestr.io (`https://rejestr.io/szukaj?q=[NIP]`) |
