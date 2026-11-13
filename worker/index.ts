// Wejście Workera: cienka warstwa przed vinext.
//
// Pliki statyczne (logotypy, flagi, obrazki) Cloudflare serwuje bez udziału Workera, ale
// gdy pliku NIE MA, żądanie trafia tutaj. Strona szuka logotypu kolejno pod kilkoma
// rozszerzeniami (.png → .svg → .jpg → .webp), więc takich pudeł jest dużo, a pełna strona
// 404 z vinext kosztuje kilkadziesiąt ms procesora (darmowy limit to 10 ms). Dlatego dla
// katalogów z plikami odpowiadamy od razu pustym 404.
import handler from "vinext/server/fetch-handler"

export * from "vinext/server/fetch-handler"

const TYLKO_PLIKI = /^\/(logos|logos-og|flags|images)\//

// Strony za ciężkie na 10 ms procesora: tools/cloudflare/build.mjs zapisuje ich HTML przy
// buildzie, a tu oddajemy gotowy plik. Nawigacja w aplikacji (nagłówek RSC: 1) idzie dalej
// przez vinext, bo potrzebuje ładunku RSC, a nie HTML.
const STRONY_Z_BUILDA: Record<string, string> = {
  "/companies": "/_statyczne/companies.html",
}

// Przy prerenderze w Node (vite build) env bywa pusty — stąd sprawdzenia poniżej.
type Env = { ASSETS?: { fetch(request: Request): Promise<Response> } } & Record<string, unknown>

// Sekrety Workera (np. DISCORD_WEBHOOK_URL) są w `env`, a kod Next.js czyta process.env.
function przepiszSekrety(env: Env | undefined) {
  if (!env) return
  const g = globalThis as any
  g.process ??= {}
  g.process.env ??= {}
  for (const [klucz, wartosc] of Object.entries(env)) {
    if (typeof wartosc === "string" && g.process.env[klucz] === undefined) g.process.env[klucz] = wartosc
  }
}

export default {
  ...handler,
  async fetch(request: Request, env: Env, ctx: unknown) {
    const url = new URL(request.url)
    // Jedna wersja adresu: www → bez www (kanoniczne adresy serwisu są bez www).
    if (url.hostname === "www.czypolskafirma.pl") {
      url.hostname = "czypolskafirma.pl"
      return Response.redirect(url.toString(), 301)
    }
    if (TYLKO_PLIKI.test(url.pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
      })
    }
    const plik = STRONY_Z_BUILDA[url.pathname]
    if (plik && env?.ASSETS && request.method === "GET" && !url.search && request.headers.get("RSC") !== "1") {
      const res = await env.ASSETS.fetch(new Request(new URL(plik, url.origin)))
      if (res.ok) {
        return new Response(res.body, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
        })
      }
    }
    przepiszSekrety(env)
    return (handler as any).fetch(request, env, ctx)
  },
}
