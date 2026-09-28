// Firmy dodane w Panelu projektu trafiają do bazy z published = false. Widać je na podglądzie
// (Vercel preview gałęzi develop) i lokalnie (npm run dev), a na czypolskafirma.pl dopiero po
// kliknięciu „Opublikuj” w panelu (krok 8). Domyślnie ukrywamy: gdy środowisko nie jest
// rozpoznane, nieopublikowane firmy się nie pokażą.
export const POKAZ_NIEOPUBLIKOWANE =
  process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

/** Początek zapytania REST do tabeli companies: `${SUPABASE_URL}/rest/v1/companies?${FILTR_PUBLIKACJI}select=…` */
export const FILTR_PUBLIKACJI = POKAZ_NIEOPUBLIKOWANE ? "" : "published=eq.true&"
