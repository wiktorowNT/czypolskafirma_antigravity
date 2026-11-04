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

// Firmy zaimportowane w panelu, ale jeszcze nieopublikowane na czypolskafirma.pl
// (published = false, widać je tylko na podglądzie). null = brak kolumny published w bazie.
export async function nieopublikowaneFirmy() {
  if (!(await kolumnaIstnieje("companies", "published"))) return null;
  const { dane } = await odczyt("companies?select=id,slug,name,display_name,country_code,owner_name&published=eq.false&order=name");
  return dane;
}

// Czy kolumna istnieje (np. sources/confidence przed migracją).
export async function kolumnaIstnieje(tabela, kolumna) {
  const klucz = wymagaj("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const r = await fetch(`${bazaUrl()}/rest/v1/${tabela}?select=${kolumna}&limit=1`, { headers: naglowki(klucz) });
  return r.ok;
}

// ---- kolejka re-weryfikacji (.github/workflows/reweryfikacja.yml) ----

// Typy własności, w których struktura zmienia się najczęściej: przejęcia spółek giełdowych
// i wyjścia funduszy z portfela. Dostają premię do wieku, więc wracają na początek
// kolejki szybciej niż firma rodzinna czy spółdzielnia.
export const TYPY_PRIORYTETOWE = ["korporacja_gieldowa", "fundusz_pe_vc"];

// Premia w dniach dla typów priorytetowych: spółka giełdowa sprawdzona miesiąc temu
// konkuruje z firmą rodzinną sprawdzoną dwa miesiące temu.
//
// WAŻNE: premia musi być wyraźnie mniejsza od naturalnego cyklu (liczba firm w bazie
// podzielona przez liczbę firm na noc, dziś 1555/35 = 45 nocy). Powyżej tej granicy
// typy priorytetowe wracają na wierzch, zanim kolejka obejdzie resztę bazy, i ogon
// kolejki głodzi: symulacja na 1555 firmach dawała przy premii 90 dni pełny cykl
// 105 nocy zamiast 55 i najstarszy rekord 123 dni zamiast 63.
// Zmieniasz liczbę firm na noc? Sprawdź tę zależność ponownie.
export const PREMIA_DNI = 30;

// Wiek rekordu bez daty weryfikacji. Dowolnie duży, ale skończony, żeby premia dalej
// porządkowała rekordy wewnątrz tej grupy. Żadna prawdziwa data nie da takiego wyniku.
const WIEK_BEZ_DATY = 100000;

const KOLUMNY_REWERYFIKACJI = "id,slug,name,display_name,nip,krs,country_code,owner_name,ownership_type,verified_at";

// Wiek rekordu w dniach, z premią dla typów priorytetowych.
export function wiekRekordu(firma, opcje = {}) {
  const premiaDni = opcje.premiaDni ?? PREMIA_DNI;
  const teraz = opcje.dzien instanceof Date ? opcje.dzien : new Date();
  const premia = TYPY_PRIORYTETOWE.includes(firma.ownership_type) ? premiaDni : 0;
  const t = firma.verified_at ? Date.parse(firma.verified_at) : NaN;
  if (Number.isNaN(t)) return WIEK_BEZ_DATY + premia;
  return Math.floor((teraz.getTime() - t) / 86400000) + premia;
}

// Kolejność: najstarsze (albo nigdy nie weryfikowane) na wierzchu. Slug rozstrzyga remisy,
// żeby ta sama baza zawsze dawała tę samą kolejkę.
export function kolejkaReweryfikacji(firmy, opcje = {}) {
  return firmy
    .map((f) => ({ ...f, wiekDni: wiekRekordu(f, opcje) }))
    .sort((a, b) => b.wiekDni - a.wiekDni || String(a.slug).localeCompare(String(b.slug), "pl"));
}

// Cała baza w widoku potrzebnym do kolejki, już uszeregowana. Tylko odczyt kluczem anon.
export async function firmyDoReweryfikacji(opcje = {}) {
  const wszystkie = [];
  for (let od = 0; ; od += 1000) {
    const { dane } = await odczyt(`companies?select=${KOLUMNY_REWERYFIKACJI}&order=slug`, { headers: { Range: `${od}-${od + 999}` } });
    wszystkie.push(...dane);
    if (dane.length < 1000) break;
  }
  return kolejkaReweryfikacji(wszystkie, opcje);
}
