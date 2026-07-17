---
title: "Tytuł wpisu — fraza SEO na początku"
slug: "tytul-wpisu-krotki-slug"
date: 2026-01-01
description: "Opis wpisu na 1–2 zdania (max ~155 znaków) — trafia do meta description i na listę wpisów."
image: "/images/blog/tytul-wpisu-krotki-slug.png"
imageAlt: "Opis tego, co widać na zdjęciu głównym"
relatedCompanies:
  - zabka
  - e-wedel
---

Lead wpisu — 2–3 zdania, które streszczają temat i zachęcają do czytania.
Pierwszy akapit jest najważniejszy dla czytelnika i dla Google.

## Śródtytuł sekcji (h2)

Treść sekcji. Obsługiwany markdown: **pogrubienie**, *kursywa*, `kod inline`,
[link do profilu firmy](/firma/zabka) oraz [link zewnętrzny](https://example.com).

### Podsekcja (h3)

Zdjęcie w treści (osobna linia; opis stanie się podpisem pod zdjęciem):

![Podpis pod zdjęciem — co widać i skąd pochodzi](/images/blog/nazwa-zdjecia.jpg)

- punkt listy
- kolejny punkt

1. lista numerowana
2. drugi punkt

> Cytat lub kluczowa liczba warta wyróżnienia.

---

## Zasady pisania (usuń tę sekcję we wpisie)

- Plik zapisuj jako `content/blog/nazwa-wpisu.md` — pliki zaczynające się od `_` są pomijane na liście.
- `slug` musi być kanoniczny (małe litery, myślniki, bez polskich znaków); jeśli go pominiesz, powstanie z nazwy pliku.
- `date` w formacie RRRR-MM-DD — decyduje o kolejności na liście wpisów.
- `relatedCompanies` to slugi z adresów `/firma/[slug]` — na dole wpisu wyrenderują się karty tych firm.
- Treści po polsku, frazy SEO z polskiej gospodarki/biznesu w tytule, opisie i śródtytułach.

### Zdjęcia

- `image` (opcjonalne) — zdjęcie główne wpisu: pokazuje się nad tytułem, jako miniatura na
  liście `/blog`, jako `og:image` przy udostępnianiu na X/FB i w JSON-LD dla Google.
  Zalecany rozmiar: **1200×630 px** (format og:image). `imageAlt` — opis dla czytników i SEO.
- Pliki wrzucaj do `public/images/blog/` (w URL-u to `/images/blog/...`). Nazwa najlepiej
  jak slug wpisu. Formaty: `.jpg`/`.png`/`.webp` (nie `.svg` dla `image` — X/FB go nie renderują).
- Zdjęcia w treści: `![podpis](/images/blog/plik.jpg)` w osobnej linii.
- **Prawa autorskie:** nie kopiuj zdjęć z artykułów prasowych. Bezpieczne źródła:
  własne grafiki (generator kart), oficjalne materiały prasowe firm (biuro prasowe),
  darmowe stocki (Unsplash, Pexels) na zdjęcia sektorowe. W podpisie podawaj źródło.
