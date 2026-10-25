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
  zmieniły się tylko `docs/`, `tools/`, `data/robocze/`, `data/panel/`, `scratch/` lub pliki
  README/CLAUDE.md. Nowy katalog, którego strona nie czyta, dopisz do listy w skrypcie.
- W Vercelu włączone **Skew Protection** (stare pliki JS dostępne po wdrożeniu).
- `app/global-error.tsx`: przy brakującym pliku JS strona przeładowuje się raz, a potem
  pokazuje własny komunikat z canonicalem zamiast ogólnego ekranu Next.js.

## Zasady dla AI
- **ZAKAZ** bezpośrednich zmian na `main`.
- **ZAKAZ** wprowadzania zmian bez wcześniejszego przedstawienia planu i uzyskania akceptacji.
- Wszystkie adresy URL w kodzie muszą uwzględniać aktualną strukturę (identyfikatory UUID, np. `/firma/[id]`).
