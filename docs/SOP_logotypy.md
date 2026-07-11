# 🖼️ SOP: Zarządzanie logotypami firm

> **Projekt:** czypolskafirma.pl
> **Źródło:** zsynchronizowane z Notion („SOP: Zarządzanie logotypami firm w projekcie CzyPolskaFirma").
> **Cel:** Pobranie logotypów w najwyższej jakości dla nowo dodanych firm, optymalizacja
> istniejących obrazków oraz wygodna selekcja i ręczna podmiana logo dla problematycznych domen.

Narzędzia z tej procedury znajdują się w katalogu `tools/`. Wszystkie komendy uruchamiamy
z terminala w folderze projektu.

---

## 🏗️ Faza 1 — Masowe pobieranie po dodaniu nowych firm

Gdy dodasz nową paczkę firm do Supabase, uruchom automat, który pobierze brakujące loga
z Brandfetch (priorytet: pliki wektorowe SVG).

**Krok 1 — pobierz brakujące logotypy:**

```bash
node tools/fetch-logos.mjs
```

**Krok 2 — ulepsz logotypy niskiej jakości** (opcjonalne, zalecane co jakiś czas).
Skrypt przeszuka ikony `< 10 KB` i spróbuje znaleźć lepszą, wektorową wersję:

```bash
node tools/fetch-logos.mjs --upgrade
```

---

## 🧹 Faza 2 — Sprzątanie i optymalizacja

Po pobieraniu mogą powstać duplikaty (np. stara ikonka `.png` i nowa wektorowa `.svg`
dla tej samej firmy).

**Krok 3 — sprawdź duplikaty (dry-run)** — pokazuje, ile miejsca odzyskasz, nie usuwa plików:

```bash
node tools/cleanup-logos.mjs
```

**Krok 4 — usuń gorsze wersje i puste pliki.** Skrypt zawsze zostawia najlepszy wariant
(hierarchia: SVG > PNG > WEBP > JPG):

```bash
node tools/cleanup-logos.mjs --execute
```

---

## 👁️ Faza 3 — Audyt wizualny i selekcja braków

Po automatycznym pobraniu i czyszczeniu trzeba wzrokowo sprawdzić, jak logotypy
prezentują się na stronie, i wyłapać te, które automat pobrał błędnie lub których nie
znalazł (nietypowa domena, np. `bp.pl` zamiast `bp.com`).

**Krok 5 — wygeneruj raport audytu:**

```bash
node tools/generate-logo-audit.mjs
```

**Krok 6 — selekcja błędnych logo w przeglądarce:**

1. Otwórz wygenerowany plik `tools/audyt-logo.html`.
2. Zobaczysz wszystkie firmy z ich aktualnymi logotypami.
3. **Zaznacz kliknięciem** logotypy, które się nie ładują, mają białe tło zamiast
   przezroczystego albo są po prostu złej jakości.
4. Kliknij przycisk kopiowania na dole strony — do schowka trafi lista zaznaczonych
   domen w gotowym formacie (np. `amica.pl,benix.pl,c-and-a.com,`).

---

## 🎯 Faza 4 — Ręczna naprawa wybranych logo („Logo Fixer")

Mając skopiowaną listę problematycznych domen, przechodzimy do narzędzia „Logo Fixer".

**Krok 7 — użycie aplikacji „Logo Fixer":**

1. Upewnij się, że działa lokalny serwer: `npm run dev`.
2. Otwórz w przeglądarce: http://localhost:3000/narzedzia/logo-fixer
3. W niebieskim polu tekstowym **wklej listę domen** i kliknij **Aktualizuj listę poniżej**.

Opcje naprawy:

- **Szybka z CDN** — kliknij pomarańczowy przycisk **⚡ Auto**. Narzędzie pobierze i zapisze
  logo z Brandfetch CDN.
- **Ręczna (drag & drop)** — użyj skrótów **Brandfetch ↗** lub **WVL ↗**, aby ręcznie znaleźć
  poprawne logo (np. wpisując globalną domenę firmy), pobierz plik i **przeciągnij go**
  w kropkowane pole w Logo Fixerze.

---

## 🚀 Faza 5 — Wdrożenie na produkcję (Vercel)

> ⚠️ Zgodnie z workflow projektu zmiany trafiają najpierw na gałąź `develop`, nie na `main`.
> Poniższe polecenia wykonuj na `develop` — publikacja na produkcję to osobny, ręczny merge
> `develop → main` po weryfikacji na podglądzie Vercel (patrz `DEVELOPMENT_WORKFLOW.md`).

**Krok 8 — zapis i publikacja:**

```bash
git add public/logos
git commit -m "Aktualizacja logotypów firm — masowy fetch i audyt"
git push
```

⏳ Zaczekaj 1–2 minuty — Vercel automatycznie zbuduje nową wersję.
🔄 Odśwież stronę skrótem **Ctrl + F5**, aby wyczyścić cache przeglądarki.
