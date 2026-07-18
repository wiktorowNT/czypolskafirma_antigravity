-- Migracja: marki należące do firmy (aliasy wyszukiwania).
-- Uruchom w Supabase: Dashboard -> SQL Editor -> wklej -> Run.
--
-- Format danych: nazwy marek rozdzielone przecinkami, np. dla Kompanii
-- Piwowarskiej: 'Lech, Tyskie, Żubr, Książęce'. Wielkość liter dowolna
-- (wyszukiwanie jest case-insensitive).
--
-- Kod na stronie (wyszukiwarka + sekcja "Marki należące do firmy" na
-- profilu) działa też BEZ tej kolumny — po migracji funkcje włączą się
-- same, bez deployu.

alter table companies
  add column if not exists brand_aliases text;

comment on column companies.brand_aliases is
  'Marki należące do firmy, rozdzielone przecinkami (np. "Lech, Tyskie, Żubr"). Używane w wyszukiwarce i na profilu.';

-- Indeks trigram przyspiesza wyszukiwanie ilike po markach przy większej bazie.
-- Wymaga rozszerzenia pg_trgm (w Supabase zwykle dostępne).
create extension if not exists pg_trgm;
create index if not exists companies_brand_aliases_trgm_idx
  on companies using gin (brand_aliases gin_trgm_ops);

-- Przykładowe uzupełnienie (odkomentuj i dostosuj):
-- update companies set brand_aliases = 'Lech, Tyskie, Żubr, Książęce'
--   where slug ilike '%kompania piwowarska%';
