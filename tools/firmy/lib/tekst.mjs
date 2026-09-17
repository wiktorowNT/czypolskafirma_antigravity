// Narzędzia tekstowe: slug (port lib/slug-utils.ts), normalizacja nazw spółek,
// podobieństwo nazw, kody krajów z lib/countries.ts.
import fs from "node:fs";
import path from "node:path";
import { KATALOG_REPO } from "./env.mjs";

const POLSKIE = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };

export function slugify(nazwa) {
  if (!nazwa) return "";
  return nazwa
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => POLSKIE[ch] || ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Formy prawne i szum, które usuwamy przy porównywaniu nazw z rejestrów.
const FORMY = [
  "spolka akcyjna", "spolka z ograniczona odpowiedzialnoscia", "spolka komandytowa",
  "spolka komandytowo akcyjna", "spolka jawna", "sp z o o", "sp z oo", "spzoo", "sp k", "s k a",
  "s a", "sa", "spolka", "prosta spolka akcyjna", "oddzial w polsce", "w likwidacji",
  "ltd", "limited", "gmbh", "ag", "b v", "bv", "n v", "nv", "s a r l", "sarl", "inc", "llc", "plc",
  "se", "s r o", "sro", "societe anonyme", "aktiengesellschaft", "holding", "holdings", "group", "grupa",
];

export function normalizujNazwe(nazwa) {
  if (!nazwa) return "";
  let s = slugify(nazwa).replace(/-/g, " ");
  for (const f of FORMY.sort((a, b) => b.length - a.length)) {
    s = s.replace(new RegExp(`(^| )${f}( |$)`, "g"), " ");
  }
  return s.replace(/\s+/g, " ").trim();
}

// Podobieństwo 0..1 na tokenach (Jaccard) plus bonus, gdy jedna nazwa zawiera drugą.
export function podobienstwoNazw(a, b) {
  const na = normalizujNazwe(a), nb = normalizujNazwe(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const ta = new Set(na.split(" ")), tb = new Set(nb.split(" "));
  let wspolne = 0;
  for (const t of ta) if (tb.has(t)) wspolne++;
  return wspolne / (ta.size + tb.size - wspolne);
}

let kodyCache = null;
export function kodyKrajow() {
  if (kodyCache) return kodyCache;
  const plik = path.join(KATALOG_REPO, "lib", "countries.ts");
  const src = fs.readFileSync(plik, "utf8");
  const sekcja = src.split("countryNames")[1] || src;
  const mapa = {};
  for (const m of sekcja.matchAll(/"([A-Z]{2})"\s*:\s*"([^"]+)"/g)) mapa[m[1]] = m[2];
  kodyCache = mapa;
  return mapa;
}

export function czyNip(s) {
  const n = String(s || "").replace(/\D/g, "");
  if (n.length !== 10) return false;
  const wagi = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const suma = wagi.reduce((acc, w, i) => acc + w * Number(n[i]), 0);
  return suma % 11 === Number(n[9]);
}

export function czyKrs(s) {
  return /^\d{10}$/.test(String(s || "").replace(/\D/g, "").padStart(10, "0"));
}

export function normalizujKrs(s) {
  const n = String(s || "").replace(/\D/g, "");
  return n ? n.padStart(10, "0") : "";
}

export function normalizujNip(s) {
  return String(s || "").replace(/\D/g, "");
}

export function usunMyslniki(tekst) {
  // Em-dash i en-dash to zakaz stylu w projekcie (lint-tresci.mjs). Zamieniamy na przecinek.
  return String(tekst || "").replace(/\s*[—–]\s*/g, ", ").replace(/,\s*,/g, ",");
}

export function maMyslniki(tekst) {
  return /[—–]/.test(String(tekst || ""));
}
