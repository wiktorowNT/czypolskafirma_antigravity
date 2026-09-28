// Budowa planu importu i jego wykonanie. Używane przez import.mjs (wiersz poleceń)
// i panel.mjs (zakładka "Import do bazy"). Zapis do Supabase wyłącznie stąd.
import fs from "node:fs";
import path from "node:path";
import { KATALOG_PARTII, dzisiaj } from "./env.mjs";
import { aktualizuj, indeksFirm, kategorie as pobierzKategorie, kolumnaIstnieje, wstaw } from "./supabase.mjs";
import { normalizujNip, podobienstwoNazw, slugify } from "./tekst.mjs";
import { walidujRekord } from "./walidacja.mjs";

// Pola, które automat może ustawić przy INSERT i które nadpisuje przy UPDATE.
export const POLA_INSERT = ["name", "slug", "display_name", "nip", "krs", "country_code", "owner_name", "ownership_description", "business_description", "website_url", "registry_url", "category_id", "adres", "founded_at", "siedziba_pl", "vat_czynny", "ownership_type", "parent_company_name", "brand_aliases", "brands", "verified_at"];
export const POLA_UPDATE = ["country_code", "owner_name", "ownership_description", "business_description", "verified_at", "krs", "registry_url", "ownership_type", "parent_company_name"];

export async function kontekstImportu() {
  const [kategorie, indeks, maSources, maConfidence, maPublished] = await Promise.all([
    pobierzKategorie(),
    indeksFirm(),
    kolumnaIstnieje("companies", "sources"),
    kolumnaIstnieje("companies", "confidence"),
    kolumnaIstnieje("companies", "published"),
  ]);
  return { kategorie, indeks, maSources, maConfidence, maPublished };
}

// Jedna spółka może prowadzić kilka marek (np. Sweet Gallery: Lodolandia, Bafra Kebab,
// Kołacz na Okrągło). Każda marka jest w bazie osobnym wierszem, więc sam zgodny NIP nie
// wystarczy, żeby uznać rekord za "ten sam" — inaczej druga marka nadpisałaby pierwszą.
function znajdzWBazie(r, f, indeks) {
  // Rekord znaleziony przy weryfikacji NIP-u bywa inną marką tej samej grupy (Maczfit → Żabka,
  // Uber Eats → Uber). Nadpisujemy go tylko, gdy to ta sama marka albo tryb re-weryfikacji.
  const poId = f.tozsamosc?.istniejeWBazie?.id ? indeks.find((x) => x.id === f.tozsamosc.istniejeWBazie.id) : null;
  // Ta sama marka = ten sam slug albo identyczna nazwa marki ("Bolt" i "Bolt Food" to różne marki).
  const tenSam = (x) => f.tryb === "reweryfikacja" || slugify(x.slug) === r.slug || (x.display_name && slugify(x.display_name) === slugify(r.display_name || r.name));
  if (poId && tenSam(poId)) return { rekord: poId, jak: "id" };
  const poSlugu = indeks.find((x) => slugify(x.slug) === r.slug);
  if (poSlugu) return { rekord: poSlugu, jak: "slug" };
  const poNip = r.nip ? indeks.filter((x) => normalizujNip(x.nip) === normalizujNip(r.nip)) : [];
  for (const kandydat of poNip) {
    // Ten sam NIP to często ta sama spółka z inną marką (Bolt / Bolt Food). Nadpisujemy tylko,
    // gdy marka jest ta sama; marka wymieniona jako alias innego rekordu idzie jako nowa firma.
    if (tenSam(kandydat)) return { rekord: kandydat, jak: "nip" };
  }
  // NIP już jest w bazie, ale pod inną marką: nowa firma, z ostrzeżeniem do przejrzenia.
  return { rekord: null, innaMarkaTejSpolki: [...new Set([...poNip.map((x) => x.slug), ...(poId ? [poId.slug] : [])])] };
}

// Z kolumną published import nie pokazuje niczego na czypolskafirma.pl: nowe firmy trafiają do
// bazy jako nieopublikowane (widać je na podglądzie), a aktualizacje istniejących czekają w pliku
// partii. Jedno i drugie wchodzi na stronę dopiero przez opublikuj() (przycisk w kroku 8 panelu).
export function zbudujPlan(partia, { kategorie, indeks, maSources, maConfidence, maPublished }) {
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
    if (!istnieje && maPublished) wiersz.published = false;
    plan.push({
      nazwa: f.nazwa,
      akcja: istnieje ? "UPDATE" : "INSERT",
      odlozona: !!(istnieje && maPublished),
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
    const f = partia.firmy.find((x) => x.nazwa === p.nazwa);
    if (p.odlozona) {
      // Aktualizacja rekordu, który już jest na stronie: zapis dopiero przy publikacji.
      ok++;
      if (f) { f.import = { akcja: "UPDATE", id: p.id, data: dzisiaj(), czekaNaPublikacje: true, wiersz: p.wiersz }; f.decyzja = "zaimportowany"; }
      naWpis?.({ nazwa: p.nazwa, akcja: "UPDATE, czeka na publikację", slug: p.slugWBazie });
      continue;
    }
    const r = p.akcja === "INSERT" ? await wstaw("companies", p.wiersz) : await aktualizuj("companies", p.id, p.wiersz);
    if (r.blad) {
      zle++;
      if (f) f.import = { blad: r.blad, data: dzisiaj() };
      naWpis?.({ nazwa: p.nazwa, blad: r.blad });
    } else {
      ok++;
      if (f) { f.import = { akcja: p.akcja, id: r.dane?.id, data: dzisiaj(), ...(p.wiersz.published === false ? { czekaNaPublikacje: true } : {}) }; f.decyzja = "zaimportowany"; }
      naWpis?.({ nazwa: p.nazwa, akcja: p.akcja, slug: r.dane?.slug });
    }
  }
  partia.zaktualizowano = new Date().toISOString();
  fs.writeFileSync(plikPartii, JSON.stringify(partia, null, 2), "utf8");
  return { ok, zle };
}

// ---------- publikacja (krok 8 panelu) ----------

function plikiPartii() {
  if (!fs.existsSync(KATALOG_PARTII)) return [];
  return fs.readdirSync(KATALOG_PARTII).filter((p) => /^partia-.+\.json$/.test(p)).map((p) => path.join(KATALOG_PARTII, p));
}

/** Aktualizacje istniejących firm zapisane w krokach 7, które czekają na publikację. */
export function odlozoneAktualizacje() {
  const wynik = [];
  for (const plik of plikiPartii()) {
    let partia;
    try { partia = JSON.parse(fs.readFileSync(plik, "utf8")); } catch { continue; }
    for (const f of partia.firmy || []) {
      if (f.import?.akcja === "UPDATE" && f.import.czekaNaPublikacje && f.import.wiersz) {
        wynik.push({ klucz: `${path.basename(plik)}|${f.nazwa}`, partia: path.basename(plik).replace(/^partia-|\.json$/g, ""), nazwa: f.nazwa, id: f.import.id, kraj: f.import.wiersz.country_code, wlasciciel: f.import.wiersz.owner_name });
      }
    }
  }
  return wynik;
}

/**
 * Wypuszcza na stronę: nowe firmy (published = true) i odłożone aktualizacje (zapis rekordu).
 * idsNowych: id firm z bazy; klucze: "partia-X.json|Nazwa" z odlozoneAktualizacje().
 * Backup przed zapisem aktualizacji robi wołający.
 */
export async function opublikuj({ idsNowych = [], klucze = [], naWpis } = {}) {
  let ok = 0;
  let zle = 0;
  const nowe = new Set();
  for (const id of idsNowych) {
    const r = await aktualizuj("companies", id, { published: true });
    if (r.blad || !r.dane) { zle++; naWpis?.({ blad: r.blad || "nie znaleziono firmy", id }); continue; }
    ok++;
    nowe.add(id);
    naWpis?.({ nazwa: r.dane.display_name || r.dane.name, akcja: "opublikowana" });
  }
  const wybrane = new Set(klucze);
  for (const plik of plikiPartii()) {
    let partia;
    try { partia = JSON.parse(fs.readFileSync(plik, "utf8")); } catch { continue; }
    let zmiana = false;
    for (const f of partia.firmy || []) {
      if (!f.import?.czekaNaPublikacje) continue;
      if (f.import.akcja === "INSERT" && nowe.has(f.import.id)) {
        delete f.import.czekaNaPublikacje;
        f.import.opublikowano = dzisiaj();
        zmiana = true;
      } else if (f.import.akcja === "UPDATE" && wybrane.has(`${path.basename(plik)}|${f.nazwa}`)) {
        const r = await aktualizuj("companies", f.import.id, f.import.wiersz);
        if (r.blad || !r.dane) { zle++; naWpis?.({ nazwa: f.nazwa, blad: r.blad || "nie znaleziono rekordu w bazie" }); continue; }
        ok++;
        delete f.import.czekaNaPublikacje;
        delete f.import.wiersz;
        f.import.opublikowano = dzisiaj();
        zmiana = true;
        naWpis?.({ nazwa: f.nazwa, akcja: "zaktualizowana" });
      }
    }
    if (zmiana) {
      partia.zaktualizowano = new Date().toISOString();
      fs.writeFileSync(plik, JSON.stringify(partia, null, 2), "utf8");
    }
  }
  return { ok, zle };
}
