#!/usr/bin/env node
// Opis pull requesta dla nocnej re-weryfikacji (.github/workflows/reweryfikacja.yml).
// Czyta gotową partię i pisze tabelę: firma, było → jest, status, konflikty.
// Nic nie pobiera i nic nie zapisuje do bazy: tylko plik partii → .tmp/pr-body.md
//
// Użycie:
//   node tools/firmy/raport-reweryfikacji.mjs --partia rew-2026-11-05
// Opcje:
//   --partia NAZWA   nazwa partii (wymagana)
//   --wyjscie PLIK   gdzie zapisać opis (domyślnie .tmp/pr-body.md)
//
// Pierwsza linia pliku to tytuł PR-a, tak jak w automacie treści. Gdy w partii nie ma
// ani jednego rekordu, pierwsza linia zaczyna się od "BRAK MATERIAŁU" i workflow nie
// otwiera PR-a.
import fs from "node:fs";
import path from "node:path";
import { KATALOG_PARTII, KATALOG_REPO } from "./lib/env.mjs";

const arg = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1]?.startsWith("--") === false ? process.argv[++i] : true;
}
if (!arg.partia || arg.partia === true) {
  console.error("Użycie: node tools/firmy/raport-reweryfikacji.mjs --partia rew-RRRR-MM-DD [--wyjscie .tmp/pr-body.md]");
  process.exit(1);
}

const PLIK_PARTII = path.join(KATALOG_PARTII, `partia-${arg.partia}.json`);
const PLIK_WYJSCIA = path.resolve(KATALOG_REPO, arg.wyjscie && arg.wyjscie !== true ? arg.wyjscie : path.join(".tmp", "pr-body.md"));
if (!fs.existsSync(PLIK_PARTII)) {
  console.error(`Brak pliku partii: ${PLIK_PARTII}`);
  process.exit(1);
}
const partia = JSON.parse(fs.readFileSync(PLIK_PARTII, "utf8"));
const firmy = partia.firmy || [];

// Komórka tabeli: pionowa kreska i nowe linie rozwaliłyby markdown, a treść pochodzi
// z modelu i z cudzych stron, więc nie jest zaufana.
const kom = (s, limit = 300) => {
  const t = String(s ?? "").replace(/\s+/g, " ").replace(/\|/g, "/").replace(/[<>]/g, "").trim();
  return (t.length > limit ? t.slice(0, limit - 1) + "…" : t) || "brak";
};
const marka = (f) => kom(f.rekord?.display_name || f.nazwa, 60);
const link = (f) => {
  const slug = f.porownanie?.slug || f.zKolejki?.slug;
  return slug ? `[${marka(f)}](https://czypolskafirma.pl/firma/${slug})` : marka(f);
};
const tabela = (naglowki, wiersze) => (wiersze.length
  ? [`| ${naglowki.join(" | ")} |`, `|${naglowki.map(() => "---").join("|")}|`, ...wiersze.map((w) => `| ${w.join(" | ")} |`)].join("\n")
  : "_Brak._");

// "było → jest" dla kraju i właściciela. Strzałka tylko tam, gdzie faktycznie coś się zmienia.
function bylojest(f) {
  const r = f.rekord, por = f.porownanie;
  if (!r) return "brak";
  const krajBylo = por?.country_code?.bylo ?? null;
  const wlBylo = por?.owner_name?.bylo ?? null;
  // `zmiana` liczy rekord.mjs: dla kraju zwykłe porównanie, dla właściciela podobieństwo nazw
  // (inny zapis tej samej firmy to nie zmiana).
  const kraj = por?.country_code?.zmiana ? `**${kom(krajBylo, 8)} → ${kom(r.country_code, 8)}**` : kom(r.country_code, 8);
  const wlasciciel = por?.owner_name?.zmiana ? `**${kom(wlBylo, 70)} → ${kom(r.owner_name, 70)}**` : kom(r.owner_name, 70);
  return `${kraj} · ${wlasciciel}`;
}

const gotowe = firmy.filter((f) => f.rekord);
const niegotowe = firmy.filter((f) => !f.rekord && !f.pomin);
const zmiany = gotowe.filter((f) => f.porownanie && (f.porownanie.country_code?.zmiana || f.porownanie.owner_name?.zmiana || f.porownanie.nip?.zmiana));
const konflikty = gotowe.filter((f) => f.konflikty?.length);
const bezZmian = gotowe.filter((f) => !zmiany.includes(f) && !konflikty.includes(f));
const st = { WYSOKA: 0, SREDNIA: 0, KONFLIKT: 0 };
for (const f of gotowe) if (st[f.status] !== undefined) st[f.status]++;

if (!gotowe.length) {
  const powod = `BRAK MATERIAŁU: partia ${arg.partia} nie ma ani jednego gotowego rekordu (${firmy.length} firm na wejściu, ${niegotowe.length} bez rekordu).`;
  fs.mkdirSync(path.dirname(PLIK_WYJSCIA), { recursive: true });
  fs.writeFileSync(PLIK_WYJSCIA, `${powod}\n`, "utf8");
  console.log(powod);
  process.exit(0);
}

const wierszGlowny = (f) => [link(f), bylojest(f), kom(f.status, 20), kom((f.konflikty || []).join("; "), 400)];
const rozmiarKb = Math.round(fs.statSync(PLIK_PARTII).size / 1024);
const s = partia.statystyki || {};

const md = `# Re-weryfikacja ${arg.partia.replace(/^rew-/, "")}: ${gotowe.length} firm, ${zmiany.length} ze zmianą

Nocny przebieg automatu re-weryfikacji. **Nic nie trafiło do bazy**: ten PR dowozi tylko
plik partii do przejrzenia. Import robisz lokalnie i ręcznie, tak jak przy nowych firmach.

## Podsumowanie

| | Liczba |
|---|---|
| Firm w partii | ${firmy.length} |
| Gotowych rekordów | ${gotowe.length} |
| **Zmiana wobec bazy (kraj, właściciel albo NIP)** | **${zmiany.length}** |
| Konflikty do rozstrzygnięcia | ${konflikty.length} |
| Bez zmian (odświeżają tylko \`verified_at\`) | ${bezZmian.length} |
| Pewność WYSOKA / ŚREDNIA / KONFLIKT | ${st.WYSOKA} / ${st.SREDNIA} / ${st.KONFLIKT} |
| Nie doszły do rekordu (błąd, limit, timeout) | ${niegotowe.length} |

## Zmiany wobec bazy

Kolumna „było → jest”: kraj kapitału i ostateczny właściciel. Pogrubione to realna zmiana.

${tabela(["Firma", "Kraj i właściciel (było → jest)", "Status", "Konflikty"], zmiany.map(wierszGlowny))}

## Konflikty bez zmiany kraju i właściciela

${tabela(["Firma", "Kraj i właściciel", "Status", "Konflikty"], konflikty.filter((f) => !zmiany.includes(f)).map(wierszGlowny))}

## Bez zmian

Automat potwierdził obecny rekord. Po imporcie odświeży się \`verified_at\`, czyli dokładnie
to, po co ten workflow istnieje.

${tabela(["Firma", "Kraj i właściciel", "Status"], bezZmian.map((f) => [link(f), bylojest(f), kom(f.status, 20)]))}
${niegotowe.length ? `
## Nie doszły do rekordu

${tabela(["Firma", "Na czym stanęła", "Błędy"], niegotowe.map((f) => [marka(f), kom(Object.entries(f.etapy || {}).map(([k, v]) => `${k}: ${v}`).join("; "), 200), kom((f.bledy || []).join("; "), 300)]))}

Te firmy wrócą do kolejki same: bez importu ich \`verified_at\` się nie zmienia, więc przy
kolejnym przebiegu znów są na wierzchu.
` : ""}
## Co z tym zrobić

\`\`\`bash
git pull
\`\`\`

\`\`\`bash
node tools/firmy/przeglad.mjs --partia ${arg.partia}
\`\`\`

Przeglądasz na http://localhost:3007, zatwierdzasz albo odrzucasz, potem import próbny
i dopiero na końcu zapis do bazy:

\`\`\`bash
node tools/firmy/import.mjs --partia ${arg.partia}
\`\`\`

\`\`\`bash
node tools/firmy/import.mjs --partia ${arg.partia} --apply
\`\`\`

Nie masz czasu teraz? PR może poczekać. Nieprzejrzane PR-y tego automatu starsze niż
14 dni zamykają się same, a ich firmy wracają do kolejki (ich \`verified_at\` się nie zmienił).

## Dane techniczne

- Plik partii: \`data/robocze/automat/partia-${arg.partia}.json\` (${rozmiarKb} KB)
- Tryb: \`${kom(partia.tryb, 30)}\`, bez CRBR i bez puppeteera
- Model: ${s.wywolan || 0} wywołań, ${s.tury || "?"} tur, ${Math.round((s.sekundy || 0) / 60)} min, ${Math.round((s.tokenyWe || 0) / 1000)}k tokenów wejścia (+${Math.round((s.tokenyCache || 0) / 1000)}k z cache), ${Math.round((s.tokenyWy || 0) / 1000)}k wyjścia
- Źródła danych: Supabase (odczyt kluczem publicznym), Biała Lista VAT MF, API KRS

Tabele powyżej powstały z odpowiedzi modelu i z cudzych stron internetowych. To dane
do sprawdzenia, nie ustalenia: werdykt zapada na przeglądzie.
`;

fs.mkdirSync(path.dirname(PLIK_WYJSCIA), { recursive: true });
fs.writeFileSync(PLIK_WYJSCIA, md, "utf8");
console.log(`opis PR-a: ${path.relative(KATALOG_REPO, PLIK_WYJSCIA)} (${gotowe.length} rekordów, ${zmiany.length} ze zmianą, ${konflikty.length} konfliktów)`);
