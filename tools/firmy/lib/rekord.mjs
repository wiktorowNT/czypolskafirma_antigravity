// Składa finalny rekord z etapów (tożsamość, rejestr, śledztwo, kontrola, opisy),
// waliduje go i wylicza pewność. Używane przez automat.mjs i przeglad.mjs (po edycji/konsylium).
import { normalizujKrs, normalizujNip, podobienstwoNazw, slugify, usunMyslniki } from "./tekst.mjs";
import { ocenPewnosc, poziomZrodla, walidujRekord } from "./walidacja.mjs";

// Data wpisu do KRS (DD.MM.RRRR) jako founded_at (RRRR-MM-DD). Wpisy sprzed 2004 roku to
// zwykle masowe przerejestrowania z rejestru handlowego do KRS (2001–2003), nie data
// założenia firmy; wtedy zostawiamy puste do ręcznego uzupełnienia w przeglądzie.
export function dataZalozeniaZKrs(data) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(data || "").trim());
  if (!m || Number(m[3]) < 2004) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// "46 150,00", "4.500,00", "50.000", "3750000" → liczba
function liczbaPl(t) {
  let s = String(t || "").replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Procent kapitału wspólnika z opisu KRS ("923 UDZIAŁY O ŁĄCZNEJ WARTOŚCI 46 150,00 ZŁ") i kapitału.
export function procentUdzialow(w, rej) {
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

const ZAMASKOWANA = /nazwisko zamaskowane/i;

export function zlozRekord(f, { kategorie, dzisiaj: DZIS }) {
  const t = f.tozsamosc || {}, s = f.sledztwo || {}, o = f.opisy || {};
  // Ogniwa potwierdzone w KRS (wspólnik / jedyny akcjonariusz / sama spółka) dostają KRS jako źródło,
  // jeśli model go nie podał albo podał słabsze (agregator, media): fakt z rejestru to poziom 1.
  // Podmieniony link zostaje na liście źródeł.
  const rej = f.rejestr && !f.rejestr.blad ? f.rejestr : null;
  if (rej && Array.isArray(s.lancuch)) {
    const wKrs = [...(rej.wspolnicy || []), ...(rej.jedynyAkcjonariusz || [])];
    // Wspólnicy-osoby mają w API KRS ukryte nazwiska, a model podaje prawdziwe, więc po nazwie
    // się nie połączą. Łączymy po procencie (pojedynczo albo łącznie), gdy kraj ogniwa zgadza się
    // z obywatelstwem w CRBR. Ostateczny właściciel ze źródłem (np. media o tożsamości) zostaje.
    const osoby = wKrs.filter((w) => ZAMASKOWANA.test(w.nazwa || "")).map((w) => procentUdzialow(w, rej)).filter((x) => x != null);
    const sumaOsob = osoby.reduce((a, b) => a + b, 0);
    const obywatelstwa = (String(f.crbr?.podsumowanie || "").match(/obywatelstwa:\s*([A-Z, ]+)/) || [, ""])[1].split(",").map((x) => x.trim()).filter(Boolean);
    const osobaZKrs = (og) => {
      if (!osoby.length || !["kontrolujacy", "mniejszosciowy", "ostateczny"].includes(og.rola)) return false;
      if (og.rola === "ostateczny" && og.zrodlo_url) return false;
      if (obywatelstwa.length ? !obywatelstwa.includes(og.kraj) : og.kraj !== "PL") return false;
      const proc = og.proc_glosow ?? og.proc_kapitalu;
      return proc != null && (osoby.some((x) => Math.abs(x - proc) <= 1.5) || Math.abs(sumaOsob - proc) <= 1.5);
    };
    for (const og of s.lancuch) {
      if (og.zrodlo_url && poziomZrodla(og.zrodlo_url) <= 1) continue;
      const toSpolka = og.rola === "spolka_polska" || podobienstwoNazw(og.podmiot, rej.nazwa) >= 0.7;
      const wspolnik = wKrs.find((w) => w.nazwa && podobienstwoNazw(og.podmiot, w.nazwa) >= 0.6);
      if (toSpolka || wspolnik || osobaZKrs(og)) {
        if (og.zrodlo_url) s.zrodla = [...(s.zrodla || []), { url: og.zrodlo_url, tytul: og.zrodlo_tytul || null, data: og.stan_na || null, czego_dotyczy: `${og.podmiot} (trop, zastąpiony odpisem KRS)` }];
        og.zrodlo_url = rej.zrodloUrl;
        og.zrodlo_tytul = `KRS ${rej.krs}, odpis aktualny (stan ${rej.stanZDnia})`;
        og.stan_na = og.stan_na || rej.stanZDnia;
        if (wspolnik && wspolnik.calosc && og.proc_glosow == null) og.proc_glosow = 100;
      }
    }
  }
  const nazwaMarki = o.display_name || f.nazwa;
  const kat = kategorie.find((k) => k.slug === (o.category_slug || f.kategoriaSeed)) || null;
  const brands = (o.brands || []).filter((b) => b?.name).map((b) => (b.domain ? { name: b.name, domain: String(b.domain).replace(/^https?:\/\//, "").replace(/\/.*$/, "") } : { name: b.name }));
  f.rekord = {
    name: t.mf?.nazwa || t.nazwa_spolki || f.nazwa,
    display_name: nazwaMarki,
    slug: slugify(nazwaMarki),
    nip: t.nip || null,
    krs: t.krs || null,
    country_code: s.country_code || null,
    owner_name: s.ostateczny_wlasciciel || null,
    ownership_description: usunMyslniki(o.ownership_description || ""),
    business_description: usunMyslniki(o.business_description || ""),
    website_url: o.website_url || t.website_url || null,
    registry_url: t.krs ? `https://rejestr.io/krs/${Number(t.krs)}` : t.nip ? `https://rejestr.io/szukaj?q=${t.nip}` : null,
    category_slug: kat?.slug || null,
    category_id: kat?.id || null,
    adres: t.mf?.adres || null,
    siedziba_pl: true,
    vat_czynny: t.mf?.statusVat ? t.mf.statusVat === "Czynny" : null,
    founded_at: dataZalozeniaZKrs(rej?.dataRejestracji),
    ownership_type: s.typ_wlasciciela || null,
    parent_company_name: (s.lancuch || []).find((x) => x.rola === "posrednik" || x.rola === "kontrolujacy")?.podmiot || null,
    brand_aliases: brands.map((b) => b.name).join(", ") || null,
    brands,
    verified_at: DZIS,
    confidence: null,
    sources: [
      ...(f.rejestr && !f.rejestr.blad ? [{ url: f.rejestr.zrodloUrl, tytul: `KRS odpis aktualny (stan ${f.rejestr.stanZDnia})`, data: f.rejestr.stanZDnia, czego_dotyczy: "dane rejestrowe, wspólnicy" }] : []),
      ...(s.zrodla || []),
      ...((s.lancuch || []).filter((x) => x.zrodlo_url).map((x) => ({ url: x.zrodlo_url, tytul: x.zrodlo_tytul || null, data: x.stan_na || null, czego_dotyczy: `${x.podmiot}: ${x.proc_glosow ?? x.proc_kapitalu ?? "?"}%` }))),
    ].filter((z, i, arr) => z.url && arr.findIndex((y) => y.url === z.url) === i),
  };
  f.walidacja = walidujRekord(f.rekord, kategorie);
  const ocena = ocenPewnosc(f);
  f.status = ocena.status;
  f.konflikty = ocena.konflikty;
  const uwagiModelu = [s.uwagi, f.tozsamosc?.uwagi].filter((u) => u && String(u).trim()).map((u) => `model: ${String(u).slice(0, 300)}`);
  const nazwaKrs = String(rej?.nazwa || t.mf?.nazwa || "");
  const spolkaCelowa = /E-?COM|ONLINE|E-?SKLEP|LOGISTY|NIERUCHOMO|SERWIS|FINANC|LEASING|DYSTRYBUC|INVESTMENT|HOLDING|SHARED SERVICES|CENTRUM USŁUG/i.test(nazwaKrs)
    ? [`nazwa spółki z rejestru ("${nazwaKrs}") wygląda na spółkę celową, nie operatora marki; sprawdź, czy NIP wskazuje właściwą spółkę`]
    : [];
  const dataZKrs = f.rekord.founded_at
    ? [`data założenia ${f.rekord.founded_at} to data wpisu spółki do KRS; przy przekształceniu lub nowej spółce operatora marka może być starsza, sprawdź przed importem`]
    : [];
  f.uwagi = [...ocena.uwagi, ...(f.walidacja.ostrzezenia || []), ...(f.uwagiTozsamosci ? [f.uwagiTozsamosci] : []), ...spolkaCelowa, ...dataZKrs, ...uwagiModelu];
  f.rekord.confidence = f.status;
  // reweryfikacja: porównanie z obecnym rekordem
  // Rekord w bazie, znaleziony po NIP-ie albo po marce wymienionej przy innej firmie (np. Maczfit
  // przy Żabce): porównujemy go tylko, gdy to ta sama marka. Inna marka to uwaga, nie konflikt.
  // Ta sama marka = ten sam adres (slug); "Bolt" i "Bolt Food" to różne marki.
  const tenSamRekord = (b) => f.tryb === "reweryfikacja" || slugify(b.slug) === f.rekord.slug;
  if (t.istniejeWBazie && !tenSamRekord(t.istniejeWBazie)) {
    const b = t.istniejeWBazie;
    delete f.porownanie; // nie ma czego porównywać: w bazie jest inna marka
    f.uwagi.push(`marka występuje w bazie przy innym rekordzie: "${b.slug}" (${b.country_code || "?"}, ${b.owner_name || "?"}); import doda ją jako osobną firmę, rekord "${b.slug}" zostanie bez zmian`);
  } else if (t.istniejeWBazie) {
    const b = t.istniejeWBazie;
    f.porownanie = {
      slug: b.slug,
      country_code: { bylo: b.country_code, jest: f.rekord.country_code, zmiana: b.country_code !== f.rekord.country_code },
      owner_name: { bylo: b.owner_name, jest: f.rekord.owner_name, zmiana: podobienstwoNazw(b.owner_name, f.rekord.owner_name) < 0.5 },
      nip: { bylo: b.nip, jest: f.rekord.nip, zmiana: normalizujNip(b.nip) !== f.rekord.nip },
      krs: { bylo: b.krs, jest: f.rekord.krs, zmiana: normalizujKrs(b.krs) !== f.rekord.krs },
    };
    if (f.porownanie.country_code.zmiana) f.konflikty.push(`baza ma ${b.country_code}, automat ${f.rekord.country_code}`);
    if (f.porownanie.owner_name.zmiana) f.konflikty.push(`baza ma właściciela "${b.owner_name}", automat "${f.rekord.owner_name}"`);
    if (f.porownanie.nip.zmiana) f.konflikty.push(`baza ma NIP ${b.nip}, automat ${f.rekord.nip}`);
    if (f.konflikty.length) f.status = "KONFLIKT";
    f.rekord.confidence = f.status;
  }
  if (!f.decyzja) f.decyzja = null;
}

