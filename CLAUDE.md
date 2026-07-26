# CLAUDE.md — Instrukcja pracy dla AI w projekcie CzyPolskaFirma

> Ten plik jest wczytywany automatycznie na starcie każdej sesji. Zawiera zasady,
> których AI musi bezwzględnie przestrzegać przy pracy nad projektem.
> **Strona produkcyjna:** https://czypolskafirma.pl

---

## 1. O projekcie

CzyPolskaFirma promuje **patriotyzm gospodarczy** w Polsce. Serwis weryfikuje
pochodzenie kapitału popularnych firm działających w Polsce i uświadamia
konsumentom, czy marka postrzegana jako „polska" rzeczywiście należy do polskiego
kapitału.

Sercem projektu jest **analityka właścicielska**. Obowiązują trzy ścisłe zasady
klasyfikacji:

1. **Zasada Ostatecznego Właściciela** — patrzymy na szczyt piramidy właścicielskiej
   i ignorujemy raje podatkowe. Jeśli polski założyciel trzyma udziały przez spółkę
   na Cyprze, kapitał traktujemy jako **polski**.
2. **Zasada Efektywnej Kontroli** — o przynależności decyduje pakiet kontrolny
   (zwykle powyżej 50% udziałów), a nie pojedyncze mniejszościowe pakiety.
3. **Zasada Złotej Klatki** — historycznie polskie marki przejęte przez obcy kapitał
   (np. Wedel, Żabka) klasyfikujemy jako **zagraniczne**.

Pełna metodologia weryfikacji: `docs/SOP_dodawanie_firm.md`.

---

## 2. ⛔ Zasady krytyczne (workflow) — czytaj zawsze

- **ABSOLUTNY ZAKAZ zmian na gałęzi `main`.** `main` = produkcja. Nigdy nie
  commituj, nie merge'uj ani nie proponuj zmian bezpośrednio na `main`.
- **Cała praca odbywa się na gałęzi `develop`** (podpięta pod Vercel preview).
- **Planuj przed większymi zmianami.** Zanim wprowadzisz istotne zmiany w kodzie,
  najpierw przedstaw krótki plan i **poczekaj na wyraźną akceptację** właściciela
  (Wiktora).
- **Nie ruszaj `.env.local`** ani żadnych sekretów. Nie wypisuj kluczy w odpowiedziach.
- Merge `develop` → `main` wykonuje **wyłącznie właściciel** po weryfikacji na
  podglądzie Vercel. Możesz też wykonać ty na wyraźną prośbę właściciela.

**Podgląd (Vercel preview gałęzi `develop`):**
https://czypolskafirmalive-git-develop-wiktorow123-3833s-projects.vercel.app/

Szczegóły: `docs/DEVELOPMENT_WORKFLOW.md`.

---

## 3. Stack technologiczny

| Warstwa       | Technologia                                                        |
|---------------|--------------------------------------------------------------------|
| Framework     | Next.js **14.2.25** (App Router)                                   |
| Frontend      | React 19, Tailwind CSS **v4**, komponenty na bazie Radix UI       |
| Ikony         | lucide-react                                                       |
| Baza / backend| Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — tabela `companies` |
| Hosting       | Vercel                                                             |
| Skrypty       | Node.js (ESM `.mjs`) — czyszczenie danych, aktualizacja URL-i, loga |

Runtime: Node 22. Menedżer pakietów: npm.

### Komendy

```bash
npm run dev     # serwer deweloperski
npm run build   # build produkcyjny
npm run lint    # linter Next.js
npm run start   # serwer produkcyjny (po build)
```

> `npm run save` robi `git add . && git commit -m "auto-save" && git push`.
> **Używać ostrożnie** — commituje wszystko na bieżącą gałąź. Nigdy na `main`.

---

## 4. Mapa repozytorium

```
app/                       # Next.js App Router
├─ page.tsx                # strona główna
├─ layout.tsx              # layout, opengraph, robots, sitemap
├─ api/                    # API routes
│  ├─ companies/           # lista, wyszukiwanie, count, by-ids, alternatives, views
│  ├─ categories/          # kategorie
│  ├─ generator/           # wyszukiwarka generatora
│  ├─ logo/ · stats/ · tools/ · zglos-firme/
├─ firma/[slug]/           # profil firmy (CompanyProfileClient.tsx)
├─ kategoria/[slug]/       # strona kategorii
├─ szukaj/ · ulubione/ · metodologia/ · o-projekcie/
├─ narzedzia/              # generator, logo-fixer
└─ regulamin/ · polityka-prywatnosci/

components/                # komponenty React (CompanyCard, CompanyGrid, Hero, FAQ, ...)
lib/
├─ supabase/               # client.ts (browser), server.ts, get-companies, get-categories
├─ company-utils.ts · countries.ts · rate-limit.ts
data/                      # categories.json, company-details.json (dane statyczne)
docs/                      # dokumentacja projektu (workflow, SOP, backup)
tools/                     # narzędzia pomocnicze (audyt logo, pipeline, weryfikator NIP)
public/                    # zasoby statyczne
```

> **Uwaga na routing:** profile firm są pod `app/firma/[slug]` (slug, nie UUID).
> Starszy zapis w dokumentach mówiący o `/firma/[id]` jest nieaktualny.

---

## 5. Model danych — tabela `companies` (Supabase)

Kluczowe pola przechowywane dla każdej firmy:

- `slug` — identyfikator w URL
- `nip` — numer NIP głównej spółki zarejestrowanej w Polsce
- `ultimate_owner` — ostateczny właściciel (szczyt piramidy)
- `country_code` — kod kraju pochodzenia kapitału
- `ownership_description` — uzasadnienie struktury właścicielskiej
- `business_description` — neutralny opis działalności firmy

**Pipeline danych:** firmy zbierane i weryfikowane wg SOP (Google Sheets + modele AI),
finalny zbiór eksportowany do CSV i importowany do Supabase.
Pełna procedura: `docs/SOP_dodawanie_firm.md` (proces bazowy opisany też w Notion).

---

## 6. Konwencje

- Język treści serwisu: **polski**. Nazwy plików/dokumentów po polsku są OK.
- Nowe skrypty jednorazowe (migracje URL-i, dane) → katalog `tools/`, format ESM `.mjs`.
- Nie commituj dużych artefaktów buildu ani wygenerowanych bundli, jeśli da się tego uniknąć.
- Przy zmianach w API/danych sprawdź spójność z `lib/supabase/*` i typami.
- Backup bazy: wg `docs/BACKUP_STRATEGY.md` (zrzuty na Google Drive, nie w repo).

---

## 7. Dokumenty referencyjne

- `docs/DEVELOPMENT_WORKFLOW.md` — workflow git i proces akceptacji
- `docs/SOP_dodawanie_firm.md` — pełny pipeline dodawania firm
- `docs/SOP_logotypy.md` — zarządzanie logotypami firm (fetch, audyt, Logo Fixer)
- `docs/AUTOMATYZACJA_TRESCI.md` — codzienny automat treści (blog + X + FB) na GitHub Actions
- `docs/BACKUP_STRATEGY.md` — strategia backupu bazy

> Część dokumentacji jest lustrzana z Notion (workspace „Projekt czypolskafirma").
> Przy rozbieżnościach źródłem prawdy dla kodu i narzędzi jest repozytorium.
