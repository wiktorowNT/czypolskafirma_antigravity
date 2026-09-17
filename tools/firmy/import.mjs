#!/usr/bin/env node
// Import zatwierdzonych rekordów z partii do Supabase. Domyślnie DRY-RUN: pokazuje, co by zrobił.
//   node tools/firmy/import.mjs --partia 2026-09-17            (próbnie)
//   node tools/firmy/import.mjs --partia 2026-09-17 --apply    (zapis; najpierw robi backup)
//   node tools/firmy/import.mjs --partia X --apply --bez-backupu
// Do bazy trafiają wyłącznie firmy z decyzja = "zatwierdzony". Firma już istniejąca (po NIP lub
// slugu) jest AKTUALIZOWANA tylko w polach właścicielskich i opisowych; nic nie jest kasowane.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATALOG_PARTII, dzisiaj } from "./lib/env.mjs";
import { aktualizuj, indeksFirm, kategorie as pobierzKategorie, kolumnaIstnieje, wstaw } from "./lib/supabase.mjs";
import { normalizujNip, slugify } from "./lib/tekst.mjs";
import { walidujRekord } from "./lib/walidacja.mjs";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : null; };
const nazwa = opt("partia");
if (!nazwa) { console.error("Podaj --partia NAZWA"); process.exit(1); }
const APPLY = !!opt("apply");
const PLIK = path.join(KATALOG_PARTII, `partia-${nazwa}.json`);
const partia = JSON.parse(fs.readFileSync(PLIK, "utf8"));
const kategorie = await pobierzKategorie();
const indeks = await indeksFirm();
const maSources = await kolumnaIstnieje("companies", "sources");
const maConfidence = await kolumnaIstnieje("companies", "confidence");
if (!maSources || !maConfidence) console.log(`Uwaga: brak kolumn ${[!maSources && "sources", !maConfidence && "confidence"].filter(Boolean).join(", ")} w tabeli companies. Uruchom tools/sql/2026-09-17-sources-confidence.sql, inaczej źródła zostaną tylko w pliku partii.`);

// Pola, które automat może ustawić przy INSERT i które nadpisuje przy UPDATE.
const POLA_INSERT = ["name", "slug", "display_name", "nip", "krs", "country_code", "owner_name", "ownership_description", "business_description", "website_url", "registry_url", "category_id", "adres", "siedziba_pl", "vat_czynny", "ownership_type", "parent_company_name", "brand_aliases", "brands", "verified_at"];
const POLA_UPDATE = ["country_code", "owner_name", "ownership_description", "business_description", "verified_at", "krs", "registry_url", "ownership_type", "parent_company_name"];

const plan = [];
for (const f of partia.firmy) {
  if (f.decyzja !== "zatwierdzony" || !f.rekord) continue;
  const r = { ...f.rekord };
  const kat = kategorie.find((k) => k.slug === r.category_slug);
  r.category_id = kat?.id || r.category_id || null;
  const w = walidujRekord(r, kategorie);
  const istnieje = indeks.find((x) => (r.nip && normalizujNip(x.nip) === normalizujNip(r.nip)) || slugify(x.slug) === r.slug || (f.tozsamosc?.istniejeWBazie?.id && x.id === f.tozsamosc.istniejeWBazie.id));
  const wiersz = {};
  for (const p of istnieje ? POLA_UPDATE : POLA_INSERT) if (r[p] !== undefined) wiersz[p] = r[p];
  if (!istnieje && !wiersz.category_id) w.bledy.push("brak category_id (wybierz kategorię w przeglądzie)");
  if (maSources) wiersz.sources = r.sources || [];
  if (maConfidence) wiersz.confidence = r.confidence || f.status || null;
  if (istnieje && !istnieje.display_name && r.display_name) wiersz.display_name = r.display_name;
  if (istnieje && !istnieje.brand_aliases && r.brand_aliases) { wiersz.brand_aliases = r.brand_aliases; wiersz.brands = r.brands; }
  plan.push({ nazwa: f.nazwa, akcja: istnieje ? "UPDATE" : "INSERT", id: istnieje?.id || null, slugWBazie: istnieje?.slug || null, wiersz, bledy: w.bledy, ostrzezenia: w.ostrzezenia, bylo: istnieje ? { country_code: istnieje.country_code, owner_name: istnieje.owner_name } : null });
}

console.log(`Partia ${nazwa}: ${plan.length} zatwierdzonych rekordów (${plan.filter((p) => p.akcja === "INSERT").length} nowych, ${plan.filter((p) => p.akcja === "UPDATE").length} aktualizacji). Tryb: ${APPLY ? "ZAPIS" : "próbny (dry-run)"}\n`);
for (const p of plan) {
  const w = p.wiersz;
  console.log(`${p.akcja}  ${p.nazwa}${p.slugWBazie ? ` (w bazie: ${p.slugWBazie})` : ""}`);
  console.log(`        ${w.country_code} · ${w.owner_name} · NIP ${w.nip || "(bez zmian)"} · kategoria ${p.wiersz.category_id ? kategorie.find((k) => k.id === p.wiersz.category_id)?.slug : "(bez zmian)"}`);
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
let ok = 0, zle = 0;
for (const p of plan) {
  if (p.bledy.length) continue;
  const r = p.akcja === "INSERT" ? await wstaw("companies", p.wiersz) : await aktualizuj("companies", p.id, p.wiersz);
  const f = partia.firmy.find((x) => x.nazwa === p.nazwa);
  if (r.blad) { zle++; f.import = { blad: r.blad, data: dzisiaj() }; console.log(`✘ ${p.nazwa}: ${r.blad}`); }
  else { ok++; f.import = { akcja: p.akcja, id: r.dane?.id, data: dzisiaj() }; f.decyzja = "zaimportowany"; console.log(`✔ ${p.nazwa}: ${p.akcja} ${r.dane?.slug || ""}`); }
}
fs.writeFileSync(PLIK, JSON.stringify(partia, null, 2), "utf8");
console.log(`\nZaimportowano ${ok}, błędów ${zle}.`);
if (ok) console.log(`Następne kroki (logotypy nowych firm):\n  node tools/fetch-logos.mjs\n  node tools/generate-og-assets.mjs logos\nProfil odświeża się z cache w ciągu godziny.`);
