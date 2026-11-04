// Firmy, które czekają w partiach re-weryfikacji na przegląd i import.
//
// Po co: nocna re-weryfikacja (.github/workflows/reweryfikacja.yml) wybiera firmy
// o najstarszym verified_at, a verified_at zmienia się dopiero przy ręcznym imporcie
// partii (tools/firmy/import.mjs --apply). Dopóki właściciel nie zaimportuje partii,
// kolejka jest co noc identyczna, więc bez tej listy automat sprawdzałby w kółko
// te same firmy i zużywał limit subskrypcji Claude na powtórki.
//
// Wynik (slugi, po jednym w linii) trafia do `automat.mjs --najstarsze N --pomin PLIK`.
//
// Użycie:
//   node tools/firmy/firmy-w-toku.mjs KATALOG [--dni 21] > .tmp/pomin.txt
//
// KATALOG to folder z plikami partia-rew-*.json (workflow zbiera tam partie z otwartych
// PR-ów automatu i te już scalone na develop). Brane są tylko partie w trybie
// re-weryfikacji, utworzone w ostatnich --dni dniach (domyślnie 21). Starsza partia,
// której nikt nie zaimportował, przestaje blokować swoje firmy i wracają do kolejki.

import fs from "node:fs";
import path from "node:path";

const argumenty = process.argv.slice(2);
const katalog = argumenty.find((a) => !a.startsWith("--"));
const iDni = argumenty.indexOf("--dni");
const dni = iDni >= 0 ? Number(argumenty[iDni + 1]) : 21;

if (!katalog) {
  console.error("Użycie: node tools/firmy/firmy-w-toku.mjs KATALOG [--dni 21]");
  process.exit(1);
}
if (!Number.isFinite(dni) || dni < 1) {
  console.error(`--dni wymaga liczby dodatniej (podano "${argumenty[iDni + 1]}").`);
  process.exit(1);
}

const granica = Date.now() - dni * 86400000;
const slugi = new Set();
let partii = 0;

const pliki = fs.existsSync(katalog)
  ? fs.readdirSync(katalog).filter((p) => /^partia-.*\.json$/.test(p))
  : [];

for (const plik of pliki) {
  let partia;
  try {
    partia = JSON.parse(fs.readFileSync(path.join(katalog, plik), "utf8"));
  } catch {
    console.error(`pomijam ${plik}: to nie jest poprawny JSON`);
    continue;
  }
  if (partia.tryb !== "reweryfikacja") continue;
  const utworzono = Date.parse(partia.utworzono);
  if (Number.isNaN(utworzono) || utworzono < granica) continue;

  partii++;
  for (const firma of partia.firmy || []) {
    const slug = firma?.zKolejki?.slug;
    if (slug) slugi.add(slug);
  }
}

console.error(`firmy w toku: ${slugi.size} z ${partii} partii z ostatnich ${dni} dni (przejrzanych plików: ${pliki.length})`);
process.stdout.write([...slugi].sort().join("\n") + (slugi.size ? "\n" : ""));
