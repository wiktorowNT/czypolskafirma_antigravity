// Walidacja rekordu w kodzie (nie w modelu) i mechaniczne reguły pewności.
import { kodyKrajow, maMyslniki, normalizujNazwe, podobienstwoNazw, slugify } from "./tekst.mjs";

export const STATUSY = ["WYSOKA", "SREDNIA", "KONFLIKT"];

// Reguły brzegowe z METODOLOGIA_V2, które zawsze idą do decyzji właściciela.
const REGULY_ZAWSZE_KONFLIKT = ["B5", "B10", "B11", "B12"];
// Poziom 1: rejestry i dokumenty spółek. Agregatory giełdowe (bankier, stooq, biznesradar) to poziom 3:
// przepisują zawiadomienia, ale nie są źródłem pierwotnym.
const POZIOM_REJESTR = /krs|crbr|ceidg|company-information\.service\.gov\.uk|ariregister|espi|ebi|raport[-_ ](biez|rocz|okres)|prospekt|gpw\.pl|api-krs|relacje[-_ ]inwestorskie|investor[-_ ]relations|\/\/ir\.|\/ir\/|annual[-_ ]report|sec\.gov|companieshouse|handelsregister|kvk\.nl|lbr\.lu/i;
const POZIOM_IR = /\.(com|pl|de|fr|nl|lu|ch|es|it|se|dk|fi|no|uk|co\.uk|us)\/(?:.*)(investor|inwestor|akcjonariat|shareholder|ownership|struktura|about|o-nas|o-firmie|company|grupa|group)/i;

// Agregatory i serwisy pośrednie: tylko trop, nigdy źródło ogniwa. Sprawdzane PRZED rejestrami,
// bo ich adresy często zawierają "/krs/" (rejestr.io/krs/..., bizraport.pl/krs/...).
const AGREGATOR = /wikipedia|wikidata|crunchbase|linkedin|aleo\.com|rejestr\.io|krs-pobierz|mojepanstwo|owler|zoominfo|bizraport|compabase|gowork|reddit|stockwatch|inforegister|infoveriti|krsonline|imsig|firmy\.net|panoramafirm|pkt\.pl|dnb\.com|opencorporates|northdata|forum|facebook|instagram|x\.com\/|twitter/i;

export function poziomZrodla(url) {
  const u = String(url || "");
  if (!u) return 5;
  if (AGREGATOR.test(u)) return 4;
  if (POZIOM_REJESTR.test(u)) return 1;
  if (POZIOM_IR.test(u)) return 2;
  if (/^https?:\/\//.test(u)) return 3;
  return 5;
}

export function walidujRekord(rekord, kategorie) {
  const bledy = [], ostrzezenia = [];
  const kody = kodyKrajow();
  const r = rekord || {};
  if (!r.name) bledy.push("brak name");
  if (!r.slug || r.slug !== slugify(r.slug)) bledy.push(`slug niekanoniczny: ${r.slug}`);
  if (!r.country_code) bledy.push("brak country_code");
  else if (!kody[r.country_code]) bledy.push(`country_code ${r.country_code} spoza słownika lib/countries.ts`);
  if (!r.owner_name) bledy.push("brak owner_name");
  const od = String(r.ownership_description || "");
  if (od.length < 150) bledy.push(`ownership_description za krótki (${od.length} zn.)`);
  if (od.length > 1400) ostrzezenia.push(`ownership_description długi (${od.length} zn.)`);
  const zd = od.split(/[.!?]\s/).filter((z) => z.trim().length > 20).length;
  if (zd < 3) ostrzezenia.push("ownership_description ma mniej niż 3 zdania");
  if (/\[DO WERYFIKACJI/i.test(od)) ostrzezenia.push("ownership_description zawiera [DO WERYFIKACJI]");
  const bd = String(r.business_description || "");
  if (bd.length < 60) bledy.push(`business_description za krótki (${bd.length} zn.)`);
  if (bd.length > 500) ostrzezenia.push(`business_description długi (${bd.length} zn.)`);
  if (/(właściciel|akcjonariusz|udziały|przejął|przejęcie|kapitał|fundusz|należy do)/i.test(bd)) ostrzezenia.push("business_description zahacza o wątki właścicielskie");
  if (maMyslniki(od) || maMyslniki(bd)) bledy.push("em-dash/en-dash w opisie (zakaz stylu)");
  if (/(lider|najwyższ|najlepsz|renomowan|dynamicznie)/i.test(bd)) ostrzezenia.push("business_description ma frazesy marketingowe");
  if (r.category_slug && kategorie && !kategorie.some((k) => k.slug === r.category_slug)) bledy.push(`kategoria ${r.category_slug} nie istnieje w bazie`);
  if (!r.category_slug) ostrzezenia.push("brak kategorii (uzupełnij w przeglądzie)");
  if (r.website_url && !/^https?:\/\//.test(r.website_url)) bledy.push("website_url bez http(s)");
  return { bledy, ostrzezenia };
}

// Łączy ustalenia z kroków: tożsamość, rejestr, śledztwo, kontrola. Zwraca status i listę konfliktów.
export function ocenPewnosc(firma) {
  const konflikty = [], uwagi = [];
  const t = firma.tozsamosc || {}, rej = firma.rejestr || {}, sl = firma.sledztwo || {}, k = firma.kontrola || {};

  // 1. Tożsamość
  if (t.status === "KONFLIKT") konflikty.push(`tożsamość: ${t.powod || "MF, KRS i nazwa marki nie zgadzają się"}`);
  if (t.istniejeWBazie && firma.tryb !== "reweryfikacja") uwagi.push(`firma jest już w bazie jako ${t.istniejeWBazie.slug} (${t.istniejeWBazie.country_code})`);

  // 2. Śledztwo vs kontrola
  if (!sl.country_code) konflikty.push("śledztwo nie ustaliło country_code");
  if (k.country_code && sl.country_code && k.country_code !== sl.country_code) konflikty.push(`kontrola: kraj ${k.country_code} ≠ śledztwo ${sl.country_code}`);
  if (k.ostateczny_wlasciciel && sl.ostateczny_wlasciciel && podobienstwoNazw(k.ostateczny_wlasciciel, sl.ostateczny_wlasciciel) < 0.5) {
    konflikty.push(`kontrola: właściciel "${k.ostateczny_wlasciciel}" ≠ "${sl.ostateczny_wlasciciel}"`);
  }
  if (k.zgadza_sie === false) konflikty.push(`kontrola nie potwierdza klasyfikacji: ${(k.zastrzezenia || []).join("; ") || "bez uzasadnienia"}`);
  for (const z of k.zrodla_zweryfikowane || []) if (z.potwierdza === false) konflikty.push(`źródło nie potwierdza tezy: ${z.url} (${z.uwaga || ""})`);

  // 3. Łańcuch własności: pakiet kontrolny musi mieć źródło
  const lancuch = sl.lancuch || [];
  const kontrolne = lancuch.filter((o) => (o.proc_glosow ?? o.proc_kapitalu ?? 0) >= 25 || o.rola === "kontrolujacy");
  if (!lancuch.length) konflikty.push("brak łańcucha własności");
  const bezZrodla = lancuch.filter((o) => !o.zrodlo_url);
  if (kontrolne.some((o) => !o.zrodlo_url) || (!kontrolne.length && bezZrodla.length)) konflikty.push("pakiet kontrolny bez źródła");
  // Poziom źródeł liczy się po najsłabszym ogniwie kontrolnym (pakiet kontrolny i ostateczny
  // właściciel), nie po najlepszym w łańcuchu: odpis KRS polskiej spółki nie potwierdza tego,
  // kto stoi nad jej wspólnikami. Samo źródło medialne dla któregoś ogniwa = najwyżej ŚREDNIA.
  const ogniwaKontrolne = lancuch.filter((o) => !["spolka_polska", "mniejszosciowy", "free_float"].includes(o.rola) && (kontrolne.includes(o) || o.rola === "ostateczny"));
  const poziomKontroli = ogniwaKontrolne.length ? Math.max(...ogniwaKontrolne.map((o) => poziomZrodla(o.zrodlo_url))) : 5;
  const najslabsze = ogniwaKontrolne.filter((o) => poziomZrodla(o.zrodlo_url) > 2).map((o) => o.podmiot);
  const wRegulach = String(sl.regula || "").toUpperCase();
  for (const b of REGULY_ZAWSZE_KONFLIKT) if (wRegulach.includes(b)) konflikty.push(`reguła ${b} wymaga decyzji właściciela`);
  if (sl.transakcja_w_toku) konflikty.push(`trwająca transakcja: ${sl.transakcja_w_toku}`);
  if ((sl.luki || []).length) uwagi.push(`luki: ${sl.luki.join("; ")}`);

  // 4. Rejestr vs śledztwo (sp. z o.o. z jednym wspólnikiem 100%: nazwa wspólnika musi wystąpić w łańcuchu)
  const wsp = [...(rej.wspolnicy || []), ...(rej.jedynyAkcjonariusz || [])].filter((w) => w.calosc);
  if (wsp.length === 1) {
    const w = wsp[0];
    const jest = lancuch.some((o) => podobienstwoNazw(o.podmiot, w.nazwa) >= 0.5);
    if (!jest) konflikty.push(`KRS: 100% ma "${w.nazwa}", a łańcuch go nie zawiera`);
  }
  if (rej.blad) uwagi.push(`KRS: ${rej.blad}`);
  if ((rej.giełda?.akcjonariusze || []).length) {
    const najw = rej.giełda.akcjonariusze.filter((a) => !/pozostali|pozostałe|free float|inni/i.test(a.nazwa)).sort((a, b) => (b.procGlosow || b.procKapitalu || 0) - (a.procGlosow || a.procKapitalu || 0))[0];
    if (najw && !lancuch.some((o) => podobienstwoNazw(o.podmiot, najw.nazwa) >= 0.4)) uwagi.push(`akcjonariat GPW: największy pakiet "${najw.nazwa}" (${najw.procGlosow ?? najw.procKapitalu}%) nie występuje w łańcuchu`);
  }

  // 5. Konsylium innych modeli (z przeglądu)
  for (const kz of firma.konsylium || []) {
    if (kz.zgoda === false) konflikty.push(`konsylium ${kz.model}: kraj ${kz.country_code || "?"}, właściciel "${kz.ultimate_owner || "?"}"${kz.uwagi ? ` (${kz.uwagi})` : ""}`);
  }

  // 6. Walidacja techniczna
  for (const b of firma.walidacja?.bledy || []) konflikty.push(`walidacja: ${b}`);

  // Samokontrola może tylko obniżyć pewność, nigdy podnieść.
  if (k.pewnosc_proponowana === "KONFLIKT") konflikty.push(`kontrola proponuje KONFLIKT: ${(k.zastrzezenia || [])[0] || "bez uzasadnienia"}`);
  let status;
  if (konflikty.length) status = "KONFLIKT";
  else if (poziomKontroli <= 2 && k.zgadza_sie === true && k.pewnosc_proponowana !== "SREDNIA") status = "WYSOKA";
  else status = "SREDNIA";
  if (status === "SREDNIA" && k.pewnosc_proponowana === "SREDNIA" && (k.zastrzezenia || []).length) uwagi.push(`kontrola: ${k.zastrzezenia[0].slice(0, 220)}`);
  const zgodneKonsylium = (firma.konsylium || []).filter((x) => x.zgoda === true).length;
  if (zgodneKonsylium) uwagi.push(`konsylium: ${zgodneKonsylium} model(e) zgodne`);
  if (status === "SREDNIA" && najslabsze.length) uwagi.push(`tylko źródło medialne albo pośrednie dla: ${najslabsze.join(", ")} (WYSOKA wymaga rejestru albo strony IR)`);
  return { status, konflikty: [...new Set(konflikty)], uwagi, poziomZrodel: poziomKontroli };
}

export function normalizujKrajOdModelu(kod) {
  const k = String(kod || "").trim().toUpperCase();
  if (k === "UK") return "GB";
  if (k === "USA") return "US";
  if (k === "??" || k === "?") return "";
  return k.length === 2 ? k : "";
}

export { normalizujNazwe };
