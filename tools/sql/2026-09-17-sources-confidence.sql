-- Źródła i pewność klasyfikacji dla rekordów dodawanych przez automat (tools/firmy/).
-- Uruchom w Supabase SQL Editor. Obie kolumny opcjonalne: import.mjs wykrywa ich brak
-- i wtedy zapisuje rekord bez nich (źródła zostają tylko w pliku partii).
alter table companies add column if not exists sources jsonb;
alter table companies add column if not exists confidence text;

comment on column companies.sources is 'Lista źródeł [{url, tytul, data, czego_dotyczy}] potwierdzających strukturę właścicielską (automat tools/firmy/).';
comment on column companies.confidence is 'Pewność klasyfikacji w chwili weryfikacji: WYSOKA | SREDNIA | KONFLIKT (rozstrzygnięty ręcznie).';
