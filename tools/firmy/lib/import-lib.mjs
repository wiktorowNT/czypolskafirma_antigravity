// Budowa planu importu i jego wykonanie. Używane przez import.mjs (wiersz poleceń)
// i panel.mjs (zakładka "Import do bazy"). Zapis do Supabase wyłącznie stąd.
import fs from "node:fs";
import { dzisiaj } from "./env.mjs";
import { aktualizuj, indeksFirm, kategorie as pobierzKategorie, kolumnaIstnieje, wstaw } from "./supabase.mjs";
import { normalizujNip, podobienstwoNazw, slugify } from "./tekst.mjs";
import { walidujRekord } from "./walidacja.mjs";

// Pola, które automat może ustawić przy INSERT i które nadpisuje przy UPDATE.
export const POLA_INSERT = ["name", "slug", "display_name", "nip", "krs", "country_code", "owner_name", "ownership_description", "business_description", "website_url", "registry_url", "category_id", "adres", "siedziba_pl", "vat_czynny", "ownership_type", "parent_company_name", "brand_aliases", "brands", "verified_at"];
export const POLA_UPDATE = ["country_code", "owner_name", "ownership_description", "business_description", "verified_at", "krs", "registry_url", "ownership_type", "parent_company_name"];

export async function kontekstImportu() {
  const [kategorie, indeks, maSources, maConfidence] = await Promise.all([
    pobierzKategorie(),
    indeksFirm(),
    kolumnaIstnieje("companies", "sources"),
    kolumnaIstnieje("companies", "confidence"),
  ]);
  return { kategorie, indeks, maSources, maConfidence };
}

// Jedna spółka może prowadzić kilka marek (np. Sweet Gallery: Lodolandia, Bafra Kebab,
// Kołacz na Okrągło). Każda marka jest w bazie osobnym wierszem, więc sam zgodny NIP nie
// wystarczy, żeby uznać rekord za "ten sam" — inaczej druga marka nadpisałaby pierwszą.
function znajdzWBazie(r, f, indeks) {
  const poId = f.tozsamosc?.istniejeWBazie?.id ? indeks.find((x) => x.id === f.tozsamosc.istniejeWBazie.id) : null;
  if (poId) return { rekord: poId, jak: "id" };
  const poSlugu = indeks.find((x) => slugify(x.slug) === r.slug);
  if (poSlugu) return { rekord: poSlugu, jak: "slug" };
  const poNip = r.nip ? indeks.filter((x) => normalizujNip(x.nip) === normalizujNip(r.nip)) : [];
  for (const kandydat of poNip) {
    const nazwy = [kandydat.name, kandydat.display_name, ...String(kandydat.brand_aliases || "").split(",")].filter(Boolean);
    if (nazwy.some((n) => podobienstwoNazw(n, r.display_name || r.name) >= 0.6)) return { rekord: kandydat, jak: "nip" };
  }
  // NIP już jest w bazie, ale pod inną marką: nowa firma, z ostrzeżeniem do przejrzenia.
  return { rekord: null, innaMarkaTejSpolki: poNip.map((x) => x.slug) };
}

export function zbudujPlan(partia, { kategorie, indeks, maSources, maConfidence }) {
  const plan = [];
  for (const f of partia.firmy) {
    if (f.decyzja !== "zatwierdzony" || !f.rekord) continue;
    const r = { ...f.rekord };
    const kat = kategorie.find((k) => k.slug === r.category_slug);
    r.category_id = kat?.id || r.category_id || null;
    const w = walidujRekord(r, kategorie);
    const dopasowanie = znajdzWBazie(r, f, indeks);
    const istnieje = dopasowanie.rekord;
    if (dopasowanie.innaMarkaTejSpolki?.length) w.ostrzezenia.push(`ten NIP ma już w bazie inną markę tej samej spółki (${dopasowanie.innaMarkaTejSpolki.join(", ")}) — zostanie dodana jako nowa firma`);
    const wiersz = {};
    for (const p of istnieje ? POLA_UPDATE : POLA_INSERT) if (r[p] !== undefined) wiersz[p] = r[p];
    if (!istnieje && !wiersz.category_id) w.bledy.push("brak category_id (wybierz kategorię w przeglądzie)");
    if (maSources) wiersz.sources = r.sources || [];
    if (maConfidence) wiersz.confidence = r.confidence || f.status || null;
    if (istnieje && !istnieje.display_name && r.display_name) wiersz.display_name = r.display_name;
    if (istnieje && !istnieje.brand_aliases && r.brand_aliases) { wiersz.brand_aliases = r.brand_aliases; wiersz.brands = r.brands; }
    plan.push({
      nazwa: f.nazwa,
      akcja: istnieje ? "UPDATE" : "INSERT",
      id: istnieje?.id || null,
      slugWBazie: istnieje?.slug || null,
      kategoria: kategorie.find((k) => k.id === wiersz.category_id)?.name || null,
      nipRekordu: r.nip || null,
      wiersz,
      bledy: w.bledy,
      ostrzezenia: w.ostrzezenia,
      bylo: istnieje ? { country_code: istnieje.country_code, owner_name: istnieje.owner_name } : null,
    });
  }
  // Marki tej samej spółki wewnątrz jednej partii: informacja, nie błąd.
  const poNip = new Map();
  for (const p of plan) if (p.nipRekordu) poNip.set(p.nipRekordu, [...(poNip.get(p.nipRekordu) || []), p]);
  for (const grupa of poNip.values()) {
    if (grupa.length < 2) continue;
    for (const p of grupa) p.ostrzezenia.push(`ta sama spółka co: ${grupa.filter((x) => x !== p).map((x) => x.nazwa).join(", ")} (jedna spółka, kilka marek)`);
  }
  return plan;
}

/** Zapis do bazy. Backup wykonuje wołający (panel albo import.mjs) przed wywołaniem. */
export async function wykonajPlan(plan, partia, plikPartii, { naWpis } = {}) {
  let ok = 0;
  let zle = 0;
  for (const p of plan) {
    if (p.bledy.length) continue;
    const r = p.akcja === "INSERT" ? await wstaw("companies", p.wiersz) : await aktualizuj("companies", p.id, p.wiersz);
    const f = partia.firmy.find((x) => x.nazwa === p.nazwa);
    if (r.blad) {
      zle++;
      if (f) f.import = { blad: r.blad, data: dzisiaj() };
      naWpis?.({ nazwa: p.nazwa, blad: r.blad });
    } else {
      ok++;
      if (f) { f.import = { akcja: p.akcja, id: r.dane?.id, data: dzisiaj() }; f.decyzja = "zaimportowany"; }
      naWpis?.({ nazwa: p.nazwa, akcja: p.akcja, slug: r.dane?.slug });
    }
  }
  partia.zaktualizowano = new Date().toISOString();
  fs.writeFileSync(plikPartii, JSON.stringify(partia, null, 2), "utf8");
  return { ok, zle };
}
