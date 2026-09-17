#!/usr/bin/env node
// Przegląd partii w przeglądarce (localhost). Konflikty na górze, zatwierdzanie hurtowe pozycji
// pewnych, edycja pól, konsylium innych modeli (wklejasz ich odpowiedzi, program porównuje).
// Decyzje zapisuje do pliku partii. Żadnego klucza Supabase w przeglądarce.
//   node tools/firmy/przeglad.mjs --partia 2026-09-17   (albo bez --partia: najnowsza)
//   node tools/firmy/przeglad.mjs --port 3007
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATALOG_PARTII, dzisiaj } from "./lib/env.mjs";
import { promptKonsylium } from "./lib/prompty.mjs";
import { zlozRekord } from "./lib/rekord.mjs";
import { kategorie as pobierzKategorie } from "./lib/supabase.mjs";
import { normalizujKrajOdModelu } from "./lib/walidacja.mjs";
import { podobienstwoNazw } from "./lib/tekst.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const PORT = Number(opt("port", 3007));
let nazwaPartii = opt("partia", null);
if (!nazwaPartii) {
  const pliki = fs.readdirSync(KATALOG_PARTII).filter((p) => p.startsWith("partia-") && p.endsWith(".json")).map((p) => ({ p, t: fs.statSync(path.join(KATALOG_PARTII, p)).mtimeMs })).sort((a, b) => b.t - a.t);
  if (!pliki.length) { console.error("Brak partii w", KATALOG_PARTII); process.exit(1); }
  nazwaPartii = pliki[0].p.replace(/^partia-|\.json$/g, "");
}
const PLIK = path.join(KATALOG_PARTII, `partia-${nazwaPartii}.json`);
if (!fs.existsSync(PLIK)) { console.error("Nie ma pliku", PLIK); process.exit(1); }
const kategorie = await pobierzKategorie();
const HTML = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "przeglad.html"), "utf8");

const wczytaj = () => JSON.parse(fs.readFileSync(PLIK, "utf8"));
const zapisz = (p) => { p.zaktualizowano = new Date().toISOString(); fs.writeFileSync(PLIK, JSON.stringify(p, null, 2), "utf8"); };

// Parsowanie odpowiedzi innego modelu (tabela Markdown: name | country_code | ultimate_owner | zgoda | uwagi | zrodlo)
function parsujKonsylium(tekst) {
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

function zastosujKonsylium(partia, model, tekst) {
  const wiersze = parsujKonsylium(tekst);
  let dopasowane = 0;
  for (const w of wiersze) {
    const f = partia.firmy.find((x) => x.nazwa.toLowerCase() === w.name.toLowerCase()) || partia.firmy.find((x) => podobienstwoNazw(x.nazwa, w.name) >= 0.8);
    if (!f || !f.rekord) continue;
    dopasowane++;
    f.konsylium = (f.konsylium || []).filter((k) => k.model !== model);
    const zgodaKraj = w.country_code && f.rekord.country_code && w.country_code === f.rekord.country_code;
    const zgodaWl = podobienstwoNazw(w.ultimate_owner, f.rekord.owner_name) >= 0.4;
    // Zgoda liczy się tylko, gdy model to deklaruje I jego kraj/właściciel faktycznie się zgadzają.
    const zgoda = w.zgoda === true && zgodaKraj ? true : w.zgoda === false || (w.country_code && !zgodaKraj) ? false : null;
    f.konsylium.push({ model, ...w, zgoda, zgodaKraj, zgodaWl, data: dzisiaj() });
    if (!f.decyzja || f.decyzja === "zatwierdzony") {
      // ponowna ocena: konflikt konsylium może cofnąć hurtowe zatwierdzenie
      zlozRekord(f, { kategorie, dzisiaj: f.rekord.verified_at || dzisiaj() });
      if (f.status === "KONFLIKT" && f.decyzja === "zatwierdzony") f.decyzja = null;
    }
  }
  partia.konsylia = [...(partia.konsylia || []).filter((k) => k.model !== model), { model, data: dzisiaj(), wierszy: wiersze.length, dopasowane }];
  return { wierszy: wiersze.length, dopasowane };
}

function json(res, dane, kod = 200) {
  res.writeHead(kod, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(dane));
}

const serwer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const cialo = () => new Promise((r) => { let s = ""; req.on("data", (d) => (s += d)); req.on("end", () => r(s ? JSON.parse(s) : {})); });
  try {
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(HTML);
    }
    if (req.method === "GET" && url.pathname === "/api/partia") return json(res, { partia: wczytaj(), kategorie, plik: PLIK });
    if (req.method === "GET" && url.pathname === "/api/prompt-konsylium") {
      const p = wczytaj();
      const tylko = url.searchParams.get("tylko");
      const firmy = p.firmy.filter((f) => f.rekord && (tylko !== "niezatwierdzone" || f.decyzja !== "zatwierdzony"));
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(promptKonsylium(firmy));
    }
    if (req.method === "POST" && url.pathname === "/api/decyzja") {
      const { nazwa, decyzja, rekord, notatka } = await cialo();
      const p = wczytaj();
      const f = p.firmy.find((x) => x.nazwa === nazwa);
      if (!f) return json(res, { blad: "nie ma takiej firmy" }, 404);
      if (rekord) {
        f.rekord = { ...f.rekord, ...rekord };
        const kat = kategorie.find((k) => k.slug === f.rekord.category_slug);
        f.rekord.category_id = kat?.id || null;
        f.edytowano = new Date().toISOString();
      }
      if (decyzja !== undefined) f.decyzja = decyzja;
      if (notatka !== undefined) f.notatka = notatka;
      zapisz(p);
      return json(res, { ok: true, firma: f });
    }
    if (req.method === "POST" && url.pathname === "/api/zatwierdz-pewne") {
      const p = wczytaj();
      let n = 0;
      for (const f of p.firmy) if (f.rekord && f.status === "WYSOKA" && !f.decyzja && !(f.walidacja?.bledy || []).length) { f.decyzja = "zatwierdzony"; n++; }
      zapisz(p);
      return json(res, { ok: true, zatwierdzono: n });
    }
    if (req.method === "POST" && url.pathname === "/api/konsylium") {
      const { model, tekst } = await cialo();
      const p = wczytaj();
      const w = zastosujKonsylium(p, String(model || "inny model").slice(0, 40), tekst);
      zapisz(p);
      return json(res, { ok: true, ...w });
    }
    json(res, { blad: "nieznana ścieżka" }, 404);
  } catch (e) {
    json(res, { blad: e.message }, 500);
  }
});

serwer.listen(PORT, "127.0.0.1", () => {
  console.log(`Przegląd partii "${nazwaPartii}": http://localhost:${PORT}/  (Ctrl+C kończy)`);
  console.log(`Plik: ${PLIK}`);
});
