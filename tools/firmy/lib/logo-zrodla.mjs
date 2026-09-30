// Kandydaci na logo firmy z kilku darmowych źródeł: strona firmy, Wikipedia (Wikidata)
// i serwisy z ikonkami stron. Używane przez panel (przycisk „Inne źródła” w kroku 8)
// i automat tools/fetch-logos.mjs. Moduł niczego nie zapisuje na dysk.
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let sharp = null;
try { sharp = require("sharp"); } catch {}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
// Wikimedia wymaga opisowego User-Agenta z adresem kontaktowym projektu.
const UA_WIKI = "CzyPolskaFirma-panel/1.0 (https://czypolskafirma.pl)";
const MAX_BAJTOW = 6 * 1024 * 1024;
export const FORMATY_LOGO = ["png", "jpg", "webp", "svg"];

/** Prawdziwy format po pierwszych bajtach: png | jpg | webp | gif | ico | svg | null */
export function formatObrazka(b) {
  if (!b || b.length < 12) return null;
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return "png";
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.toString("ascii", 0, 3) === "GIF") return "gif";
  if (b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return "ico";
  const tekst = b.toString("utf8", 0, Math.min(b.length, 8192)).trimStart().toLowerCase();
  if (tekst.includes("<svg") && !tekst.startsWith("<!doctype html") && !tekst.startsWith("<html")) return "svg";
  return null;
}

/** SVG ze skryptami albo aktywnymi elementami nie trafia na stronę (ta sama reguła co ręczna podmiana). */
export function svgNiebezpieczne(b) {
  return /<script|\bon[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object/i.test(b.toString("utf8"));
}

async function pobierz(url, { timeout = 8000, naglowki = {}, tekst = false } = {}) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: tekst ? "text/html,*/*" : "image/*,*/*", ...naglowki }, redirect: "follow", signal: AbortSignal.timeout(timeout) });
    if (!r.ok) return null;
    const dlugosc = Number(r.headers.get("content-length") || 0);
    if (dlugosc > MAX_BAJTOW) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BAJTOW) return null;
    return { buf, url: r.url, typ: r.headers.get("content-type") || "" };
  } catch {
    return null;
  }
}

function liczbaPx(v) {
  const m = String(v || "").match(/^\s*([\d.]+)\s*(px)?\s*$/i);
  return m ? Math.round(Number(m[1])) : null;
}

async function wymiary(dane, format) {
  if (format === "svg") {
    const tag = (dane.toString("utf8", 0, 8192).match(/<svg\b[^>]*>/i) || [""])[0];
    const w = liczbaPx((tag.match(/\bwidth=["']([^"']+)["']/i) || [])[1]);
    const h = liczbaPx((tag.match(/\bheight=["']([^"']+)["']/i) || [])[1]);
    if (w && h) return { szer: w, wys: h };
    const vb = (tag.match(/\bviewBox=["']([^"']+)["']/i) || [])[1];
    if (vb) { const [, , vw, vh] = vb.trim().split(/[\s,]+/).map(Number); if (vw && vh) return { szer: Math.round(vw), wys: Math.round(vh) }; }
    return { szer: null, wys: null };
  }
  if (sharp) { try { const m = await sharp(dane).metadata(); return { szer: m.width || null, wys: m.height || null }; } catch {} }
  if (format === "png") return { szer: dane.readUInt32BE(16), wys: dane.readUInt32BE(20) };
  return { szer: null, wys: null };
}

/**
 * Czy logo jest białe (na białym tle strony byłoby niewidoczne). Rasteryzuje też SVG.
 * Z przezroczystym tłem: prawie wszystkie widoczne piksele jasne. Bez przezroczystości:
 * cały obrazek jasny. null, gdy nie da się ocenić (brak biblioteki sharp).
 */
export async function czyBiale(dane) {
  if (!sharp) return null;
  try {
    const { data, info } = await sharp(dane, { density: 72 }).ensureAlpha().resize(96, 96, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
    let widoczne = 0, jasne = 0, przezroczyste = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i + 3] < 128) { przezroczyste++; continue; }
      widoczne++;
      if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] > 225) jasne++;
    }
    if (!widoczne) return true;
    const wszystkie = widoczne + przezroczyste;
    return przezroczyste / wszystkie > 0.1 ? jasne / widoczne >= 0.9 : jasne / widoczne >= 0.995;
  } catch {
    return null;
  }
}

// ---------- strona firmy ----------

function atrybuty(tag) {
  const a = {};
  for (const m of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) a[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? "";
  return a;
}

function najwiekszyZSrcset(srcset) {
  let naj = null, najW = -1;
  for (const czesc of String(srcset || "").split(",")) {
    const [u, opis] = czesc.trim().split(/\s+/);
    if (!u) continue;
    const w = parseFloat(opis) || 1;
    if (w > najW) { naj = u; najW = w; }
  }
  return naj;
}

function zDataUri(uri) {
  const m = String(uri).match(/^data:image\/(svg\+xml|png|jpeg|webp)(;base64)?,(.*)$/is);
  if (!m) return null;
  try { return m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]), "utf8"); } catch { return null; }
}

// samo „brand” łapało np. „superbrands” (zdjęcie produktu z nagrodą), więc tylko navbar-brand
const SLOWO_LOGO = /logo|navbar-brand|site-title/i;
// wersje logo na ciemne tło, zwykle z częściowo białym napisem
const JASNA_WERSJA = /[-_. ](light|white|negatyw|negative|inverse|inverted|biale|bialy|dark-bg)[-_. ]/i;

async function zeStrony(www, domena) {
  const adresy = [www && /^https?:\/\//i.test(www) ? www : null, `https://${domena}`, `https://www.${domena}`].filter(Boolean);
  let strona = null;
  for (const a of [...new Set(adresy)]) { strona = await pobierz(a, { tekst: true, timeout: 10000 }); if (strona) break; }
  // Strona-zwrotnica (meta refresh albo window.location w krótkim HTML): idziemy dalej, najwyżej 2 razy.
  for (let skok = 0; strona && skok < 2 && strona.buf.length < 8000; skok++) {
    const t = strona.buf.toString("latin1");
    const cel = (t.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>\s]+)/i) || t.match(/(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!cel) break;
    let adres;
    try { adres = new URL(cel, strona.url).href; } catch { break; }
    const dalej = await pobierz(adres, { tekst: true, timeout: 10000 });
    if (!dalej) break;
    strona = dalej;
  }
  if (!strona) return [];
  const html = strona.buf.toString("utf8").slice(0, 2_000_000);
  const male = html.toLowerCase();
  const baza = strona.url;
  const absolutny = (u) => { try { return new URL(u.trim(), baza).href; } catch { return null; } };
  const wynik = [];
  const dodaj = (k) => { if (k.url && wynik.some((x) => x.url === k.url)) return; wynik.push(k); };

  // <img> z „logo” w adresie, opisie, klasie albo w klasie/ID elementu tuż przed nim (<a class="logo"><img>)
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const a = atrybuty(m[0]);
    const przed = html.slice(Math.max(0, m.index - 300), m.index);
    const wlasny = [a.src, a["data-src"], a["data-lazy-src"], a.alt, a.class, a.id, a.title].join(" ");
    const otoczenie = (przed.match(/<[a-z][^<>]*$/i) || przed.match(/<[a-z][^<>]*>\s*$/i) || [""])[0];
    if (!SLOWO_LOGO.test(wlasny) && !/(class|id)=["'][^"']*logo/i.test(otoczenie)) continue;
    const src = najwiekszyZSrcset(a.srcset || a["data-srcset"]) || a["data-src"] || a["data-lazy-src"] || a.src;
    if (!src) continue;
    const wNaglowku = male.lastIndexOf("<header", m.index) > male.lastIndexOf("</header>", m.index);
    if (src.startsWith("data:")) { const dane = zDataUri(src); if (dane) dodaj({ dane, zrodlo: "Strona firmy", opis: "obrazek logo w kodzie strony", rodzaj: "logo", waga: wNaglowku ? 0 : 1, tekst: wlasny }); continue; }
    dodaj({ url: absolutny(src), zrodlo: "Strona firmy", opis: wNaglowku ? "logo z nagłówka strony" : "obrazek z „logo” w nazwie", rodzaj: "logo", waga: wNaglowku ? 0 : 1, tekst: wlasny });
    if (wynik.length >= 10) break;
  }

  // grafika SVG wklejona w kod strony (często logo w nagłówku)
  let svgi = 0;
  for (const m of html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)) {
    const otwarcie = m[0].slice(0, m[0].indexOf(">") + 1);
    const przed = html.slice(Math.max(0, m.index - 300), m.index);
    if (!SLOWO_LOGO.test(otwarcie) && !/(class|id|aria-label|title)=["'][^"']*logo[^"']*["'][^<>]*>\s*(<[^<>]*>\s*){0,2}$/i.test(przed)) continue;
    if (m[0].length < 300 || /<use\b/i.test(m[0])) continue; // ikonki i odwołania do zewnętrznych symboli
    let svg = m[0];
    if (!/xmlns=/i.test(otwarcie)) svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    dodaj({ dane: Buffer.from(svg, "utf8"), zrodlo: "Strona firmy", opis: "grafika SVG z kodu strony", rodzaj: "logo", waga: 0, tekst: otwarcie + przed.slice(-200) });
    if (++svgi >= 3) break;
  }

  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = atrybuty(m[0]);
    const rel = (a.rel || "").toLowerCase();
    if (!a.href) continue;
    if (rel.includes("apple-touch-icon")) dodaj({ url: absolutny(a.href), zrodlo: "Strona firmy", opis: "ikona strony dla telefonów", rodzaj: "ikonka", waga: 2 });
    else if (rel.includes("icon") && (/svg/i.test(a.type || "") || /\.svg(\?|$)/i.test(a.href))) dodaj({ url: absolutny(a.href), zrodlo: "Strona firmy", opis: "ikona strony (SVG)", rodzaj: "ikonka", waga: 2 });
  }
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = atrybuty(m[0]);
    if (/^(og:image|twitter:image)$/i.test(a.property || a.name || "") && a.content) { dodaj({ url: absolutny(a.content), zrodlo: "Strona firmy", opis: "obrazek do udostępniania (często baner)", rodzaj: "obrazek", waga: 3 }); break; }
  }
  return wynik;
}

// ---------- Wikipedia (Wikidata: oficjalna strona → logo P154) ----------

const plikCommons = (nazwa) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(nazwa)}`;

async function wikidataJson(url) {
  const r = await pobierz(url, { naglowki: { "User-Agent": UA_WIKI, Accept: "application/json" }, timeout: 10000 });
  try { return r ? JSON.parse(r.buf.toString("utf8")) : null; } catch { return null; }
}

async function zWikipedii(domena, nazwa) {
  const wynik = [];
  const iri = [domena, `www.${domena}`].flatMap((h) => [`https://${h}/`, `https://${h}`, `http://${h}/`, `http://${h}`]).map((u) => `<${u}>`).join(" ");
  const zapytanie = `SELECT ?f ?fLabel ?logo WHERE { VALUES ?w { ${iri} } ?f wdt:P856 ?w ; wdt:P154 ?logo . SERVICE wikibase:label { bd:serviceParam wikibase:language "pl,en". } } LIMIT 3`;
  const j = await wikidataJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(zapytanie)}`);
  for (const b of j?.results?.bindings || []) {
    wynik.push({ url: b.logo.value.replace(/^http:/, "https:"), zrodlo: "Wikipedia", opis: `logo z Wikipedii (${b.fLabel?.value || "firma"}, dopasowane po adresie strony)`, rodzaj: "logo", waga: 0, pewne: true });
  }
  if (wynik.length || !nazwa) return wynik;
  // Bez dopasowania po adresie: szukamy po nazwie. To może być inna firma, więc tylko do ręcznego wyboru.
  const s = await wikidataJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=pl&uselang=pl&type=item&limit=3&search=${encodeURIComponent(nazwa)}`);
  const ids = (s?.search || []).map((x) => x.id);
  if (!ids.length) return wynik;
  const e = await wikidataJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels|descriptions&languages=pl|en&ids=${ids.join("|")}`);
  for (const id of ids) {
    const byt = e?.entities?.[id];
    const plik = byt?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
    if (!plik) continue;
    const etykieta = byt.labels?.pl?.value || byt.labels?.en?.value || id;
    const opisBytu = byt.descriptions?.pl?.value || byt.descriptions?.en?.value || "";
    wynik.push({ url: plikCommons(plik), zrodlo: "Wikipedia", opis: `znalezione po nazwie: ${etykieta}${opisBytu ? ` (${opisBytu})` : ""}. Sprawdź, czy to ta firma`, rodzaj: "logo", waga: 1, pewne: false });
  }
  return wynik;
}

// ---------- serwisy z ikonkami (ostatnia deska ratunku) ----------

function ikonkiDomeny(domena) {
  return [
    { url: `https://icon.horse/icon/${domena}`, zrodlo: "icon.horse", opis: "ikonka strony", rodzaj: "ikonka", waga: 4 },
    { url: `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domena}&size=256`, zrodlo: "Google", opis: "ikonka strony", rodzaj: "ikonka", waga: 5 },
    { url: `https://unavatar.io/${domena}?fallback=false`, zrodlo: "unavatar", opis: "ikonka strony", rodzaj: "ikonka", waga: 5 },
  ];
}

// ---------- razem ----------

const KOLEJNOSC_RODZAJU = { logo: 0, obrazek: 1, ikonka: 2 };

// "Kołacz na Okrągło" → ["kolacz", "okraglo"]; słowa krótsze niż 4 znaki i ogólne pomijamy.
const OGOLNE = new Set(["polska", "polski", "group", "grupa", "sklep", "firma", "restauracja", "pizza", "food", "foods", "spolka", "ograniczona", "odpowiedzialnoscia", "akcyjna", "komandytowa", "jawna", "cywilna"]);
const bezOgonkow = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase();
function slowaNazwy(nazwa) {
  return bezOgonkow(nazwa).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !OGOLNE.has(w));
}

/**
 * Wszyscy kandydaci, od najlepszego. Każdy: { zrodlo, opis, rodzaj (logo|obrazek|ikonka),
 * pewne, format, szer, wys, bajtow, dane (Buffer), url }. Odrzuca pliki, które nie są
 * PNG/JPG/WebP/SVG, niebezpieczne SVG, puste obrazki i duplikaty.
 */
export async function kandydaciLogo({ domena, www, nazwa, ikonki = true } = {}) {
  const [strona, wiki] = await Promise.all([zeStrony(www, domena).catch(() => []), zWikipedii(domena, nazwa).catch(() => [])]);
  const slowa = slowaNazwy(nazwa);
  // Strona grupy z kilkoma markami (np. Sweet Gallery): logo z nazwą tej marki w adresie albo opisie idzie pierwsze.
  // (tylko ścieżka pliku, bez domeny: domena marki pasowałaby do każdego obrazka ze strony)
  const sciezka = (u) => { try { return new URL(u).pathname; } catch { return ""; } };
  for (const k of strona) k.pasuje = k.rodzaj === "logo" && slowa.some((w) => bezOgonkow(`${sciezka(k.url)} ${String(k.tekst || "").replace(/(https?:)?\/\/[^/\s"']+/gi, "")}`).includes(w));
  const wszystkie = [...strona, ...wiki, ...(ikonki ? ikonkiDomeny(domena) : [])];
  const wyniki = await Promise.all(wszystkie.map(async (k) => {
    let dane = k.dane;
    if (!dane) {
      const r = await pobierz(k.url, k.zrodlo === "Wikipedia" ? { naglowki: { "User-Agent": UA_WIKI }, timeout: 10000 } : {});
      dane = r?.buf;
    }
    if (!dane || dane.length < 300) return null;
    const format = formatObrazka(dane);
    if (!FORMATY_LOGO.includes(format)) return null;
    if (format === "svg" && svgNiebezpieczne(dane)) return null;
    const w = await wymiary(dane, format);
    if (format !== "svg" && w.szer && w.wys && Math.max(w.szer, w.wys) < 16) return null;
    const biale = (await czyBiale(dane)) || (k.url ? JASNA_WERSJA.test(decodeURIComponent(new URL(k.url).pathname).replace(/\.[a-z]+$/i, ".")) : false);
    // malutki SVG (np. 24×24) to ikonka z menu, nie logo
    const rodzaj = k.rodzaj === "logo" && format === "svg" && w.szer && w.wys && Math.max(w.szer, w.wys) <= 48 ? "ikonka" : k.rodzaj;
    return { pewne: true, ...k, rodzaj, dane, format, ...w, bajtow: dane.length, biale, skrot: crypto.createHash("sha1").update(dane).digest("hex") };
  }));
  const widziane = new Set();
  const lista = wyniki.filter((k) => k && !widziane.has(k.skrot) && widziane.add(k.skrot));
  const pole = (k) => (k.format === "svg" ? 1e9 : (k.szer || 0) * (k.wys || 0));
  // białe logo na końcu swojej grupy: na stronie (białe tło) byłoby niewidoczne
  lista.sort((a, b) => KOLEJNOSC_RODZAJU[a.rodzaj] - KOLEJNOSC_RODZAJU[b.rodzaj] || !!b.pasuje - !!a.pasuje || !!a.biale - !!b.biale || (a.waga ?? 9) - (b.waga ?? 9) || pole(b) - pole(a));
  for (const k of lista) delete k.tekst;
  return lista;
}

/**
 * Dla automatu: najlepsze pewne logo (ze strony firmy albo z Wikipedii po adresie strony),
 * w SVG albo co najmniej 120 px w dłuższym boku, nie białe. null, gdy nic takiego nie ma.
 */
export async function najlepszeLogo({ domena, www, nazwa }) {
  const lista = await kandydaciLogo({ domena, www, nazwa, ikonki: false });
  const dobre = lista.filter((k) => k.rodzaj === "logo" && k.pewne && k.biale !== true && (k.format === "svg" || Math.max(k.szer || 0, k.wys || 0) >= 120));
  // Kilka różnych logotypów ze strony i żaden z nazwą marki: to pewnie strona grupy albo lista
  // marek. Bierzemy tylko to z nagłówka albo z Wikipedii; resztę zostawiamy do ręcznego wyboru.
  const zeStrony = dobre.filter((k) => k.zrodlo === "Strona firmy");
  return dobre.find((k) => k.pasuje) || (zeStrony.length > 1 ? dobre.find((k) => k.waga === 0) : dobre[0]) || null;
}
