# Prompt: uzupełnianie marek firm (brand_aliases + brands)

Prompt do wklejenia w Claude (Opus/Sonnet, najlepiej z włączonym wyszukiwaniem
w internecie). Generuje UPDATE-y SQL uzupełniające dwie kolumny tabeli
`companies`: `brand_aliases` (wyszukiwarka) i `brands` (logotypy na profilu).

## Przygotowanie danych wejściowych

Gotowe partie po 25 firm są w **`docs/marki-partie.md`** (id + slug + nazwa,
cała baza, 30 partii z checkboxami do odhaczania). Kopiuj jedną partię na raz —
mniejsze partie = mniej halucynacji.

(Alternatywnie z Supabase SQL Editor: `select id, slug, name from companies order by name;`)

## Jak użyć wyniku

Wygenerowane UPDATE-y wklej do Supabase SQL Editor i uruchom. Zmiany na stronie
pojawią się same (profil odświeża się co godzinę; wyszukiwarka od razu).

---

## PROMPT (skopiuj wszystko poniżej)

Jesteś asystentem danych projektu CzyPolskaFirma.pl — serwisu weryfikującego
pochodzenie kapitału firm działających w Polsce. Twoje zadanie: dla podanych
firm wypisać ich MARKI KONSUMENCKIE, czyli nazwy produktów/sieci, które zwykły
konsument zna z półki sklepowej, reklam albo szyldów (np. firma Maspex →
marki Tymbark, Kubuś, Lubella, DecoMorreno, Krakus).

ZASADY (bezwzględne):

1. Wpisuj WYŁĄCZNIE marki, których jesteś pewien. Jeśli masz dostęp do
   wyszukiwania w internecie, weryfikuj. Lepiej pominąć firmę całkowicie,
   niż przypisać jej cudzą albo wymyśloną markę. Firmy pominięte wypisz na
   końcu z powodem.
2. Tylko marki należące do firmy OBECNIE (nie sprzedane, nie wygaszone).
3. Nie wpisuj nazwy samej firmy jako marki (jest już w wyszukiwarce).
   Wyjątek: gdy firma i flagowa marka nazywają się tak samo, ale firma ma
   też inne marki — wtedy wpisz wszystkie łącznie z flagową.
4. Marki, nie warianty produktów: „Tymbark" tak, „Tymbark jabłko-mięta" nie.
5. Domena strony marki (pole "domain"): tylko jeśli znasz oficjalną stronę
   marki (np. tymbark.com, kubus.pl). Format: sama domena, bez https:// i www.
   Nie zgaduj domen — jeśli nie masz pewności, pomiń pole "domain".
6. Firma bez znanych marek konsumenckich (np. spółka B2B) → pomiń ją
   (nie generuj UPDATE) i wypisz w sekcji pominiętych.

FORMAT WYNIKU — dla każdej firmy jeden UPDATE SQL, dokładnie w tym wzorcu:

update companies set
  brand_aliases = 'Tymbark, Kubuś, Lubella',
  brands = '[{"name":"Tymbark","domain":"tymbark.com"},{"name":"Kubuś","domain":"kubus.pl"},{"name":"Lubella"}]'::jsonb
where id = 'f271e51d-cb55-4130-9a8f-23aca93b1531';

Wymagania techniczne:
- `brand_aliases`: te same nazwy co w `brands`, rozdzielone przecinkiem i spacją.
- W `where` użyj `id` przepisanego DOKŁADNIE z danych wejściowych (pierwsza
  kolumna, UUID) — nigdy nie dopasowuj po slugu ani nazwie.
- Apostrofy w nazwach escapuj podwójnie ('' zamiast ').
- Wszystkie UPDATE-y podaj w jednym bloku kodu SQL, bez komentarzy między nimi.
- Po bloku SQL dodaj sekcję „Pominięte:" z listą firm bez UPDATE i powodem
  (jedna linia na firmę).

DANE WEJŚCIOWE (id | slug | nazwa):

[TU WKLEJ PARTIĘ ~25 FIRM Z docs/marki-partie.md]
