// Konfiguracja ESLint w formacie "flat" (ESLint 9).
//
// Next 15.5 oznacza `next lint` jako przestarzałe, dlatego `npm run lint`
// woła bezpośrednio ESLint — bez tego każdy przebieg dokładałby ostrzeżenie
// o wycofaniu komendy. `eslint-config-next` w wersji 15 wystawia jeszcze
// konfiguracje w starym formacie (eslintrc), więc wciągamy je przez FlatCompat.
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const eslintConfig = [
  // Ten sam preset, który `next lint` zakładał dla tego projektu ("Strict").
  // Świadomie BEZ "next/typescript": ten zestaw podnosi m.in. no-explicit-any
  // do rangi błędu, a w repo jest ~60 miejsc z `any` sprzed migracji.
  // Sprzątanie typów to osobne zadanie, nie część podbicia Nexta.
  ...compat.extends("next/core-web-vitals"),
  {
    // `next lint` sprawdzał domyślnie tylko katalogi aplikacji. Zostawiamy ten
    // sam zakres, żeby migracja nie wciągnęła do lintowania skryptów z tools/,
    // treści bloga ani wygenerowanych paczek (logos_bundle.js to ~19 MB).
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "public/**",
      "tools/**",
      "data/**",
      "content/**",
      "docs/**",
      "assets/**",
      "next-env.d.ts",
      "logos_bundle.js",
      "generate_logos_bundle.js",
    ],
  },
]

export default eslintConfig
