-- Migracja 2/2: marki firmy z domenami (do wyświetlania logotypów na profilu).
-- Uruchom w Supabase: Dashboard -> SQL Editor -> wklej -> Run.
-- (Uzupełnia migrację 2026-07-18-brand-aliases.sql, która dodała brand_aliases.)
--
-- Format: tablica JSON obiektów {"name": "...", "domain": "..."}, np.:
--   [{"name":"Tymbark","domain":"tymbark.com"},{"name":"Kubuś","domain":"kubus.pl"}]
-- "domain" jest opcjonalny — marka bez domeny wyświetli się jako pigułka
-- tekstowa, marka z domeną dostanie logo (ten sam mechanizm co loga firm:
-- lokalny plik -> Brandfetch CDN -> awatar z literą).
--
-- Kod na stronie działa też BEZ tej kolumny (fallback na brand_aliases).

alter table companies
  add column if not exists brands jsonb;

comment on column companies.brands is
  'Marki konsumenckie firmy: [{"name":"Tymbark","domain":"tymbark.com"}]. Wyświetlane z logotypami na profilu; do wyszukiwarki służy brand_aliases.';
