#!/usr/bin/env node
// Przegląd partii w przeglądarce (localhost). Konflikty na górze, zatwierdzanie hurtowe pozycji
// pewnych, edycja pól, konsylium innych modeli (wklejasz ich odpowiedzi, program porównuje).
// Decyzje zapisuje do pliku partii. Żadnego klucza Supabase w przeglądarce.
//   node tools/firmy/przeglad.mjs --partia 2026-09-17   (albo bez --partia: najnowsza)
//   node tools/firmy/przeglad.mjs --port 3007
// Wygodniej: node tools/firmy/panel.mjs (cały proces klikany, z tym przeglądem w środku).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATALOG_PARTII } from "./lib/env.mjs";
import { obsluzApiPrzegladu } from "./lib/przeglad-api.mjs";
import { kategorie as pobierzKategorie } from "./lib/supabase.mjs";

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

const serwer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(HTML);
    }
    if (await obsluzApiPrzegladu(req, res, url, { plik: () => PLIK, kategorie })) return;
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ blad: "nieznana ścieżka" }));
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ blad: e.message }));
  }
});

serwer.listen(PORT, "127.0.0.1", () => {
  console.log(`Przegląd partii "${nazwaPartii}": http://localhost:${PORT}/  (Ctrl+C kończy)`);
  console.log(`Plik: ${PLIK}`);
});
