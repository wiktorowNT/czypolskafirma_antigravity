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
      // pola rozstrzygnięcia (Claude na plikach); w zwykłych odpowiedziach czatów puste
      rozstrzygniecie: o.rozstrzygniecie ? String(o.rozstrzygniecie) : null,
      zgodne_modele: Array.isArray(o.zgodne_modele) ? o.zgodne_modele.map(String) : null,
      pewnosc_proponowana: ["WYSOKA", "SREDNIA", "KONFLIKT"].includes(String(o.pewnosc_proponowana || "").toUpperCase().replace("Ś", "S")) ? String(o.pewnosc_proponowana).toUpperCase().replace("Ś", "S") : null,
      konflikt: o.konflikt ? String(o.konflikt) : null,
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
    // surowe: cała odpowiedź modelu, żeby do rozstrzygnięcia nic nie ginęło
    firma.sledztwaReczne[model] = { kiedy, ...normalizujDane(dane), surowe: dane };
  }
  return { obiektow: obiekty.length, dopasowane: wynik.map((w) => w.firma.nazwa), niedopasowane };
}

// ---------- porównanie modeli ----------
// Rozstrzygnięcie (Claude na plikach) jest zapisywane jak kolejny model, ale nie bierze udziału
// w liczeniu zgodności czatów: to ono jest oceniane względem nich.
export const ROZSTRZYGNIECIE = "Rozstrzygnięcie";
const zgodneDwa = (a, b) => !!a.country_code && a.country_code === b.country_code && podobienstwoNazw(a.ostateczny_wlasciciel, b.ostateczny_wlasciciel) >= 0.5;

export function porownanie(f) {
  const modele = Object.entries(f.sledztwaReczne || {}).map(([model, w]) => ({ model, ...w }));
  const wejsciowe = modele.filter((m) => m.model !== ROZSTRZYGNIECIE);
  const wiersze = modele.map((m) => ({
    model: m.model,
    zgodneZ: wejsciowe.filter((x) => x.model !== m.model && zgodneDwa(m.sledztwo, x.sledztwo)).map((x) => x.model),
  }));
  const krajow = new Set(wejsciowe.map((m) => m.sledztwo.country_code || "?"));
  const stan = wejsciowe.length === 0 ? "brak" : wejsciowe.length === 1 ? "jeden"
    : wiersze.filter((w) => w.model !== ROZSTRZYGNIECIE).every((w) => w.zgodneZ.length === wejsciowe.length - 1) ? "zgodne"
    : krajow.size > 1 ? "rozne_kraje" : "rozni_wlasciciele";
  return { modele, wejsciowe, wiersze, stan, rozstrzygniete: modele.some((m) => m.model === ROZSTRZYGNIECIE) };
}

// Kontrola z porównania modeli: zgoda nie podnosi pewności ponad źródła (to liczy ocenPewnosc
// z poziomu źródeł), niezgoda daje KONFLIKT, jeden model = najwyżej ŚREDNIA.
export function kontrolaZPorownania(f, wybrany) {
  const { wejsciowe } = porownanie(f);
  const w = f.sledztwaReczne[wybrany].sledztwo;
  const baza = { country_code: w.country_code, ostateczny_wlasciciel: w.ostateczny_wlasciciel, regula: w.regula, zrodla_zweryfikowane: [], brakujace_zrodla: [], zrodlo: "porównanie czatów" };
  const opisNiezgody = (m) => `${m.model}: kraj ${m.sledztwo.country_code || "?"}, właściciel "${m.sledztwo.ostateczny_wlasciciel || "?"}" (przyjęto ${wybrany}: ${w.country_code || "?"}, "${w.ostateczny_wlasciciel || "?"}")`;

  // Rozstrzygnięcie: zgodne, gdy co najmniej 2 czaty wskazały ten sam kraj i właściciela.
  // Pojedynczy odmienny czat to uwaga, nie konflikt. Konflikt wskazany przez Claude'a zostaje konfliktem.
  if (wybrany === ROZSTRZYGNIECIE) {
    const zgodne = wejsciowe.filter((m) => zgodneDwa(w, m.sledztwo));
    const niezgodne = wejsciowe.filter((m) => !zgodneDwa(w, m.sledztwo));
    const r = { ...baza, zrodlo: "rozstrzygnięcie Claude", modele_zgodne: zgodne.map((m) => m.model), uwagi_modele: niezgodne.map(opisNiezgody) };
    if (w.konflikt || w.pewnosc_proponowana === "KONFLIKT") return { ...r, zgadza_sie: false, zastrzezenia: [`rozstrzygnięcie: ${w.konflikt || w.rozstrzygniecie || "konflikt bez opisu"}`], pewnosc_proponowana: null };
    if (wejsciowe.length < 2) return { ...r, zgadza_sie: null, zastrzezenia: [`rozstrzygnięcie oparte na ${wejsciowe.length} czacie, brak porównania`], pewnosc_proponowana: "SREDNIA" };
    if (zgodne.length < 2) return { ...r, zgadza_sie: false, zastrzezenia: [`rozstrzygnięcie potwierdza tylko ${zgodne.length} z ${wejsciowe.length} czatów`, ...niezgodne.map(opisNiezgody)], pewnosc_proponowana: null };
    return { ...r, zgadza_sie: true, zastrzezenia: [], pewnosc_proponowana: w.pewnosc_proponowana === "SREDNIA" ? "SREDNIA" : "WYSOKA" };
  }

  const inne = wejsciowe.filter((m) => m.model !== wybrany);
  if (!inne.length) {
    return { ...baza, zgadza_sie: null, zastrzezenia: [`tylko jeden model (${wybrany}), brak porównania`], pewnosc_proponowana: "SREDNIA" };
  }
  const niezgodne = inne.filter((m) => !zgodneDwa(w, m.sledztwo));
  if (!niezgodne.length) {
    return { ...baza, zgadza_sie: true, zastrzezenia: [], pewnosc_proponowana: "WYSOKA", modele_zgodne: [wybrany, ...inne.map((m) => m.model)] };
  }
  // zgadza_sie: false wystarcza, żeby ocenPewnosc dał KONFLIKT (bez drugiego, identycznego wpisu)
  return { ...baza, zgadza_sie: false, zastrzezenia: niezgodne.map(opisNiezgody), pewnosc_proponowana: null };
}

export function przyjmijWersje(f, model, { kategorie, dzisiaj }) {
  const w = f.sledztwaReczne?.[model];
  if (!w) throw new Error(`Brak odpowiedzi modelu ${model} dla ${f.nazwa}`);
  f.sledztwo = structuredClone(w.sledztwo);
  f.opisy = structuredClone(w.opisy);
  f.kontrola = kontrolaZPorownania(f, model);
  f.przyjetaWersja = { model, kiedy: new Date().toISOString() };
  f.etapy = { ...(f.etapy || {}), sledztwo: `czat: ${model}`, kontrola: model === ROZSTRZYGNIECIE ? "rozstrzygnięcie Claude" : "porównanie czatów", opisy: `czat: ${model}` };
  f.bledy = (f.bledy || []).filter((b) => !/^(śledztwo|kontrola|opisy):/.test(b));
  f.decyzja = null;
  zlozRekord(f, { kategorie, dzisiaj });
  if (model === ROZSTRZYGNIECIE) {
    const u = [];
    if (w.sledztwo.rozstrzygniecie) u.push(`rozstrzygnięcie: ${w.sledztwo.rozstrzygniecie}`);
    if (f.kontrola.zgadza_sie === true) for (const x of f.kontrola.uwagi_modele || []) u.push(`inny czat: ${x}`);
    f.uwagi = [...u, ...(f.uwagi || [])];
  }
  return f;
}

// Cofa przyjęcie: firma wraca do porównania (odpowiedzi czatów zostają).
export function cofnijWersje(f) {
  for (const k of ["sledztwo", "kontrola", "opisy", "rekord", "status", "konflikty", "uwagi", "walidacja", "przyjetaWersja", "porownanie"]) delete f[k];
  f.decyzja = null;
  f.etapy = { ...(f.etapy || {}), sledztwo: "czeka na czaty" };
}

// ---------- rozstrzygnięcie w Claude: pliki na dysku ----------
// Folder z instrukcją i częściami (po N firm). Claude (Claude Code albo Claude.ai) czyta część,
// może sprawdzać w internecie i zapisuje wynik-NN.json; panel wczytuje wyniki i przyjmuje je.

// "46 150,00", "4.500,00", "50.000", "3750000" → liczba
function liczbaPl(t) {
  let s = String(t || "").replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Procent udziałów wspólnika z opisu KRS ("923 UDZIAŁY O ŁĄCZNEJ WARTOŚCI 46 150,00 ZŁ") i kapitału.
function procentUdzialow(w, rej) {
  if (w.calosc) return 100;
  const kapital = liczbaPl(String(rej.kapitalZakladowy || "").split(" ")[0]);
  const m = String(w.udzialy || "").match(/WARTO[ŚS]CI(?:\s+NOMINALNEJ)?\s+([\d\s.,]+)/i);
  const wartosc = m ? liczbaPl(m[1].trim().replace(/[.,]$/, "")) : null;
  if (kapital && wartosc && wartosc <= kapital) return Math.round((wartosc / kapital) * 1000) / 10;
  const szt = String(w.udzialy || "").match(/^(\d[\d\s.]*)\s+UDZIA/i);
  const ile = szt ? liczbaPl(szt[1]) : null;
  if (ile && rej.liczbaAkcjiUdzialow && ile <= rej.liczbaAkcjiUdzialow) return Math.round((ile / rej.liczbaAkcjiUdzialow) * 1000) / 10;
  return null;
}

function formaZNazwy(nazwa) {
  const n = String(nazwa || "").toUpperCase();
  if (/SPÓŁKA KOMANDYTOWO-AKCYJNA|S\.K\.A\./.test(n)) return "ska";
  if (/SPÓŁKA KOMANDYTOWA|SP\. ?K\./.test(n)) return "spk";
  if (/SPÓŁKA JAWNA|SP\. ?J\./.test(n)) return "spj";
  if (/\bS\.? ?C\.?\b|SPÓŁKA CYWILNA/.test(n)) return "sc";
  if (/SPÓŁKA AKCYJNA|\bS\.A\./.test(n)) return "sa";
  return null;
}

// Fakty z rejestrów w wersji do rozstrzygnięcia: procenty policzone z udziałów, historia jako lista
// wpisów z datami (nie łańcuch przejęć), właściwe komunikaty dla spółek osobowych i cywilnych.
function faktyDoRozstrzygniecia(f, partia) {
  const t = f.tozsamosc || {}, rej = f.rejestr && !f.rejestr.blad ? f.rejestr : null;
  const nazwa = rej?.nazwa || t.mf?.nazwa || t.nazwa_spolki || "?";
  const forma = formaZNazwy(nazwa);
  const out = [`- Spółka: ${nazwa}, NIP ${t.nip || "?"}${t.krs ? `, KRS ${t.krs}` : ""}${t.mf?.statusVat ? `, VAT: ${t.mf.statusVat}` : ""}${t.mf?.adres ? `, adres: ${t.mf.adres}` : ""}`];
  if (rej) {
    out.push(`- Odpis aktualny KRS, stan z dnia ${rej.stanZDnia}: ${rej.formaPrawna || "?"}, kapitał ${rej.kapitalZakladowy || "nie dotyczy tej formy"}. Źródło: ${rej.zrodloUrl}`);
    const wsp = [...(rej.wspolnicy || []), ...(rej.jedynyAkcjonariusz || []).map((x) => ({ ...x, jedyny: true }))];
    if (wsp.length) {
      out.push(`- ${rej.jedynyAkcjonariusz?.length ? "Jedyny akcjonariusz" : "Wspólnicy"} wg KRS: ${wsp.map((w) => { const p = procentUdzialow(w, rej); return `${w.nazwa}${p != null ? ` ${p}% kapitału` : ""}${w.udzialy ? ` (${w.udzialy})` : ""}`; }).join("; ")}.`);
      // KRS pokazuje tylko wspólników sp. z o.o. z co najmniej 10% kapitału: reszta jest niewidoczna.
      const procenty = wsp.map((w) => procentUdzialow(w, rej));
      const suma = procenty.every((p) => p != null) ? Math.round(procenty.reduce((a, b) => a + b, 0) * 10) / 10 : null;
      if (suma != null && suma < 99) out.push(`- Wymienieni wspólnicy mają razem ${suma}% kapitału. KRS pokazuje tylko wspólników z co najmniej 10% udziałów, więc pozostałe ${Math.round((100 - suma) * 10) / 10}% należy do mniejszych, niewidocznych w KRS wspólników (sprawdź, czy któryś z nich nie jest powiązany z wymienionymi).`);
    }
    else if (forma === "spk" || forma === "ska" || forma === "spj") out.push(`- Spółka osobowa: program nie wyciąga z KRS komplementariuszy i komandytariuszy/wspólników. Sprawdź ich w KRS (dział 1) i ustal, kto ma kontrolę (zwykle komplementariusz prowadzi sprawy, komandytariusze mają kapitał).`);
    else out.push(`- KRS nie wykazuje wspólników ani jedynego akcjonariusza. Przy spółce akcyjnej akcjonariat jest poza KRS: szukaj w CRBR, raportach spółki, rejestrze akcjonariuszy.`);
    if (rej.emisjeAkcji?.some((e) => e.uprzywilejowanie)) out.push(`- Akcje uprzywilejowane wg KRS: ${rej.emisjeAkcji.filter((e) => e.uprzywilejowanie).map((e) => `seria ${e.seria}: ${e.uprzywilejowanie}`).join("; ")}.`);
  } else if (forma === "sc" || !t.krs) {
    out.push(`- Spółka cywilna albo działalność bez KRS: wspólnikami są osoby fizyczne wymienione w nazwie (dane w CEIDG). Nie ma odpisu KRS.`);
  } else {
    out.push(`- Odpis KRS nie został pobrany (${f.rejestr?.blad || "brak numeru"}).`);
  }
  if (f.historiaKrs?.historia?.length) {
    out.push(`- Wszyscy wspólnicy/akcjonariusze w historii KRS (lista wpisów z datami, NIE kolejne przejęcia; kilku mogło być jednocześnie):\n${f.historiaKrs.historia.map((h) => `  - ${h.nazwa}: od ${h.od || "?"}${h.do ? ` do ${h.do}` : ", nadal"}`).join("\n")}`);
  }
  if (f.crbr && !f.crbr.blad && !f.crbr.brak) out.push(`- ${f.crbr.podsumowanie} (stan CRBR na ${f.crbr.stanNa || "?"}; dane osobowe pominięte przez program).`);
  if (f.gielda?.akcjonariusze?.length) out.push(`- Akcjonariat wg bankier.pl (${f.gielda.url}, pobrano ${f.gielda.pobrano}): ${f.gielda.akcjonariusze.map((a) => `${a.nazwa} ${a.procGlosow ?? a.procKapitalu}% głosów`).join("; ")}.`);
  const inne = partia.firmy.filter((x) => x !== f && !x.pomin && x.tozsamosc?.nip && x.tozsamosc.nip === t.nip).map((x) => x.nazwa);
  if (inne.length) out.push(`- Ta sama spółka prowadzi też marki: ${inne.join(", ")}. Każda jest osobną firmą w bazie; w polu "brands" nie wpisuj ich wzajemnie.`);
  if (f.uwagiTozsamosci) out.push(`- Uwaga z weryfikacji NIP: ${f.uwagiTozsamosci}`);
  if (t.istniejeWBazie) out.push(`- W bazie serwisu jest już rekord: ${t.istniejeWBazie.country_code || "?"}, właściciel "${t.istniejeWBazie.owner_name || "?"}" (NIP w bazie: ${t.istniejeWBazie.nip || "?"}). Jeśli Twoje rozstrzygnięcie jest inne, wyjaśnij dlaczego.`);
  return out.join("\n");
}

function blokRozstrzygniecia(f, partia, nr) {
  const odp = Object.entries(f.sledztwaReczne || {}).filter(([m]) => m !== ROZSTRZYGNIECIE);
  return `## ${nr}. ${f.nazwa}
marka (wpisz dokładnie tak w polu "marka"): ${f.nazwa}

### Fakty z rejestrów (pobrane automatycznie przez program)
${faktyDoRozstrzygniecia(f, partia)}

### Odpowiedzi czatów (${odp.length}: ${odp.map(([m]) => m).join(", ")})
${odp.map(([m, w]) => `#### ${m} (wklejono ${String(w.kiedy || "").slice(0, 10)})
\`\`\`json
${JSON.stringify(w.surowe || { marka: f.nazwa, ...w.sledztwo, ...w.opisy }, null, 1)}
\`\`\``).join("\n\n")}`;
}

export function instrukcjaRozstrzygniecia({ kategorie, dzisiaj, nazwaPartii, czesci, folder }) {
  const kraje = Object.keys(kodyKrajow()).join(", ");
  return `# Rozstrzygnięcie struktur właścicielskich: instrukcja

Partia: ${nazwaPartii}. Data: ${dzisiaj}. Folder: ${folder}
Części do rozstrzygnięcia: ${czesci.map((c) => c.plik).join(", ")}.

Jesteś głównym analitykiem serwisu CzyPolskaFirma.pl, który pokazuje konsumentom, czy marka należy do polskiego kapitału. Dla każdej firmy dostajesz fakty z rejestrów (pobrane przez program) i odpowiedzi kilku czatów AI (Gemini, ChatGPT i inne), które niezależnie badały tę samą firmę. Czaty często się mylą: zmyślają liczby, podają agregatory zamiast źródeł, piszą opisy wartościujące. Twoja praca: ustalić ostateczną wersję, która przejdzie przegląd redakcyjny.

## Jak pracować

- **Claude Code (dostęp do plików):** rozstrzygaj część po części, po kolei. Dla każdej części \`czesc-NN.md\` zapisz w tym samym folderze plik \`wynik-NN.json\` (tablica JSON, jeden obiekt na firmę z tej części). Jeśli \`wynik-NN.json\` już istnieje, pomiń tę część. Po każdej części zapisz wynik od razu, zanim przejdziesz dalej. Przy dużej liczbie części możesz rozdzielić je na podagentów, każdy dostaje instrukcję i jedną część.
- **Claude.ai (załącznik):** dostajesz tę instrukcję i jedną część. Odpowiedz jednym blokiem \`\`\`json z tablicą dla wszystkich firm z tej części. Gdy odpowiedź się nie zmieści, przerwij po pełnym obiekcie i kontynuuj na prośbę „kontynuuj".

**Sprawdzaj w internecie**, gdy: czaty podają różne kraje lub właścicieli; ogniwo kontrolne ma tylko agregator albo nie ma źródła; czat podaje liczbę (procent, rok, kwotę), której nie ma w faktach z rejestrów; link wygląda na zmyślony albo prowadzi do innej firmy. Gdy nie możesz czegoś potwierdzić, nie przepisuj tego z czatu: wpisz do "luki".

## Zasady rozstrzygania

1. Fakty z rejestrów są punktem wyjścia (stan na datę podaną przy firmie). Procenty kapitału przy wspólnikach policzył program z liczby i wartości udziałów. Jeśli znajdziesz nowsze źródło poziomu 1–2, które im przeczy, przyjmij nowsze i opisz to w "rozstrzygniecie".
2. Decyduje hierarchia źródeł, nie większość czatów. Trzy czaty powtarzające ten sam agregator to jedno słabe źródło.
3. Agregatory i serwisy pośrednie są tylko tropem, nigdy źródłem ogniwa: rejestr.io, aleo.com, bizraport.pl, compabase, krs-pobierz, mojepanstwo, owler, gowork, fora, reddit, czaty inwestorów, Wikipedia. Znajdź źródło pierwotne (KRS/CRBR/rejestr zagraniczny, raport spółki, strona IR, komunikat transakcji, renomowane media z datą) albo zostaw zrodlo_url: null i wpisz lukę.
4. Ogniwa potwierdzone w faktach z rejestrów (polska spółka, jej wspólnicy z KRS): zrodlo_url zostaw null, program sam wstawi odpis KRS.
5. Nie da się rozstrzygnąć (źródła poziomu 1–2 sobie przeczą, brak źródła pakietu kontrolnego, transakcja w toku): ustaw "konflikt" z krótkim opisem. Właściciel serwisu rozstrzygnie ręcznie.
6. Dane osobowe: imię i nazwisko osoby prywatnej tylko, gdy potwierdza je źródło poziomu 1–3; bez drugich imion. Bez adresów, majątków, wieku.
${METODOLOGIA}

## Opisy (piszesz od nowa, nie przepisuj opisów czatów)

**ownership_description**: 3–5 zdań, 300–700 znaków. Schemat: KTO kontroluje (z % głosów, jeśli jest w łańcuchu) → JAK do tego doszło (rok, transakcja, strony) → STAN OBECNY (pakiety mniejszościowe, pośrednie spółki z krajem rejestracji) → NIUANS, jeśli jest (franczyza, fundusz, holding zagraniczny, Złota Klatka).
Wzór: "Sieć Biedronka należy do portugalskiej grupy Jerónimo Martins, obecnej w Polsce od 1995 roku. Jej operator, Jeronimo Martins Polska S.A., jest spółką zależną notowanego w Lizbonie koncernu Jerónimo Martins SGPS S.A. Największym akcjonariuszem koncernu (ok. 56% akcji) jest holding Sociedade Francisco Manuel dos Santos, kontrolowany przez rodzinę Soares dos Santos."

**business_description**: 2–3 zdania, 120–350 znaków. Czym firma się zajmuje: produkty, usługi, format lokali, zasięg. Zero wątków właścicielskich.
Wzór: "Producent leków Rx, OTC i wyrobów medycznych. Działa w obszarach gastroenterologii, hepatologii, neurologii, dermatologii oraz okulistyki (marka Bausch + Lomb)."

Twarde zakazy w obu opisach:
- ton suchy i encyklopedyczny, jak w wzorach; zdania proste;
- żadnych ocen i przymiotników wartościujących (np. fenomenalny, potężny, gigantyczny, wybitny, prestiżowy, legendarny, dynamiczny, lider, rdzennie, rygorystycznie, suwerenny, bezkompromisowy), żadnych metafor;
- żadnego werdyktu "polska/zagraniczna firma", "polski kapitał" jako wniosku: to wynika z kraju;
- żadnych liczb, których nie ma w łańcuchu, historii albo faktach z rejestrów (przychody, majątek, obroty, liczba lokali tylko ze źródłem);
- żadnych myślników em-dash i en-dash (używaj przecinka, dwukropka, kropki);
- nie zgaduj działalności: sprawdź stronę firmy, jeśli czaty piszą różnie.

## Format wyniku

Tablica JSON, jeden obiekt na firmę, w kolejności z części. Bez komentarzy. Pola:
{
  "marka": "dokładnie jak w nagłówku firmy",
  "nip": "1234567890",
  "lancuch": [
    { "podmiot": "...", "kraj": "PL", "rola": "spolka_polska|posrednik|kontrolujacy|ostateczny|mniejszosciowy|free_float", "proc_glosow": 100, "zrodlo_url": "https://... albo null", "zrodlo_tytul": "...", "stan_na": "RRRR-MM" }
  ],
  "ostateczny_wlasciciel": "krótka nazwa do wyświetlenia, np. Rodzina Kowalskich, CVC Capital Partners, Skarb Państwa",
  "typ_wlasciciela": "osoba/rodzina | skarb_panstwa | korporacja_gieldowa | korporacja_prywatna | fundusz_pe_vc | spoldzielnia | fundacja | rozproszony | inny",
  "country_code": "PL",
  "regula": "D1, D2, D3, D1+B1 ...",
  "uzasadnienie": "2–4 zdania: kto kontroluje i dlaczego ten kraj",
  "historia": [ { "rok": "2015", "zdarzenie": "...", "zrodlo_url": "https://... albo null" } ],
  "transakcja_w_toku": null,
  "luki": [ "czego nie udało się potwierdzić" ],
  "zrodla": [ { "url": "https://...", "tytul": "...", "data": "RRRR-MM", "czego_dotyczy": "..." } ],
  "zgodne_modele": [ "nazwy czatów, których kraj i właściciel zgadzają się z Twoim rozstrzygnięciem" ],
  "rozstrzygniecie": "2–4 zdania: co przyjąłeś, który czat się mylił i dlaczego, co sprawdziłeś sam",
  "pewnosc_proponowana": "WYSOKA | SREDNIA | KONFLIKT",
  "konflikt": null,
  "display_name": "nazwa marki z poprawnymi polskimi znakami",
  "ownership_description": "...",
  "business_description": "...",
  "brands": [ { "name": "...", "domain": "przyklad.pl" } ],
  "website_url": "https://...",
  "category_slug": "jedna z: ${kategorie.map((k) => k.slug).join(", ")}"
}
country_code WYŁĄCZNIE z listy: ${kraje}. Nie da się ustalić: pusty tekst i "konflikt".
WYSOKA proponuj tylko, gdy każde ogniwo kontrolne ma źródło poziomu 1–2. Samo źródło medialne: SREDNIA.
`;
}

// Firmy do rozstrzygnięcia: mają co najmniej jedną odpowiedź czatu.
export function firmyDoRozstrzygniecia(partia, zakres = "nierozstrzygniete") {
  return partia.firmy.filter((f) => !f.pomin && f.tozsamosc && Object.keys(f.sledztwaReczne || {}).some((m) => m !== ROZSTRZYGNIECIE)
    && (zakres === "wszystkie" || (zakres === "nieprzyjete" ? !f.sledztwo : !f.sledztwaReczne?.[ROZSTRZYGNIECIE])));
}

export function czesciRozstrzygniecia(partia, { rozmiar = 20, zakres } = {}) {
  const firmy = firmyDoRozstrzygniecia(partia, zakres);
  const n = Math.max(1, Number(rozmiar) || 20);
  const czesci = [];
  for (let i = 0; i < firmy.length; i += n) {
    const nr = String(czesci.length + 1).padStart(2, "0");
    const grupa = firmy.slice(i, i + n);
    czesci.push({ nr, plik: `czesc-${nr}.md`, wynik: `wynik-${nr}.json`, firmy: grupa.map((f) => f.nazwa), tekst: "" });
  }
  czesci.forEach((c, k) => {
    const grupa = c.firmy.map((nazwa) => partia.firmy.find((f) => f.nazwa === nazwa));
    c.tekst = `# Część ${c.nr} z ${String(czesci.length).padStart(2, "0")}: ${grupa.length} firm (partia ${partia.nazwa})
Wynik zapisz jako ${c.wynik} (tablica JSON wg instrukcji w 00-instrukcja.md).

${grupa.map((f, j) => blokRozstrzygniecia(f, partia, k * n + j + 1)).join("\n\n---\n\n")}
`;
  });
  return czesci;
}
