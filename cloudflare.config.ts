import { bindings, defineConfig, defineWorker } from "cf/config";

const GENEROWANE_PRZY_BUILDZIE = [
  "!/opengraph-image",
  "!/firma/*/opengraph-image",
  "!/sitemap.xml",
  "!/sitemap-*.xml",
  "!/robots.txt",
];

export default defineConfig({
  worker: defineWorker({
    name: "czypolskafirma",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-11-12",
    observability: { enabled: true },
    domains: ["czypolskafirma.pl", "www.czypolskafirma.pl"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      // Pliki statyczne omijają Workera: nie zużywają limitu 100 tys. żądań dziennie
      // ani 10 ms procesora. Karty OG i sitemapy powstają przy buildzie
      // (tools/cloudflare/build.mjs) i też są zwykłymi plikami.
      runWorkerFirst: [
        "/*",
        "!/_next/static/*",
        "!/*/_next/static/*",
        "!/logos/*",
        "!/logos-og/*",
        "!/flags/*",
        "!/images/*",
        // CF_BEZ_PLIKOW_Z_BUILDA=1 ustawia tools/cloudflare/build.mjs na czas builda: lokalny
        // podgląd musi wtedy sam policzyć karty OG i sitemapy, żeby dało się je zapisać.
        ...(process.env.CF_BEZ_PLIKOW_Z_BUILDA === "1" ? [] : GENEROWANE_PRZY_BUILDZIE),
      ],
    },
    env: {
      ASSETS: bindings.assets(),
      // Sekret ustawiany w panelu Cloudflare (Workers → czypolskafirma → Settings → Variables
      // and Secrets) albo `npx wrangler secret put DISCORD_WEBHOOK_URL --name czypolskafirma`.
      // Bez tej deklaracji Worker go nie dostaje i formularz /zglos-firme zwraca błąd 500.
      DISCORD_WEBHOOK_URL: bindings.secret(),
    },
  }),
});
