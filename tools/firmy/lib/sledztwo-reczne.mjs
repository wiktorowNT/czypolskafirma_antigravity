// Śledztwo w czatach: prompt zbiorczy dla wielu firm naraz, parser wklejonych odpowiedzi,
// porównanie modeli i przyjęcie wybranej wersji do rekordu. Kod nie wywołuje tu żadnego modelu:
// Wiktor wkleja prompt do Gemini / ChatGPT / Claude.ai i wkleja odpowiedź z powrotem do panelu.
import { METODOLOGIA, faktyRejestrowe } from "./prompty.mjs";
import { zlozRekord } from "./rekord.mjs";
import { kodyKrajow, normalizujNazwe, normalizujNip, podobienstwoNazw } from "./tekst.mjs";
import { normalizujKrajOdModelu } from "./walidacja.mjs";

// Firma czeka na czaty: nie pominięta, ma tożsamość (NIP potwierdzony) i nie ma przyjętej wersji.
export const czekaNaCzaty = (f) => !f.pomin && !!f.tozsamosc && !f.sledztwo;

function blokFirmy(f, nr) {
  const t = f.tozsamosc || {};
  const spolka = (f.rejestr && !f.rejestr.blad && f.rejestr.nazwa) || t.mf?.nazwa || t.nazwa_spolki || "?";
  const fakty = faktyRejestrowe({ rejestr: f.rejestr, historiaKrs: f.historiaKrs, gielda: f.gielda, crbr: f.crbr });
  return `### ${nr}. ${f.nazwa}
- marka (wpisz dokładnie tak w polu "marka"): ${f.nazwa}
- spółka: ${spolka}, NIP ${t.nip || "?"}${t.krs ? `, KRS ${t.krs}` : ""}
${fakty.length ? fakty.map((x) => "- " + x).join("\n") : "- rejestry nie dały dodatkowych faktów"}`;
}

export function promptZbiorczy(firmy, { kategorie, dzisiaj }) {
  const kraje = Object.keys(kodyKrajow()).join(", ");
  return `Jesteś analitykiem struktur właścicielskich dla serwisu o pochodzeniu kapitału firm w Polsce. Data dzisiejsza: ${dzisiaj}.
Dla KAŻDEJ z ${firmy.length} firm poniżej ustal ostatecznego właściciela i kraj kapitału, a potem napisz dwa opisy. Użyj wyszukiwania w internecie.

FAKTY Z REJESTRÓW podane przy firmach pobrał program z KRS, CRBR i giełdy. Nie podlegają dyskusji i nie musisz ich szukać. Twoja praca to: kto stoi NAD tymi wspólnikami, aż do szczytu piramidy, ze źródłami.
${METODOLOGIA}

ZASADY PRACY
1. Łańcuch własności od polskiej spółki w górę do ostatecznego właściciela (osoba, rodzina, państwo, korporacja giełdowa z rozproszonym akcjonariatem, zarządzający funduszem). Każde ogniwo: kto posiada poprzednie, % głosów, źródło (URL) i data stanu.
2. Czego nie potwierdzisz w źródle, nie podawaj jako faktu: wpisz do "luki". Nie zmyślaj URL-i; lepiej null niż zgadywany adres.
3. country_code WYŁĄCZNIE z listy: ${kraje}. Raje podatkowe i wehikuły (CY, LU, MT, JE, KY, VG, NL jako holding) nie są krajem kapitału. Nie da się ustalić: pusty tekst i wyjaśnienie w "luki".
4. ownership_description: 3-5 zdań wg schematu KTO kontroluje (z % głosów) → JAK do tego doszło (rok, przejęcia, strony transakcji) → STAN OBECNY → NIUANS (franczyza, fundusz, holding zagraniczny). Ton suchy, encyklopedyczny, liczby i daty tylko ze źródeł z łańcucha. Bez werdyktu "jest polska/zagraniczna". Wzór: "Sieć Biedronka należy do portugalskiej grupy Jerónimo Martins, obecnej w Polsce od 1995 roku. Jej operator, Jeronimo Martins Polska S.A., jest spółką zależną notowanego w Lizbonie koncernu Jerónimo Martins SGPS S.A. Największym akcjonariuszem koncernu (ok. 56% akcji) jest holding Sociedade Francisco Manuel dos Santos, kontrolowany przez rodzinę Soares dos Santos."
5. business_description: 2-3 zdania o tym, czym firma się zajmuje (produkty, usługi, sieć lokali). Zero wątków właścicielskich, zero "lider rynku".
6. brands: marki konsumenckie tej spółki w Polsce (nazwy z szyldu/półki), domena tylko gdy pewna. Bez marek: [].
7. category_slug: jedna z: ${kategorie.map((k) => k.slug).join(", ")}.
8. Zakaz myślników em-dash i en-dash w opisach (używaj przecinka, dwukropka, kropki). Bez frazesów i ocen.

FORMAT ODPOWIEDZI
Odpowiedz JEDNYM blokiem kodu \`\`\`json z tablicą, jeden obiekt na firmę, w tej samej kolejności. Bez komentarzy w JSON. Wzór jednego obiektu:
{
  "marka": "nazwa dokładnie jak w nagłówku firmy",
  "nip": "1234567890",
  "lancuch": [
    { "podmiot": "Spółka Polska sp. z o.o.", "kraj": "PL", "rola": "spolka_polska", "proc_glosow": null, "zrodlo_url": null, "zrodlo_tytul": null, "stan_na": null },
    { "podmiot": "Holding Ltd", "kraj": "CY", "rola": "posrednik", "proc_glosow": 100, "zrodlo_url": "https://...", "zrodlo_tytul": "...", "stan_na": "2026-05" },
    { "podmiot": "Jan Kowalski", "kraj": "PL", "rola": "ostateczny", "proc_glosow": 100, "zrodlo_url": "https://...", "zrodlo_tytul": "...", "stan_na": "2026-05" }
  ],
  "ostateczny_wlasciciel": "krótka nazwa, np. Rodzina Kowalskich, CVC Capital Partners, Skarb Państwa",
  "typ_wlasciciela": "osoba/rodzina | skarb_panstwa | korporacja_gieldowa | korporacja_prywatna | fundusz_pe_vc | spoldzielnia | fundacja | rozproszony | inny",
  "country_code": "PL",
  "regula": "D1 (albo D2, D3, D1+B1, D1+B3 ...)",
  "uzasadnienie": "2-4 zdania: kto kontroluje i dlaczego ten kraj",
  "historia": [ { "rok": "2015", "zdarzenie": "...", "zrodlo_url": "https://..." } ],
  "transakcja_w_toku": null,
  "luki": [ "czego nie udało się potwierdzić" ],
  "zrodla": [ { "url": "https://...", "tytul": "...", "data": "2026-05", "czego_dotyczy": "..." } ],
  "display_name": "nazwa marki z poprawnymi polskimi znakami",
  "ownership_description": "...",
  "business_description": "...",
  "brands": [ { "name": "...", "domain": "przyklad.pl" } ],
  "website_url": "https://...",
  "category_slug": "..."
}
Pole "rola" w łańcuchu: spolka_polska, posrednik, kontrolujacy, ostateczny, mniejszosciowy, free_float.

FIRMY (${firmy.length})

${firmy.map((f, i) => blokFirmy(f, i + 1)).join("\n\n")}
`;
}

// ---------- parser wklejonej odpowiedzi ----------
// Toleruje: blok ```json, tekst przed i po, kilka bloków, pojedyncze obiekty, obiekt z tablicą
// w środku ({"firmy": [...]}), przecinki na końcu, "inteligentne" cudzysłowy, komentarze //.

function naprawJson(s) {
  return s
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/,\s*([}\]])/g, "$1");
}

function sprobuj(s) {
  for (const w of [s, naprawJson(s)]) {
    try { return JSON.parse(w); } catch { /* następna próba */ }
  }
  return undefined;
}

// Wyłuskuje zrównoważone obiekty {...} najwyższego poziomu (z pominięciem nawiasów w stringach).
function obiektyZTekstu(tekst) {
  const wynik = [];
  let glebokosc = 0, start = -1, wStringu = false, esc = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (wStringu) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') wStringu = false;
      continue;
    }
    if (c === '"') wStringu = true;
    else if (c === "{") { if (glebokosc === 0) start = i; glebokosc++; }
    else if (c === "}" && glebokosc > 0) {
      glebokosc--;
      if (glebokosc === 0 && start >= 0) {
        const o = sprobuj(tekst.slice(start, i + 1));
        if (o && typeof o === "object") wynik.push(o);
        start = -1;
      }
    }
  }
  return wynik;
}

function splaszcz(dane) {
  if (Array.isArray(dane)) return dane.flatMap(splaszcz);
  if (!dane || typeof dane !== "object") return [];
  if (dane.marka || dane.ostateczny_wlasciciel || dane.lancuch) return [dane];
  // obiekt-opakowanie: {"firmy": [...]} albo {"Żabka": {...}, ...}
  const wartosci = Object.entries(dane);
  const tablica = wartosci.find(([, v]) => Array.isArray(v));
  if (tablica) return splaszcz(tablica[1]);
  return wartosci.filter(([, v]) => v && typeof v === "object").map(([k, v]) => ({ marka: k, ...v })).filter((o) => o.lancuch || o.ostateczny_wlasciciel);
}

export function parsujOdpowiedz(tekst) {
  const t = String(tekst || "");
  const bloki = [...t.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  const kandydaci = bloki.length ? bloki : [t];
  let obiekty = [];
  for (const k of kandydaci) {
    const calosc = sprobuj(k.trim());
    if (calosc !== undefined) { obiekty.push(...splaszcz(calosc)); continue; }
    const od = k.indexOf("["), do_ = k.lastIndexOf("]");
    const tablica = od >= 0 && do_ > od ? sprobuj(k.slice(od, do_ + 1)) : undefined;
    if (tablica !== undefined) { obiekty.push(...splaszcz(tablica)); continue; }
    obiekty.push(...obiektyZTekstu(k).flatMap(splaszcz));
  }
  // odpowiedź ucięta w połowie bloku (bez zamykającego ```): spróbuj całego tekstu
  if (!obiekty.length && bloki.length) obiekty = obiektyZTekstu(t).flatMap(splaszcz);
  return obiekty.filter((o) => o && typeof o === "object");
}

// Dopasowanie obiektów do firm: najpierw dokładna marka, potem NIP (tylko gdy jednoznaczny,
// bo jedna spółka bywa operatorem kilku marek), na końcu podobieństwo nazwy.
export function dopasuj(obiekty, firmy) {
  const wynik = [], niedopasowane = [];
  const zajete = new Set();
  for (const o of obiekty) {
    const marka = String(o.marka || o.display_name || o.nazwa || "");
    const nip = normalizujNip(String(o.nip || ""));
    const wolne = firmy.filter((f) => !zajete.has(f.nazwa));
    let f = wolne.find((x) => normalizujNazwe(x.nazwa) === normalizujNazwe(marka));
    if (!f && nip.length === 10) {
      const poNip = wolne.filter((x) => normalizujNip(x.tozsamosc?.nip || x.nipPodany || "") === nip);
      if (poNip.length === 1) f = poNip[0];
    }
    if (!f && marka) {
      const najlepsza = wolne.map((x) => ({ x, p: podobienstwoNazw(x.nazwa, marka) })).sort((a, b) => b.p - a.p)[0];
      if (najlepsza && najlepsza.p >= 0.7) f = najlepsza.x;
    }
    if (f) { zajete.add(f.nazwa); wynik.push({ firma: f, dane: o }); }
    else niedopasowane.push(marka || "(bez nazwy)");
  }
  return { wynik, niedopasowane };
}

// Ujednolica odpowiedź czatu do pól, których oczekują zlozRekord i ocenPewnosc.
export function normalizujDane(o) {
  const lancuch = (Array.isArray(o.lancuch) ? o.lancuch : []).filter((x) => x && x.podmiot).map((x) => ({
    podmiot: String(x.podmiot),
    kraj: String(x.kraj || "").toUpperCase().slice(0, 2),
    rola: x.rola || "posrednik",
    proc_glosow: x.proc_glosow == null || x.proc_glosow === "" ? null : Number(String(x.proc_glosow).replace(",", ".").replace("%", "")),
    proc_kapitalu: x.proc_kapitalu == null || x.proc_kapitalu === "" ? null : Number(String(x.proc_kapitalu).replace(",", ".").replace("%", "")),
    zrodlo_url: /^https?:\/\//.test(String(x.zrodlo_url || "")) ? String(x.zrodlo_url) : null,
    zrodlo_tytul: x.zrodlo_tytul || null,
    stan_na: x.stan_na || null,
    uwaga: x.uwaga || null,
  }));
  const kraj = normalizujKrajOdModelu(String(o.country_code || "").trim().toUpperCase()) || "";
  const brands = (Array.isArray(o.brands) ? o.brands : Array.isArray(o.marki) ? o.marki : [])
    .map((b) => (typeof b === "string" ? { name: b } : b)).filter((b) => b?.name);
  return {
    sledztwo: {
      lancuch,
      ostateczny_wlasciciel: String(o.ostateczny_wlasciciel || o.owner_name || "").trim(),
      typ_wlasciciela: o.typ_wlasciciela || "inny",
      country_code: kraj,
      regula: String(o.regula || ""),
      uzasadnienie: String(o.uzasadnienie || ""),
      historia: Array.isArray(o.historia) ? o.historia : [],
      transakcja_w_toku: o.transakcja_w_toku || null,
      luki: (Array.isArray(o.luki) ? o.luki : o.luki ? [String(o.luki)] : []).map(String),
      zrodla: (Array.isArray(o.zrodla) ? o.zrodla : []).filter((z) => z && /^https?:\/\//.test(String(z.url || ""))),
      uwagi: o.uwagi || null,
    },
    opisy: {
      display_name: String(o.display_name || o.marka || "").trim(),
      ownership_description: String(o.ownership_description || ""),
      business_description: String(o.business_description || ""),
      brands,
      website_url: o.website_url || null,
      category_slug: o.category_slug || o.kategoria || null,
    },
  };
}

// Zapisuje dopasowane odpowiedzi do partii: f.sledztwaReczne[model] = { kiedy, sledztwo, opisy }.
export function zapiszOdpowiedz(partia, model, tekst) {
  const obiekty = parsujOdpowiedz(tekst);
  const kandydaci = partia.firmy.filter((f) => !f.pomin && f.tozsamosc);
  const { wynik, niedopasowane } = dopasuj(obiekty, kandydaci);
  const kiedy = new Date().toISOString();
  for (const { firma, dane } of wynik) {
    firma.sledztwaReczne = firma.sledztwaReczne || {};
    firma.sledztwaReczne[model] = { kiedy, ...normalizujDane(dane) };
  }
  return { obiektow: obiekty.length, dopasowane: wynik.map((w) => w.firma.nazwa), niedopasowane };
}

// ---------- porównanie modeli ----------
const zgodneDwa = (a, b) => !!a.country_code && a.country_code === b.country_code && podobienstwoNazw(a.ostateczny_wlasciciel, b.ostateczny_wlasciciel) >= 0.5;

export function porownanie(f) {
  const modele = Object.entries(f.sledztwaReczne || {}).map(([model, w]) => ({ model, ...w }));
  const wiersze = modele.map((m) => ({
    model: m.model,
    zgodneZ: modele.filter((x) => x.model !== m.model && zgodneDwa(m.sledztwo, x.sledztwo)).map((x) => x.model),
  }));
  const krajow = new Set(modele.map((m) => m.sledztwo.country_code || "?"));
  const stan = modele.length === 0 ? "brak" : modele.length === 1 ? "jeden" : wiersze.every((w) => w.zgodneZ.length === modele.length - 1) ? "zgodne" : krajow.size > 1 ? "rozne_kraje" : "rozni_wlasciciele";
  return { modele, wiersze, stan };
}

// Kontrola z porównania modeli: zgoda nie podnosi pewności ponad źródła (to liczy ocenPewnosc
// z poziomu źródeł), niezgoda zawsze daje KONFLIKT, jeden model = najwyżej ŚREDNIA.
export function kontrolaZPorownania(f, wybrany) {
  const { modele } = porownanie(f);
  const w = f.sledztwaReczne[wybrany].sledztwo;
  const inne = modele.filter((m) => m.model !== wybrany);
  const baza = { country_code: w.country_code, ostateczny_wlasciciel: w.ostateczny_wlasciciel, regula: w.regula, zrodla_zweryfikowane: [], brakujace_zrodla: [], zrodlo: "porównanie czatów" };
  if (!inne.length) {
    return { ...baza, zgadza_sie: null, zastrzezenia: [`tylko jeden model (${wybrany}), brak porównania`], pewnosc_proponowana: "SREDNIA" };
  }
  const niezgodne = inne.filter((m) => !zgodneDwa(w, m.sledztwo));
  if (!niezgodne.length) {
    return { ...baza, zgadza_sie: true, zastrzezenia: [], pewnosc_proponowana: "WYSOKA", modele_zgodne: [wybrany, ...inne.map((m) => m.model)] };
  }
  return {
    ...baza,
    zgadza_sie: false,
    // zgadza_sie: false wystarcza, żeby ocenPewnosc dał KONFLIKT (bez drugiego, identycznego wpisu)
    zastrzezenia: niezgodne.map((m) => `${m.model}: kraj ${m.sledztwo.country_code || "?"}, właściciel "${m.sledztwo.ostateczny_wlasciciel || "?"}" (przyjęto ${wybrany}: ${w.country_code || "?"}, "${w.ostateczny_wlasciciel || "?"}")`),
    pewnosc_proponowana: null,
  };
}

export function przyjmijWersje(f, model, { kategorie, dzisiaj }) {
  const w = f.sledztwaReczne?.[model];
  if (!w) throw new Error(`Brak odpowiedzi modelu ${model} dla ${f.nazwa}`);
  f.sledztwo = structuredClone(w.sledztwo);
  f.opisy = structuredClone(w.opisy);
  f.kontrola = kontrolaZPorownania(f, model);
  f.przyjetaWersja = { model, kiedy: new Date().toISOString() };
  f.etapy = { ...(f.etapy || {}), sledztwo: `czat: ${model}`, kontrola: "porównanie czatów", opisy: `czat: ${model}` };
  f.bledy = (f.bledy || []).filter((b) => !/^(śledztwo|kontrola|opisy):/.test(b));
  f.decyzja = null;
  zlozRekord(f, { kategorie, dzisiaj });
  return f;
}

// Cofa przyjęcie: firma wraca do porównania (odpowiedzi czatów zostają).
export function cofnijWersje(f) {
  for (const k of ["sledztwo", "kontrola", "opisy", "rekord", "status", "konflikty", "uwagi", "walidacja", "przyjetaWersja", "porownanie"]) delete f[k];
  f.decyzja = null;
  f.etapy = { ...(f.etapy || {}), sledztwo: "czeka na czaty" };
}
