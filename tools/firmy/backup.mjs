#!/usr/bin/env node
// Eksport całej tabeli companies (i categories) do pliku JSON z datą.
// Domyślnie do data/robocze/backup/ (poza gitem). Można wskazać folder na Dysku Google.
//   node tools/firmy/backup.mjs
//   node tools/firmy/backup.mjs --do "G:\Mój dysk\zapisy supabase czypolskafirma"
// Odtwarzanie: import.mjs nie odtwarza backupu; do tego służy TablePlus/SQL. Ten plik to
// kopia bezpieczeństwa danych, z której da się odbudować tabelę wierszami.
import fs from "node:fs";
import path from "node:path";
import { KATALOG_REPO, dzisiaj } from "./lib/env.mjs";
import { kategorie, wszystkieFirmyPelne } from "./lib/supabase.mjs";

const args = process.argv.slice(2);
const idx = args.indexOf("--do");
const katalog = idx >= 0 && args[idx + 1] ? args[idx + 1] : path.join(KATALOG_REPO, "data", "robocze", "backup");
fs.mkdirSync(katalog, { recursive: true });

const firmy = await wszystkieFirmyPelne();
const kat = await kategorie();
const plik = path.join(katalog, `companies-${dzisiaj()}.json`);
fs.writeFileSync(plik, JSON.stringify({ wykonano: new Date().toISOString(), liczbaFirm: firmy.length, categories: kat, companies: firmy }, null, 1), "utf8");
console.log(`Backup: ${firmy.length} firm, ${kat.length} kategorii → ${plik} (${Math.round(fs.statSync(plik).size / 1024)} KB)`);
