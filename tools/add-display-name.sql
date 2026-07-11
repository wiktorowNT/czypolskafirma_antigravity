-- tools/add-display-name.sql
-- Dodanie kolumny display_name do tabeli companies (Supabase / Postgres).
--
-- WYKONAJ TO W PANELU SUPABASE (SQL Editor) ZANIM wdrożysz kod używający display_name.
-- Powód: aplikacja SELECT-uje kolumnę display_name; dopóki nie istnieje, zapytania
-- do `companies` zwracają błąd (obsłużony fallbackiem -> pusta lista), więc listy
-- firm byłyby puste. Preview `develop` korzysta z tej samej bazy co produkcja.

-- 1) Kolumna (idempotentnie).
ALTER TABLE companies ADD COLUMN IF NOT EXISTS display_name text;

-- 2) OPCJONALNY wstępny zalążek na podstawie slugów.
--    UWAGA: initcap() daje TYLKO surowy zalążek — nadal "Zabka", "Pko Bp".
--    Realną korektę znanych marek (Żabka, PKO BP, RTV EURO AGD...) zrób ręcznie,
--    najlepiej z CSV wygenerowanego przez: node tools/fill-display-names.mjs
--    Jeśli nie chcesz zalążka, pomiń ten UPDATE — kod i tak zrobi fallback na slug.
--
-- UPDATE companies
-- SET display_name = initcap(replace(slug, '-', ' '))
-- WHERE display_name IS NULL AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$';

-- Kolejność bezpiecznego wdrożenia:
--   1. Wykonaj ALTER TABLE powyżej.
--   2. Wdroż kod (merge develop / build preview).
--   3. Stopniowo wypełniaj display_name dla najważniejszych marek (CSV -> Supabase).
--
-- (Opcjonalnie) aby "Popularne wyszukiwania" na stronie głównej też korzystały
-- z display_name, funkcja RPC get_popular_companies musi zwracać kolumnę display_name.
