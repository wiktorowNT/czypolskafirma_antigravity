// Czyta zmienne z .env.local (bez dotenv, żeby nie dokładać zależności).
// Nigdy nie wypisuje wartości. Używane przez wszystkie skrypty w tools/firmy/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KATALOG_TOOLS_FIRMY = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const KATALOG_REPO = path.resolve(KATALOG_TOOLS_FIRMY, "..", "..");
export const KATALOG_PARTII = path.join(KATALOG_REPO, "data", "robocze", "automat");

let cache = null;

export function wczytajEnv() {
  if (cache) return cache;
  const env = { ...process.env };
  const plik = path.join(KATALOG_REPO, ".env.local");
  if (fs.existsSync(plik)) {
    for (const linia of fs.readFileSync(plik, "utf8").split(/\r?\n/)) {
      const m = linia.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || linia.trim().startsWith("#")) continue;
      if (!env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  cache = env;
  return env;
}

export function wymagaj(nazwa) {
  const v = wczytajEnv()[nazwa];
  if (!v) {
    throw new Error(`Brak zmiennej ${nazwa} w .env.local. Uzupełnij ją (nazwa jak w docs/SOP_dodawanie_firm.md) i uruchom ponownie.`);
  }
  return v;
}

export function dzisiaj() {
  const d = new Date();
  const tz = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
  return `${tz.getFullYear()}-${String(tz.getMonth() + 1).padStart(2, "0")}-${String(tz.getDate()).padStart(2, "0")}`;
}
