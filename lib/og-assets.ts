// Wspólne zasoby dla dynamicznych kart OG (app/opengraph-image.tsx oraz
// app/firma/[slug]/opengraph-image.tsx).
//
// Karty renderuje Satori, które ma dwa ograniczenia istotne dla tego projektu:
//   * nie dekoduje WebP (a 119 logotypów w public/logos/ to .webp),
//   * nie renderuje plików .svg podanych jako <img src>.
// Dlatego `tools/generate-og-assets.mjs` wystawia dla nich kopie PNG w
// public/logos-og/, a poniższy loader sięga tam, gdy oryginał jest nieczytelny.

import { headers } from "next/headers"

export const OG_SIZE = { width: 1200, height: 630 }

// Paleta karty. Ciemne tło daje kontrast w feedzie X-a i Facebooka —
// poprzednia biała karta zlewała się z tłem osi czasu.
// Kolory kart OG w systemie „Półka” (docs/DESIGN_SYSTEM.md): ciepłe tło, cegła = polski
// kapitał, grafit = zagraniczny — tak samo jak metka z werdyktem na stronie.
export const OG_COLORS = {
  bgFrom: "#f6f3ee",
  bgVia: "#f6f3ee",
  bgTo: "#f6f3ee",
  tile: "#ffffff",
  tileBorder: "#e4dfd6",
  brand: "#1f1d1a",
  muted: "#6b665e",
  wordmark: "#1f1d1a",
  polish: "#c2381f",
  polishBright: "#c2381f",
  foreign: "#3b3833",
  foreignBright: "#3b3833",
} as const

// X nakłada na dolną krawędź obrazka własną plakietkę z tytułem strony.
// Ta strefa musi zostać pusta, żeby nie zasłoniła treści karty.
export const OG_BOTTOM_SAFE_AREA = 118

/**
 * Origin, spod którego karta pobiera statyczne zasoby (logotypy, flagi).
 * Kolejność: host bieżącego żądania → deployment Vercela → produkcja.
 * Dzięki pierwszemu wariantowi karta działa też na `npm run dev`.
 */
export function getOgBaseUrl(): string {
  try {
    const h = headers()
    const host = h.get("x-forwarded-host") || h.get("host")
    if (host) {
      const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")
      return `${proto}://${host}`
    }
  } catch {
    // headers() niedostępne — schodzimy do wariantów poniżej.
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "https://czypolskafirma.pl"
}

/** Host bez www — ta sama logika co components/company-logo.tsx. */
export function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

/** Kod flagi w konwencji plików w public/flags (UK → gb). */
export function getFlagCode(code?: string | null): string | null {
  if (!code) return null
  const lower = code.toLowerCase()
  return lower === "uk" ? "gb" : lower
}

async function toDataUri(res: Response): Promise<string | null> {
  const contentType = res.headers.get("content-type") || ""
  if (!contentType.startsWith("image")) return null
  const bytes = new Uint8Array(await res.arrayBuffer())
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return `data:${contentType};base64,${btoa(binary)}`
}

async function fetchImageDataUri(url: string): Promise<string | null> {
  try {
    // Dobowa rewalidacja zamiast domyślnego force-cache — podmieniony logotyp
    // trafi na kartę bez czekania na kolejny deployment.
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    return await toDataUri(res)
  } catch {
    return null
  }
}

/**
 * Logo firmy jako data URI. Najpierw formaty czytelne dla Satori prosto
 * z public/logos/, potem konwersja PNG z public/logos-og/ (webp/svg).
 * Zwraca null, gdy firma nie ma logotypu — karta użyje wtedy monogramu.
 */
export async function loadLogoDataUri(domain: string, base: string): Promise<string | null> {
  for (const ext of ["png", "jpg", "jpeg"]) {
    const uri = await fetchImageDataUri(`${base}/logos/${domain}.${ext}`)
    if (uri) return uri
  }
  return await fetchImageDataUri(`${base}/logos-og/${domain}.png`)
}

/** Flaga państwa jako data URI (public/flags/{kod}.png). */
export async function loadFlagDataUri(code: string, base: string): Promise<string | null> {
  return await fetchImageDataUri(`${base}/flags/${code}.png`)
}

/**
 * Inter w wagach 500 i 800 — ten sam krój co na stronie. Pliki to podzbiory
 * (ASCII + Latin-1 + Latin Extended-A) generowane przez tools/generate-og-assets.mjs,
 * po ~58 kB, żeby nie rozdmuchać bundle'a funkcji edge.
 */
export async function loadOgFonts() {
  const [regular, bold] = await Promise.all([
    fetch(new URL("../assets/og/inter-500.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL("../assets/og/inter-800.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
  ])
  return [
    { name: "Inter", data: regular, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 800 as const, style: "normal" as const },
  ]
}
