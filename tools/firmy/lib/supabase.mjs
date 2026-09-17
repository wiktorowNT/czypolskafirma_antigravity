// Dostęp do Supabase przez REST. Odczyt kluczem anon (publicznym), zapis wyłącznie
// kluczem service_role z .env.local i wyłącznie z import.mjs.
import { wczytajEnv, wymagaj } from "./env.mjs";

function naglowki(klucz, dodatkowe = {}) {
  return { apikey: klucz, Authorization: `Bearer ${klucz}`, "Content-Type": "application/json", ...dodatkowe };
}

function bazaUrl() {
  return wymagaj("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
}

export async function odczyt(sciezka, opcje = {}) {
  const klucz = wymagaj("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const r = await fetch(`${bazaUrl()}/rest/v1/${sciezka}`, { headers: naglowki(klucz, opcje.headers || {}) });
  const tekst = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status} przy ${sciezka.split("?")[0]}: ${tekst.slice(0, 200)}`);
  return { dane: tekst ? JSON.parse(tekst) : null, zakres: r.headers.get("content-range") };
}

export async function kategorie() {
  const { dane } = await odczyt("categories?select=id,name,slug&order=name");
  return dane;
}

const KOLUMNY_INDEKSU = "id,slug,name,display_name,nip,krs,country_code,owner_name,brand_aliases,category_id,verified_at,website_url";

// Cała baza w lekkim widoku, do deduplikacji i porównań (750 wierszy to kilkaset KB).
export async function indeksFirm() {
  const wynik = [];
  for (let od = 0; ; od += 1000) {
    const { dane } = await odczyt(`companies?select=${KOLUMNY_INDEKSU}&order=slug`, { headers: { Range: `${od}-${od + 999}` } });
    wynik.push(...dane);
    if (dane.length < 1000) break;
  }
  return wynik;
}

export async function firmaPoSlugu(slug) {
  const { dane } = await odczyt(`companies?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return dane?.[0] || null;
}

export async function firmaPoNip(nip) {
  const { dane } = await odczyt(`companies?select=*&nip=eq.${encodeURIComponent(nip)}&limit=1`);
  return dane?.[0] || null;
}

export async function wszystkieFirmyPelne() {
  const wynik = [];
  for (let od = 0; ; od += 1000) {
    const { dane } = await odczyt(`companies?select=*&order=slug`, { headers: { Range: `${od}-${od + 999}` } });
    wynik.push(...dane);
    if (dane.length < 1000) break;
  }
  return wynik;
}

// ---- zapis (tylko import.mjs) ----

export function kluczZapisu() {
  const env = wczytajEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Brak SUPABASE_SERVICE_ROLE_KEY w .env.local (potrzebny tylko do importu).");
  return env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function wstaw(tabela, wiersz) {
  const r = await fetch(`${bazaUrl()}/rest/v1/${tabela}`, {
    method: "POST",
    headers: naglowki(kluczZapisu(), { Prefer: "return=representation" }),
    body: JSON.stringify(wiersz),
  });
  const tekst = await r.text();
  if (!r.ok) return { blad: `${r.status} ${tekst.slice(0, 300)}` };
  return { dane: JSON.parse(tekst)[0] };
}

export async function aktualizuj(tabela, id, zmiany) {
  const r = await fetch(`${bazaUrl()}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: naglowki(kluczZapisu(), { Prefer: "return=representation" }),
    body: JSON.stringify(zmiany),
  });
  const tekst = await r.text();
  if (!r.ok) return { blad: `${r.status} ${tekst.slice(0, 300)}` };
  return { dane: JSON.parse(tekst)[0] };
}

// Czy kolumna istnieje (np. sources/confidence przed migracją).
export async function kolumnaIstnieje(tabela, kolumna) {
  const klucz = wymagaj("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const r = await fetch(`${bazaUrl()}/rest/v1/${tabela}?select=${kolumna}&limit=1`, { headers: naglowki(klucz) });
  return r.ok;
}
