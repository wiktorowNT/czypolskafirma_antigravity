-- Statystyki serwisu liczone po stronie Postgresa (listopad 2026).
--
-- PROBLEM: instancja ma `db-max-rows = 1000`. /api/stats pobierało wszystkie firmy
-- jednym zapytaniem i liczyło `total = companies.length`, więc przy 1555 firmach
-- publikowało total = 1000, polishPercentage policzony na obciętej próbce i liczbę
-- krajów z pierwszych 1000 wierszy. Agregat po stronie bazy nie ma tego problemu:
-- COUNT liczy po całej tabeli niezależnie od db-max-rows, a wraca jeden wiersz.
--
-- Funkcja zwraca gotowy obiekt JSON w tym samym kształcie, jaki /api/stats oddaje
-- na zewnątrz (total, polishCount, foreignCount, polishPercentage, countryCount,
-- categories[], mostPolishCategory, leastPolishCategory). Metodologia jest
-- przeniesiona 1:1 z dotychczasowego kodu JS — to naprawa liczenia, nie zmiana
-- definicji: polska firma = country_code = 'PL', kategorie z min. 3 firmami,
-- firmy bez kategorii trafiają do kubełka „Inne".
--
-- `pokaz_nieopublikowane` odpowiada lib/publikacja.ts: false (produkcja) liczy tylko
-- published = true, true (podgląd develop / localhost) liczy wszystko.
--
-- Uruchom RAZ w Supabase: SQL Editor → wklej → Run. Do tego czasu /api/stats
-- działa na stronicowanym fallbacku w kodzie (lib/companies-paged.ts), więc liczby
-- są poprawne również przed wklejeniem — RPC tylko zdejmuje robotę z Vercela.

-- Celowo BEZ `security definer`: funkcja działa z uprawnieniami wywołującego (anon),
-- więc widzi dokładnie te same wiersze co dzisiejsze odczyty REST — respektuje grants
-- i polityki RLS na `companies`. Dzięki temu RPC nie może pokazać więcej niż zwykły
-- odczyt i nie obchodzi filtra publikacji.
create or replace function public.get_company_stats(pokaz_nieopublikowane boolean default false)
returns jsonb
language sql
stable
as $$
  with widoczne as (
    select c.country_code, c.category_id
    from public.companies c
    where pokaz_nieopublikowane or c.published is true
  ),
  ogolne as (
    select
      count(*)::int as total,
      count(*) filter (where country_code = 'PL')::int as polish,
      -- filter(Boolean) w JS odrzucał null i pusty string — tu to samo.
      count(distinct country_code) filter (where country_code is not null and country_code <> '')::int as kraje
    from widoczne
  ),
  po_kategoriach as (
    select
      coalesce(kat.name, 'Inne') as name,
      coalesce(kat.slug, 'inne') as slug,
      count(*)::int as total,
      count(*) filter (where w.country_code = 'PL')::int as polish
    from widoczne w
    left join public.categories kat on kat.id = w.category_id
    group by 1, 2
    having count(*) >= 3          -- próg z dotychczasowego kodu: min. 3 firmy w kategorii
  ),
  -- Kategorie z policzonym udziałem. Kolejność nadajemy niżej, w jsonb_agg / limit 1:
  -- `order by` wewnątrz CTE nie jest gwarantowane dla agregatu w zapytaniu nadrzędnym.
  -- Tiebreaker (total, name) daje stabilny wynik, żeby „najbardziej/najmniej polska
  -- kategoria" nie skakała między odświeżeniami przy równym procencie.
  wyliczone as (
    select
      name, slug, total, polish,
      round(polish * 100.0 / total)::int as "polishPercentage"
    from po_kategoriach
  )
  select jsonb_build_object(
    'total', o.total,
    'polishCount', o.polish,
    'foreignCount', o.total - o.polish,
    'polishPercentage', case when o.total > 0 then round(o.polish * 100.0 / o.total)::int else 0 end,
    'countryCount', o.kraje,
    'categories', coalesce(
      (select jsonb_agg(to_jsonb(p) order by p."polishPercentage" desc, p.total desc, p.name asc)
       from wyliczone p),
      '[]'::jsonb
    ),
    'mostPolishCategory', (
      select to_jsonb(p) from wyliczone p
      order by p."polishPercentage" desc, p.total desc, p.name asc
      limit 1
    ),
    'leastPolishCategory', (
      select to_jsonb(p) from wyliczone p
      order by p."polishPercentage" asc, p.total asc, p.name desc
      limit 1
    )
  )
  from ogolne o;
$$;

comment on function public.get_company_stats(boolean) is
  'Statystyki dla /api/stats jednym zapytaniem. Istnieje, bo db-max-rows = 1000 ucinał odczyt wszystkich firm (1555 w bazie) i zafałszowywał publikowane liczby.';

-- Trasa /api/stats woła RPC kluczem anon.
grant execute on function public.get_company_stats(boolean) to anon, authenticated;
