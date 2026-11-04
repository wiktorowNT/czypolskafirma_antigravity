// Konfiguracja testów jednostkowych (vitest). Uruchamianie: `npm test`.
// Testy leżą w katalogu tests/ (struktura odbija lib/ i app/). Nie łączą się
// z prawdziwą bazą: Supabase i fetch są w testach atrapami.
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // Ten sam alias co w tsconfig.json ("@/*" -> "./*").
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Stała strefa czasowa: część logiki (daty wpisów bloga, rok założenia w FAQ)
    // zależy od lokalnego czasu, a wynik nie może zależeć od maszyny.
    env: { TZ: "UTC" },
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
})
