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

export function zlozRekord(f, { kategorie, dzisiaj: DZIS }) {
  const t = f.tozsamosc || {}, s = f.sledztwo || {}, o = f.opisy || {};
  // Ogniwa potwierdzone w KRS (wspólnik / jedyny akcjonariusz / sama spółka) dostają KRS jako źródło,
  // jeśli model go nie podał albo podał słabsze (agregator, media): fakt z rejestru to poziom 1.
  // Podmieniony link zostaje na liście źródeł.
  const rej = f.rejestr && !f.rejestr.blad ? f.rejestr : null;
  if (rej && Array.isArray(s.lancuch)) {
    const wKrs = [...(rej.wspolnicy || []), ...(rej.jedynyAkcjonariusz || [])];
    for (const og of s.lancuch) {
      if (og.zrodlo_url && poziomZrodla(og.zrodlo_url) <= 1) continue;
      const toSpolka = og.rola === "spolka_polska" || podobienstwoNazw(og.podmiot, rej.nazwa) >= 0.7;
      const wspolnik = wKrs.find((w) => w.nazwa && podobienstwoNazw(og.podmiot, w.nazwa) >= 0.6);
      if (toSpolka || wspolnik) {
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
  if (t.istniejeWBazie) {
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

