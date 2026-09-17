# tools/archiwum

Jednorazowe skrypty migracyjne, wykonane w lipcu 2026 (normalizacja slugów, kolumna
`display_name`, optymalizacja grafik strony). Zostawione dla historii i dla słownika
`CORRECTIONS` w `gen-display-name-sql.mjs` (ok. 150 zweryfikowanych nazw marek), z którego
może korzystać automat `tools/firmy/`. Nie uruchamiać ponownie bez powodu: `--apply`
zapisuje do bazy.

Usunięte 2026-09-17 jako martwe: `check-partial.mjs`, `check_duplicates.mjs`,
`fixer-server.mjs` + `logo-fixer-standalone.html` (zastąpione przez `/narzedzia/logo-fixer`),
`pipeline-v2.html` (zastąpiony przez automat), `scripts/archiwum/` i `build_*.js`
(stare klucze Supabase, unieważnione przy rotacji kluczy 17.09.2026), `temp.tsx`.
