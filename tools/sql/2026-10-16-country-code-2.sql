-- Drugi kraj kapitału przy wspólnej kontroli 50/50 (październik 2026).
-- Np. joint venture 50% Niemcy + 50% Szwajcaria: country_code = 'DE', country_code_2 = 'CH'.
-- country_code zostaje krajem „głównym” (statystyki, filtry, werdykt polska/zagraniczna),
-- country_code_2 tylko dopisuje drugą flagę i opis „wspólna kontrola” na stronie.
-- Przy JV 50/50 PL–zagranica: country_code = kraj zagraniczny, country_code_2 = 'PL'
-- (reguła B5 metodologii: brak polskiej kontroli → status zagraniczna).
--
-- Uruchom RAZ w Supabase: SQL Editor → wklej → Run. Musi być wykonane, zanim kod strony
-- czytający country_code_2 trafi na podgląd/produkcję (inaczej zapytania zwrócą błąd).

alter table public.companies
  add column if not exists country_code_2 text;

alter table public.companies
  drop constraint if exists companies_country_code_2_rozny;
alter table public.companies
  add constraint companies_country_code_2_rozny
  check (country_code_2 is null or upper(country_code_2) <> upper(coalesce(country_code, '')));

comment on column public.companies.country_code_2 is
  'Drugi kraj kapitału przy wspólnej kontroli 50/50 (ISO 3166-1 alpha-2). NULL = jeden kraj.';
