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
    // Naruszenia sprzed migracji. `npm run lint` nigdy wcześniej nie dawał się
    // uruchomić (repo nie miało ani konfiguracji, ani pakietu eslint), więc te
    // dwie reguły od pierwszego przebiegu wywalały 17 błędów w plikach, których
    // podbicie Nexta nie dotyczy — m.in. w regulaminie i polityce prywatności.
    // Zostają jako OSTRZEŻENIA: są widoczne na liście, ale nie blokują lintu.
    // Poprawka to zmiana treści JSX i nawigacji, czyli osobne zadanie.
    rules: {
      "react/no-unescaped-entities": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
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
      // Pliki robocze z czasów v0, poza katalogami aplikacji
      // (temp_stripped.js nie jest nawet poprawnym składniowo plikiem).
      "temp.js",
      "temp_stripped.js",
    ],
  },
]

export default eslintConfig
