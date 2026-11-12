# Instrukcja Rozwoju Projektu CzyPolskaFirma

## Przepływ Pracy (Workflow)

W celu zapewnienia stabilności wersji publicznej, obowiązują następujące zasady:

### 1. Praca na Gałęziach (Git)
- **Gałąź `main`**: Reprezentuje wersję publiczną strony. Nie wprowadzamy tutaj bezpośrednich zmian.
- **Gałąź `develop`**: To tutaj odbywają się wszystkie prace rozwojowe, testy SEO oraz poprawki błędów.

### 2. Środowisko Testowe (Vercel)
Każda zmiana na gałęzi `develop` jest automatycznie wdrażana na podgląd:
[https://czypolskafirmalive-git-develop-wiktorow123-3833s-projects.vercel.app/](https://czypolskafirmalive-git-develop-wiktorow123-3833s-projects.vercel.app/)

### 3. Proces Akceptacji
1. AI (Antigravity) lub deweloper wprowadza zmiany na gałęzi `develop`.
2. Zmiany są weryfikowane na powyższym linku testowym.
3. Po wyraźnym zatwierdzeniu przez Właściciela, zmiany są scalane (merge) do gałęzi `main`.

### 4. Rytm wdrożeń produkcji (SEO)
- **Merge `develop` → `main` najwyżej raz dziennie, paczką** — nie po każdej zmianie.
  Każde wdrożenie zmienia nazwy plików JS, a Google renderuje pobrany HTML z opóźnieniem;
  jeśli w międzyczasie weszło nowe wdrożenie, widzi pustą stronę błędu i oznacza profil
  jako „Duplikat” (październik 2026: 20 stron sklejonych z obcym serwisem).
- `vercel.json` → `tools/vercel-ignore-build.sh` pomija build, gdy od ostatniego wdrożenia
  zmieniły się tylko `docs/`, `tools/`, `tests/`, `data/robocze/`, `data/panel/`, `scratch/`,
  `vitest.config.mts` lub pliki README/CLAUDE.md. Nowy katalog, którego strona nie czyta,
  dopisz do listy w skrypcie.
- W Vercelu włączone **Skew Protection** (stare pliki JS dostępne po wdrożeniu).
- `app/global-error.tsx`: przy brakującym pliku JS strona przeładowuje się raz, a potem
  pokazuje własny komunikat z canonicalem zamiast ogólnego ekranu Next.js.

### 5. Testy jednostkowe (`npm test`)
Repo nie ma CI, więc testy uruchamiamy lokalnie przed scaleniem zmian w logice z `lib/`
albo `app/companies/`:

```bash
npm test            # vitest run: jeden przebieg, kod wyjścia != 0 przy błędzie
npm run test:watch  # tryb obserwacji podczas pracy
```

- Testy leżą w `tests/` i odbijają strukturę repo (`tests/lib/search-query.test.ts`
  testuje `lib/search-query.ts`). Konfiguracja: `vitest.config.mts` (alias `@/` jak w tsconfig).
- Testy **nie łączą się z bazą**: Supabase i `fetch` są atrapami. Nie trzeba `.env.local`.
- Najważniejszy plik to `tests/lib/companies-paged.test.ts`: pilnuje stronicowania odczytu
  całej tabeli `companies` (limit 1000 wierszy Supabase, flaga `complete`, tiebreaker `id`).
- `tests/lib/blog.test.ts` sprawdza też prawdziwe wpisy z `content/blog`: każdy plik `.md`
  musi dać wpis (błędny frontmatter po cichu gubił wpis z bloga i sitemapy).
- Znany błąd, którego jeszcze nie poprawiono, oznaczamy `it.fails(...)` z komentarzem.
  Taki test przechodzi, dopóki błąd istnieje; po poprawce kodu zmień go na zwykłe `it`.
- Pliki testów są objęte `npx tsc --noEmit` i `next build` (sprawdzanie typów), więc błąd
  typów w teście zatrzyma build. Przed pushem: `npm test`, `npx tsc --noEmit`, `npm run lint`.

### 6. Hosting tymczasowy: Cloudflare (XI–XII 2026)
12.11.2026 Vercel wyłączył wdrożenia po wyczerpaniu limitu (402 `DEPLOYMENT_DISABLED`).
Produkcja stoi tymczasowo na Cloudflare Workers (darmowy plan, 10 ms procesora na żądanie).
Plan: **powrót na Vercel ok. 13.12.2026**, kiedy odnowi się limit.

**Jak to jest złożone**
- `main` i `develop` zostają czystym Next.js pod Vercel. Kod Cloudflare (vinext,
  `cloudflare.config.ts`, `vite.config.ts`, `worker/index.ts`, `tools/cloudflare/build.mjs`,
  usunięte statystyki Vercela) jest **tylko na gałęzi `cloudflare`**. Nie scalamy jej do
  `develop` ani `main`.
- `.github/workflows/wdrozenie-cloudflare.yml` bierze `main`, dokłada w maszynie CI gałąź
  `cloudflare`, buduje (profile firm, kategorie, karty OG, sitemapy i pierwsza strona
  `/companies` jako gotowe pliki) i wdraża na `czypolskafirma.pl`. Uruchamia się:
  - po pushu do `main` (scalenie `develop` → `main`, przycisk „Opublikuj” w panelu),
    z pominięciem zmian tylko w `docs/`, `tools/`, `data/robocze/`, `data/panel/` itd.;
  - codziennie o 23:20 UTC, żeby wpisy z datą w przyszłości pojawiały się w swoim dniu;
  - ręcznie: GitHub → Actions → „Wdrożenie na Cloudflare” → Run workflow.
- Strona jest zbudowana z góry: nowa firma w bazie pojawi się na stronie po najbliższym
  wdrożeniu (najpóźniej w nocy), a nie po dobie ISR.
- GitHub → Settings → Secrets and variables → Actions: sekrety `CLOUDFLARE_API_TOKEN`
  i `CLOUDFLARE_ACCOUNT_ID` oraz `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (jako sekrety albo zmienne, te dwie są i tak jawne w kodzie strony). Bez nich build nie
  odczyta bazy i wdrożenie się przerwie. Sekret Workera (Cloudflare →
  Workers → czypolskafirma → Settings → Variables and Secrets): `DISCORD_WEBHOOK_URL`.
- Konflikt przy dokładaniu gałęzi `cloudflare` przerywa wdrożenie (produkcja zostaje bez
  zmian). Naprawa: w worktree `cloudflare` scal `main`, rozwiąż konflikt, wypchnij `cloudflare`.
- Ręczne wdrożenie z komputera (Node 22.18+): w worktree `cloudflare`
  `node tools/cloudflare/build.mjs --deploy`. Lokalny Node 22.14 jest za stary
  (`cloudflare.config.ts` wymaga 22.18+): trzeba nowszego Node.

**Powrót na Vercel**
1. Upewnić się, że limit Vercela się odnowił i projekt jest jedynym dużym na koncie.
2. W Vercelu przywrócić domenę `czypolskafirma.pl` (i `www`), a w DNS ustawić rekordy Vercela
   zamiast Workera; w Cloudflare zdjąć domenę z Workera `czypolskafirma`.
3. Usunąć `.github/workflows/wdrozenie-cloudflare.yml` (na `develop`, potem `main`).
4. Gałąź `cloudflare` zostawić jako archiwum albo usunąć. Na `main` niczego nie trzeba
   cofać — statystyki Vercela i ISR są tam nadal.
5. Zaktualizować ten rozdział, `CLAUDE.md` i dziennik w panelu.

## Zasady dla AI
- **ZAKAZ** bezpośrednich zmian na `main`.
- **ZAKAZ** wprowadzania zmian bez wcześniejszego przedstawienia planu i uzyskania akceptacji.
- Wszystkie adresy URL w kodzie muszą uwzględniać aktualną strukturę (identyfikatory UUID, np. `/firma/[id]`).
