#!/usr/bin/env node
// Import zatwierdzonych rekordów z partii do Supabase. Domyślnie DRY-RUN: pokazuje, co by zrobił.
//   node tools/firmy/import.mjs --partia 2026-09-17            (próbnie)
//   node tools/firmy/import.mjs --partia 2026-09-17 --apply    (zapis; najpierw robi backup)
//   node tools/firmy/import.mjs --partia X --apply --bez-backupu
// Do bazy trafiają wyłącznie firmy z decyzja = "zatwierdzony". Firma już istniejąca (po NIP lub
// slugu) jest AKTUALIZOWANA tylko w polach właścicielskich i opisowych; nic nie jest kasowane.
// Wygodniej: node tools/firmy/panel.mjs → zakładka "Import do bazy".
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATALOG_PARTII } from "./lib/env.mjs";
import { kontekstImportu, wykonajPlan, zbudujPlan } from "./lib/import-lib.mjs";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : null; };
const nazwa = opt("partia");
if (!nazwa) { console.error("Podaj --partia NAZWA"); process.exit(1); }
const APPLY = !!opt("apply");
const PLIK = path.join(KATALOG_PARTII, `partia-${nazwa}.json`);
const partia = JSON.parse(fs.readFileSync(PLIK, "utf8"));
const ctx = await kontekstImportu();
if (!ctx.maSources || !ctx.maConfidence) console.log(`Uwaga: brak kolumn ${[!ctx.maSources && "sources", !ctx.maConfidence && "confidence"].filter(Boolean).join(", ")} w tabeli companies. Uruchom tools/sql/2026-09-17-sources-confidence.sql, inaczej źródła zostaną tylko w pliku partii.`);

const plan = zbudujPlan(partia, ctx);

console.log(`Partia ${nazwa}: ${plan.length} zatwierdzonych rekordów (${plan.filter((p) => p.akcja === "INSERT").length} nowych, ${plan.filter((p) => p.akcja === "UPDATE").length} aktualizacji). Tryb: ${APPLY ? "ZAPIS" : "próbny (dry-run)"}\n`);
for (const p of plan) {
  const w = p.wiersz;
  console.log(`${p.akcja}  ${p.nazwa}${p.slugWBazie ? ` (w bazie: ${p.slugWBazie})` : ""}`);
  console.log(`        ${w.country_code} · ${w.owner_name} · NIP ${w.nip || "(bez zmian)"} · kategoria ${p.kategoria || "(bez zmian)"}`);
  if (p.bylo && (p.bylo.country_code !== w.country_code || p.bylo.owner_name !== w.owner_name)) console.log(`        było: ${p.bylo.country_code} · ${p.bylo.owner_name}`);
  for (const b of p.bledy) console.log(`        BŁĄD: ${b}`);
  for (const o of p.ostrzezenia) console.log(`        uwaga: ${o}`);
}
const zBledami = plan.filter((p) => p.bledy.length);
if (zBledami.length) console.log(`\n${zBledami.length} rekord(y) z błędami zostaną pominięte.`);
if (!APPLY) {
  console.log(`\nTo był tryb próbny. Zapis: node tools/firmy/import.mjs --partia ${nazwa} --apply`);
  process.exit(0);
}
if (!opt("bez-backupu")) {
  const b = spawnSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), "backup.mjs")], { stdio: "inherit" });
  if (b.status !== 0) { console.error("Backup nie powiódł się, przerywam import."); process.exit(1); }
}
const { ok, zle } = await wykonajPlan(plan, partia, PLIK, {
  naWpis: (w) => console.log(w.blad ? `✘ ${w.nazwa}: ${w.blad}` : `✔ ${w.nazwa}: ${w.akcja} ${w.slug || ""}`),
});
console.log(`\nZaimportowano ${ok}, błędów ${zle}.`);
if (ok) console.log(`Następne kroki (logotypy nowych firm):\n  node tools/fetch-logos.mjs\n  node tools/generate-og-assets.mjs logos\nProfil odświeża się z cache w ciągu godziny.`);
