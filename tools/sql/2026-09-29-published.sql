-- Publikacja firm z panelu (wrzesień 2026).
-- Firmy zaimportowane w Panelu projektu (krok 7) trafiają do bazy z published = false:
-- widać je na podglądzie Vercel (develop), a na czypolskafirma.pl dopiero po kliknięciu
-- „Opublikuj” w panelu (krok 8). Wszystkie obecne firmy dostają true, więc strona się nie zmienia.
--
-- Uruchom RAZ w Supabase: SQL Editor → wklej → Run. Musi być wykonane, zanim kod strony
-- z filtrem published trafi na produkcję (przycisk „Opublikuj” to sprawdza).

alter table public.companies
  add column if not exists published boolean not null default true;

-- Szybkie wyszukanie firm czekających na publikację (zwykle kilkadziesiąt wierszy).
create index if not exists companies_nieopublikowane_idx
  on public.companies (id) where published = false;
