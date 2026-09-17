// Klienci rejestrów publicznych. Wszystko bez kluczy, wszystko sprawdzone na żywo 2026-09-17.
//  - Biała Lista VAT MF: NIP -> nazwa, KRS, REGON, adres (limit: 100 zapytań/dobę, 30 NIP-ów na zapytanie)
//  - KRS (api-krs.ms.gov.pl): odpis aktualny i pełny w JSON (bez wyszukiwania po nazwie/NIP)
//  - Bankier: tabela akcjonariatu spółek z GPW (scraping HTML, tylko trop; źródłem finalnym są raporty spółki)
import fs from "node:fs";
import path from "node:path";
import { KATALOG_PARTII, dzisiaj } from "./env.mjs";
import { normalizujKrs, normalizujNip } from "./tekst.mjs";

const UA = "czypolskafirma-automat/1.0 (+https://czypolskafirma.pl; kontakt przez formularz na stronie)";
const ODSTEP_MS = 1100; // grzecznie: ok. 1 zapytanie na sekundę do każdego rejestru
const ostatnie = new Map();

async function odczekaj(klucz) {
  const t = ostatnie.get(klucz) || 0;
  const czekaj = t + ODSTEP_MS - Date.now();
  if (czekaj > 0) await new Promise((r) => setTimeout(r, czekaj));
  ostatnie.set(klucz, Date.now());
}

async function pobierzJson(url, klucz, opcje = {}) {
  await odczekaj(klucz);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opcje.timeoutMs || 30000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctrl.signal });
    const tekst = await r.text();
    if (!r.ok) return { blad: `HTTP ${r.status}`, tresc: tekst.slice(0, 200) };
    try {
      return { dane: JSON.parse(tekst) };
    } catch {
      return { blad: "nie-JSON", tresc: tekst.slice(0, 200) };
    }
  } catch (e) {
    return { blad: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Biała Lista VAT (MF) ----------

// Licznik zapytań do Białej Listy (limit MF: 100 zapytań na dobę na adres IP).
// Panel pokazuje, ile jeszcze zostało na dziś; plik jest poza gitem.
const PLIK_LICZNIKA = path.join(KATALOG_PARTII, "mf-licznik.json");
export const LIMIT_MF_NA_DOBE = 100;

export function mfLicznik() {
  try {
    const l = JSON.parse(fs.readFileSync(PLIK_LICZNIKA, "utf8"));
    if (l.data === dzisiaj()) return { data: l.data, zapytan: l.zapytan || 0, zostalo: Math.max(0, LIMIT_MF_NA_DOBE - (l.zapytan || 0)) };
  } catch {}
  return { data: dzisiaj(), zapytan: 0, zostalo: LIMIT_MF_NA_DOBE };
}

function zliczZapytanieMf() {
  try {
    const l = mfLicznik();
    fs.mkdirSync(path.dirname(PLIK_LICZNIKA), { recursive: true });
    fs.writeFileSync(PLIK_LICZNIKA, JSON.stringify({ data: l.data, zapytan: l.zapytan + 1 }), "utf8");
  } catch {}
}

export async function mfPoNipach(nipy, data) {
  const lista = [...new Set(nipy.map(normalizujNip).filter((n) => n.length === 10))];
  const wynik = {};
  for (let i = 0; i < lista.length; i += 30) {
    const paczka = lista.slice(i, i + 30);
    const url = `https://wl-api.mf.gov.pl/api/search/nips/${paczka.join(",")}?date=${data}`;
    zliczZapytanieMf();
    const r = await pobierzJson(url, "mf");
    if (r.blad) {
      for (const n of paczka) wynik[n] = { blad: r.blad };
      continue;
    }
    for (const wpis of r.dane?.result?.entries || []) {
      const s = wpis.subjects?.[0];
      wynik[wpis.identifier] = s
        ? {
            nazwa: s.name,
            nip: s.nip,
            krs: s.krs ? normalizujKrs(s.krs) : null,
            regon: s.regon,
            statusVat: s.statusVat,
            adres: s.workingAddress || s.residenceAddress || null,
            dataRejestracji: s.registrationLegalDate || null,
            dataWykreslenia: s.removalDate || null,
          }
        : { brak: true, blad: (wpis.error && wpis.error.message) || "brak podmiotu w wykazie" };
    }
    for (const n of paczka) if (!wynik[n]) wynik[n] = { brak: true };
  }
  return wynik;
}

// ---------- KRS ----------

function tekstUdzialow(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function czyscOsobe(o) {
  // W odpisach nazwiska osób fizycznych bywają zamaskowane; nie przechowujemy danych osobowych,
  // tylko liczbę osób w organie.
  return o ? 1 : 0;
}

export async function krsOdpisAktualny(krs) {
  const nr = normalizujKrs(krs);
  if (nr.length !== 10) return { blad: "zły numer KRS" };
  const r = await pobierzJson(`https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/${nr}?rejestr=P&format=json`, "krs");
  if (r.blad) return { blad: r.blad === "HTTP 404" ? "brak podmiotu w rejestrze przedsiębiorców (404)" : r.blad };
  const o = r.dane?.odpis;
  if (!o?.dane?.dzial1) return { blad: "nieoczekiwana struktura odpisu" };
  const d1 = o.dane.dzial1, d2 = o.dane.dzial2 || {}, d3 = o.dane.dzial3 || {};
  const pod = d1.danePodmiotu || {};
  // Osoby fizyczne w odpisie mają zamaskowane nazwiska (np. "P******"); nie przechowujemy danych osobowych.
  const nazwaWspolnika = (w) => w.nazwa || (w.nazwisko || w.imiona ? "osoba fizyczna (nazwisko zamaskowane w API KRS)" : null);
  const wspolnicy = (d1.wspolnicySpzoo || []).map((w) => ({
    nazwa: nazwaWspolnika(w),
    krs: w.krs?.krs && w.krs.krs !== "0000000000" ? w.krs.krs : null,
    regon: w.identyfikator?.regon || null,
    udzialy: tekstUdzialow(w.posiadaneUdzialy),
    calosc: w.czyPosiadaCaloscUdzialow === true,
  }));
  const jedyny = (d1.jedynyAkcjonariusz || []).map((w) => ({
    nazwa: nazwaWspolnika(w),
    krs: w.krs?.krs && w.krs.krs !== "0000000000" ? w.krs.krs : null,
    calosc: w.czyPosiadaCaloscAkcji === true,
  }));
  const emisje = (d1.emisjeAkcji || []).map((e) => ({
    seria: e.nazwaSeriiAkcji || null,
    liczba: e.liczbaAkcjiWSerii || null,
    uprzywilejowanie:
      e.czyAkcjeUprzywilejowaneLiczbaAkcjiRodzajUprzywilejowania && !/NIE S[ĄA] UPRZYWILEJOWANE|BRAK/i.test(String(e.czyAkcjeUprzywilejowaneLiczbaAkcjiRodzajUprzywilejowania))
        ? String(e.czyAkcjeUprzywilejowaneLiczbaAkcjiRodzajUprzywilejowania).replace(/\s+/g, " ").slice(0, 200)
        : null,
  }));
  return {
    krs: nr,
    nazwa: pod.nazwa || null,
    nip: pod.identyfikatory?.nip || null,
    regon: pod.identyfikatory?.regon || null,
    formaPrawna: pod.formaPrawna || null,
    stanZDnia: o.naglowekA?.stanZDnia || null,
    dataRejestracji: o.naglowekA?.dataRejestracjiWKRS || null,
    ostatniWpis: o.naglowekA?.numerOstatniegoWpisu || null,
    siedziba: d1.siedzibaIAdres?.siedziba
      ? [d1.siedzibaIAdres.siedziba.miejscowosc, d1.siedzibaIAdres.siedziba.kraj].filter(Boolean).join(", ")
      : null,
    kapitalZakladowy: d1.kapital?.wysokoscKapitaluZakladowego
      ? `${d1.kapital.wysokoscKapitaluZakladowego.wartosc} ${d1.kapital.wysokoscKapitaluZakladowego.waluta}`
      : null,
    liczbaAkcjiUdzialow: d1.kapital?.lacznaLiczbaAkcjiUdzialow || null,
    wspolnicy,
    jedynyAkcjonariusz: jedyny,
    emisjeAkcji: emisje,
    liczbaCzlonkowZarzadu: (d2.reprezentacja?.sklad || []).reduce((a, o) => a + czyscOsobe(o), 0),
    organNadzoru: (d2.organNadzoru || []).map((x) => x.nazwa).filter(Boolean),
    pkdPrzewazajace: d3.przedmiotDzialalnosci?.przedmiotPrzewazajacejDzialalnosci?.[0]
      ? `${d3.przedmiotDzialalnosci.przedmiotPrzewazajacejDzialalnosci[0].kodDzial || ""} ${d3.przedmiotDzialalnosci.przedmiotPrzewazajacejDzialalnosci[0].opis || ""}`.trim()
      : null,
    sprawozdaniaGrupy: Array.isArray(d3.sprawozdaniaGrupyKapitalowej) && d3.sprawozdaniaGrupyKapitalowej.length > 0,
    zrodloUrl: `https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/${nr}?rejestr=P&format=json`,
  };
}

// Historia wspólników / jedynego akcjonariusza z odpisu pełnego, z datami wpisów.
export async function krsHistoriaWlascicieli(krs) {
  const nr = normalizujKrs(krs);
  const r = await pobierzJson(`https://api-krs.ms.gov.pl/api/krs/OdpisPelny/${nr}?rejestr=P&format=json`, "krs", { timeoutMs: 60000 });
  if (r.blad) return { blad: r.blad };
  const o = r.dane?.odpis;
  const wpisy = new Map((o?.naglowekP?.wpis || []).map((w) => [Number(w.numerWpisu), w.dataWpisu]));
  const dataWpisu = (n) => (n ? wpisy.get(Number(n)) || null : null);
  const zbierz = (lista, poleUdzialow) =>
    (lista || []).flatMap((w) => {
      const nazwy = Array.isArray(w.nazwa) ? w.nazwa : Array.isArray(w.nazwisko) ? w.nazwisko.map((x) => ({ ...x, nazwa: "osoba fizyczna (nazwisko zamaskowane w API KRS)" })) : [];
      return nazwy.map((n) => ({
        nazwa: n.nazwa,
        od: dataWpisu(n.nrWpisuWprow),
        do: dataWpisu(n.nrWpisuWykr),
        wpisWprow: n.nrWpisuWprow ? Number(n.nrWpisuWprow) : null,
        wpisWykr: n.nrWpisuWykr ? Number(n.nrWpisuWykr) : null,
        udzialy: (w[poleUdzialow] || []).map((u) => tekstUdzialow(u[poleUdzialow])).filter(Boolean).slice(-1)[0] || null,
      }));
    });
  const historia = [
    ...zbierz(o?.dane?.dzial1?.wspolnicySpzoo, "posiadaneUdzialy"),
    ...zbierz(o?.dane?.dzial1?.jedynyAkcjonariusz, "posiadaneUdzialy"),
  ].sort((a, b) => (a.wpisWprow || 0) - (b.wpisWprow || 0));
  return { historia, liczbaWpisow: wpisy.size, zrodloUrl: `https://api-krs.ms.gov.pl/api/krs/OdpisPelny/${nr}?rejestr=P&format=json` };
}

// ---------- Bankier: akcjonariat spółek giełdowych ----------

export async function bankierAkcjonariat(ticker) {
  const t = String(ticker || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!t) return { blad: "brak tickera" };
  await odczekaj("bankier");
  const url = `https://www.bankier.pl/gielda/notowania/akcje/${t}/akcjonariat`;
  let html;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36" } });
    if (!r.ok) return { blad: `HTTP ${r.status}`, url };
    html = await r.text();
  } catch (e) {
    return { blad: e.message, url };
  }
  const akcjonariusze = [];
  const wiersze = html.matchAll(/<tr[^>]*>\s*<td><span class="a-span">([^<]+)<\/span><\/td>\s*<td><span class="a-quote-item -value">([^<]*)<\/span><span class="a-span -hint">\(([^)]+)\)<\/span><\/td>\s*<td><span class="a-quote-item -value">([^<]*)<\/span><span class="a-span -hint">\(([^)]+)\)<\/span><\/td>\s*<td>([^<]*)<\/td>/g);
  for (const m of wiersze) {
    const proc = (s) => Number(String(s).replace("%", "").replace(",", ".").trim()) || null;
    akcjonariusze.push({
      nazwa: m[1].trim(),
      procKapitalu: proc(m[3]),
      procGlosow: proc(m[5]),
      dataZmiany: /\d{4}-\d{2}-\d{2}/.test(m[6]) ? m[6].trim() : null,
    });
  }
  if (!akcjonariusze.length) return { blad: "nie znaleziono tabeli akcjonariatu (zmiana układu strony albo zły ticker)", url };
  return { akcjonariusze, url, pobrano: new Date().toISOString().slice(0, 10) };
}
