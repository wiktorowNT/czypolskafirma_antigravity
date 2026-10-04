// Mechaniczna zamiana klas Tailwind z palety shadcn/slate na tokeny systemu „Półka”
// (docs/DESIGN_SYSTEM.md). Używane przy przenoszeniu kolejnych komponentów; po zamianie
// zawsze obejrzyj wynik — skrypt nie zna kontekstu (np. czy czerwień to werdykt, czy przycisk).
// Użycie: node tools/tokeny-polka.mjs plik1.tsx [plik2.tsx ...] [--dry]
import fs from "fs"

// Prefiks wariantu (hover:, sm:, group-hover:, focus: ...) — zachowywany przy zamianie.
const P = "((?:[\\w-]+:)*)"
// Klasa zaczyna się po spacji, cudzysłowie, backticku albo na początku tekstu.
const START = "(?<=^|[\\s\"'`{])"
const END = "(?![\\w/-])"

const rule = (cls, rep) => [new RegExp(START + P + cls + END, "g"), (_m, pre) => pre + rep]
const drop = (cls) => [new RegExp("\\s?" + START + P + cls + END, "g"), () => ""]

const MAP = [
  // tekst
  rule("text-slate-(?:900|800)", "text-ink"),
  rule("text-slate-(?:700|600)", "text-ink-2"),
  rule("text-slate-(?:500|400|300)", "text-ink-3"),
  rule("text-(?:red|rose)-(?:600|700|800)", "text-brand-ink"),
  rule("text-(?:red|rose)-(?:400|500)", "text-brand"),
  rule("text-(?:green|emerald)-(?:500|600|700)", "text-ink"),
  // tła
  rule("bg-slate-(?:50|100)(?:/\\d+)?", "bg-warm"),
  rule("bg-slate-200(?:/\\d+)?", "bg-warm-2"),
  rule("bg-(?:red|rose)-(?:50|100)(?:/\\d+)?", "bg-brand-soft"),
  rule("bg-(?:red|rose)-(?:500|600)", "bg-brand"),
  rule("bg-(?:red|rose)-(?:700|800)", "bg-brand-ink"),
  rule("bg-slate-(?:900|950)", "bg-ink"),
  rule("bg-slate-800", "bg-black"),
  rule("bg-(?:green|emerald)-(?:500|600)", "bg-ink"),
  // niebieskie akcenty z szablonu: bez znaczenia w systemie, zamieniane na neutralne
  rule("bg-blue-50(?:/\\d+)?", "bg-warm"),
  rule("bg-blue-100", "bg-warm-2"),
  rule("text-blue-(?:500|600|700)", "text-ink"),
  rule("border-blue-(?:100|200|300)", "border-line"),
  rule("border-slate-(?:800|900)", "border-ink"),
  // obramowania
  rule("border-slate-(?:100|200|300)(?:/\\d+)?", "border-line"),
  rule("border-slate-(?:400|500)", "border-ink-3"),
  rule("border-(?:red|rose)-(?:100|200)(?:/\\d+)?", "border-brand/30"),
  rule("border-(?:red|rose)-(?:300|500|600)", "border-brand"),
  rule("border-t-(?:red|rose)-600", "border-t-brand"),
  rule("divide-slate-(?:100|200)", "divide-line"),
  rule("ring-(?:red|rose)-500", "ring-brand"),
  rule("ring-slate-(?:300|400|950)", "ring-ink"),
  // cienie: system ich nie używa (wyjątek: rozwijane listy, dodawane ręcznie)
  drop("shadow-(?:sm|md|lg|xl|2xl)"),
  drop("shadow-[a-z]+-\\d+(?:/\\d+)?"),
  drop("shadow-\\[[^\\]]+\\]"),
]

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"))
const dry = process.argv.includes("--dry")
for (const f of files) {
  const src = fs.readFileSync(f, "utf8")
  let out = src
  let n = 0
  for (const [re, rep] of MAP) {
    out = out.replace(re, (...args) => {
      n++
      return rep(...args)
    })
  }
  if (!dry && out !== src) fs.writeFileSync(f, out)
  console.log(`${f}: ${n} zamian${dry ? " (próba)" : ""}`)
}
