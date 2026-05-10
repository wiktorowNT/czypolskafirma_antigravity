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

## Zasady dla AI
- **ZAKAZ** bezpośrednich zmian na `main`.
- **ZAKAZ** wprowadzania zmian bez wcześniejszego przedstawienia planu i uzyskania akceptacji.
- Wszystkie adresy URL w kodzie muszą uwzględniać aktualną strukturę (identyfikatory UUID, np. `/firma/[id]`).
