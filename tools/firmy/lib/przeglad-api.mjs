// Logika przeglądu partii (decyzje, hurtowe zatwierdzanie, konsylium innych modeli).
// Używana przez przeglad.mjs (osobna strona) i panel.mjs (zakładka w panelu).
// Nie dotyka Supabase poza odczytem kategorii — decyzje zapisują się do pliku partii.
import fs from "node:fs";
import { dzisiaj } from "./env.mjs";
import { promptKonsylium } from "./prompty.mjs";
import { zlozRekord } from "./rekord.mjs";
import { normalizujKrajOdModelu, walidujRekord } from "./walidacja.mjs";
import { podobienstwoNazw } from "./tekst.mjs";

export const wczytajPartie = (plik) => JSON.parse(fs.readFileSync(plik, "utf8"));

export function zapiszPartie(plik, partia) {
  partia.zaktualizowano = new Date().toISOString();
  fs.writeFileSync(plik, JSON.stringify(partia, null, 2), "utf8");
}

// Parsowanie odpowiedzi innego modelu (tabela Markdown:
// name | country_code | ultimate_owner | zgoda | uwagi | zrodlo)
export function parsujKonsylium(tekst) {
  const wiersze = [];
  for (const linia of String(tekst || "").split(/\r?\n/)) {
    if (!linia.includes("|")) continue;
    const kom = linia.split("|").map((x) => x.trim());
    if (kom[0] === "") kom.shift();
    if (kom[kom.length - 1] === "") kom.pop();
    if (kom.length < 4) continue;
    if (/^-+$/.test(kom[0].replace(/:/g, "")) || /^name$/i.test(kom[0])) continue;
    wiersze.push({ name: kom[0], country_code: normalizujKrajOdModelu(kom[1]), ultimate_owner: kom[2], zgoda: /^tak|yes|zgadza/i.test(kom[3]) ? true : /^nie|no/i.test(kom[3]) ? false : null, uwagi: kom[4] || "", zrodlo: kom[5] || "" });
  }
  return wiersze;
}

export function zastosujKonsylium(partia, model, tekst, kategorie) {
  const wiersze = parsujKonsylium(tekst);
  let dopasowane = 0;
  let niezgody = 0;
  for (const w of wiersze) {
    const f = partia.firmy.find((x) => x.nazwa.toLowerCase() === w.name.toLowerCase()) || partia.firmy.find((x) => podobienstwoNazw(x.nazwa, w.name) >= 0.8);
    if (!f || !f.rekord) continue;
    dopasowane++;
    f.konsylium = (f.konsylium || []).filter((k) => k.model !== model);
    const zgodaKraj = w.country_code && f.rekord.country_code && w.country_code === f.rekord.country_code;
    const zgodaWl = podobienstwoNazw(w.ultimate_owner, f.rekord.owner_name) >= 0.4;
    // Zgoda liczy się tylko, gdy model to deklaruje I jego kraj/właściciel faktycznie się zgadzają.
    const zgoda = w.zgoda === true && zgodaKraj ? true : w.zgoda === false || (w.country_code && !zgodaKraj) ? false : null;
    if (zgoda === false) niezgody++;
    f.konsylium.push({ model, ...w, zgoda, zgodaKraj, zgodaWl, data: dzisiaj() });
    if (!f.decyzja || f.decyzja === "zatwierdzony") {
      // ponowna ocena: konflikt konsylium może cofnąć hurtowe zatwierdzenie
      zlozRekord(f, { kategorie, dzisiaj: f.rekord.verified_at || dzisiaj() });
      if (f.status === "KONFLIKT" && f.decyzja === "zatwierdzony") f.decyzja = null;
    }
  }
  partia.konsylia = [...(partia.konsylia || []).filter((k) => k.model !== model), { model, data: dzisiaj(), kiedy: new Date().toISOString(), wierszy: wiersze.length, dopasowane, niezgody }];
  return { wierszy: wiersze.length, dopasowane, niezgody };
}

function json(res, dane, kod = 200) {
  res.writeHead(kod, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(dane));
}

/**
 * Obsługa ścieżek /api/* przeglądu. Zwraca true, gdy żądanie zostało obsłużone.
 * ctx: { plik(url) -> ścieżka pliku partii, kategorie }
 */
// Braki, przez które firmy nie da się zaimportować (liczone na bieżąco z rekordu, także po edycji).
export function brakiRekordu(f, kategorie) {
  if (!f.rekord || f.pomin) return [];
  const b = [...walidujRekord(f.rekord, kategorie).bledy];
  if (!f.rekord.category_slug) b.push("brak kategorii");
  return [...new Set(b)];
}
// Gotowa do zatwierdzenia hurtem: bez konfliktu, bez braków, jeszcze bez decyzji.
export const gotowaDoZatwierdzenia = (f, kategorie) => !!f.rekord && !f.pomin && !f.decyzja && f.status !== "KONFLIKT" && !brakiRekordu(f, kategorie).length;

export async function obsluzApiPrzegladu(req, res, url, ctx) {
  // Ciało zbieramy w buforach i dopiero na końcu dekodujemy jako UTF-8 (polskie znaki
  // potrafią wypaść na granicy pakietów).
  const cialo = () => new Promise((r) => { const cz = []; req.on("data", (d) => cz.push(d)); req.on("end", () => { const t = Buffer.concat(cz).toString("utf8"); r(t ? JSON.parse(t) : {}); }); });
  const plik = () => ctx.plik(url);
  const kategorie = ctx.kategorie;

  if (req.method === "GET" && url.pathname === "/api/partia") {
    const p = plik();
    const partia = wczytajPartie(p);
    for (const f of partia.firmy) f.braki = brakiRekordu(f, kategorie); // tylko w odpowiedzi, nie w pliku
    json(res, { partia, kategorie, plik: p });
    return true;
  }
  if (req.method === "GET" && url.pathname === "/api/prompt-konsylium") {
    const p = wczytajPartie(plik());
    const tylko = url.searchParams.get("tylko");
    const firmy = p.firmy.filter((f) => f.rekord && (tylko !== "niezatwierdzone" || f.decyzja !== "zatwierdzony"));
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(promptKonsylium(firmy));
    return true;
  }
  if (req.method === "POST" && url.pathname === "/api/decyzja") {
    const { nazwa, decyzja, rekord, notatka } = await cialo();
    const sciezka = plik();
    const p = wczytajPartie(sciezka);
    const f = p.firmy.find((x) => x.nazwa === nazwa);
    if (!f) { json(res, { blad: "nie ma takiej firmy" }, 404); return true; }
    if (rekord) {
      f.rekord = { ...f.rekord, ...rekord };
      const kat = kategorie.find((k) => k.slug === f.rekord.category_slug);
      f.rekord.category_id = kat?.id || null;
      f.edytowano = new Date().toISOString();
      f.walidacja = walidujRekord(f.rekord, kategorie);
    }
    if (decyzja !== undefined) f.decyzja = decyzja;
    if (notatka !== undefined) f.notatka = notatka;
    zapiszPartie(sciezka, p);
    json(res, { ok: true, firma: f });
    return true;
  }
  if (req.method === "POST" && url.pathname === "/api/zatwierdz-gotowe") {
    const sciezka = plik();
    const p = wczytajPartie(sciezka);
    const zatwierdzone = [];
    for (const f of p.firmy) if (gotowaDoZatwierdzenia(f, kategorie)) { f.decyzja = "zatwierdzony"; zatwierdzone.push(f.nazwa); }
    zapiszPartie(sciezka, p);
    json(res, { ok: true, zatwierdzono: zatwierdzone.length, firmy: zatwierdzone });
    return true;
  }
  if (req.method === "POST" && url.pathname === "/api/zatwierdz-pewne") {
    const sciezka = plik();
    const p = wczytajPartie(sciezka);
    let n = 0;
    for (const f of p.firmy) if (f.rekord && f.status === "WYSOKA" && !f.decyzja && !(f.walidacja?.bledy || []).length) { f.decyzja = "zatwierdzony"; n++; }
    zapiszPartie(sciezka, p);
    json(res, { ok: true, zatwierdzono: n });
    return true;
  }
  if (req.method === "POST" && url.pathname === "/api/zatwierdz-zgodne") {
    // Re-weryfikacja: ŚREDNIA bez konfliktów, kraj i właściciel zgodne z obecnym rekordem w bazie.
    const sciezka = plik();
    const p = wczytajPartie(sciezka);
    let n = 0;
    for (const f of p.firmy) {
      const por = f.porownanie;
      if (f.rekord && f.status === "SREDNIA" && !f.decyzja && !(f.konflikty || []).length && por && !por.country_code.zmiana && !por.owner_name.zmiana && !(f.walidacja?.bledy || []).length) {
        f.decyzja = "zatwierdzony";
        n++;
      }
    }
    zapiszPartie(sciezka, p);
    json(res, { ok: true, zatwierdzono: n });
    return true;
  }
  if (req.method === "POST" && url.pathname === "/api/konsylium") {
    const { model, tekst } = await cialo();
    const sciezka = plik();
    const p = wczytajPartie(sciezka);
    const w = zastosujKonsylium(p, String(model || "inny model").slice(0, 40), tekst, kategorie);
    zapiszPartie(sciezka, p);
    json(res, { ok: true, ...w });
    return true;
  }
  return false;
}
