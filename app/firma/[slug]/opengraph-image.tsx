import { ImageResponse } from "next/og"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import { getCountryName } from "@/lib/company-faq"

export const runtime = "edge"

export const alt = "Sprawdź pochodzenie kapitału firmy — CzyPolskaFirma.pl"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface OgCompany {
  brand: string
  country_code: string | null
  website_url: string | null
}

// Origin do pobierania statycznych logotypów z /public/logos/.
// Na Vercel: bieżący deployment (preview lub prod); lokalnie/fallback: produkcja.
function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "https://czypolskafirma.pl"
}

// Ta sama logika domeny co components/company-logo.tsx (host bez www).
function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

async function fetchCompany(slugOrId: string): Promise<OgCompany | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: "application/json",
  }
  const select = "id,name,slug,display_name,country_code,website_url"
  const decoded = decodeURIComponent(slugOrId)
  const normalized = decoded.toLowerCase().trim().replace(/\s+/g, "-")

  try {
    // 1) Dopasowanie bezpośrednie (exact / znormalizowany / case-insensitive).
    const orFilter = `or=(slug.eq.${encodeURIComponent(decoded)},slug.eq.${encodeURIComponent(
      normalized,
    )},slug.ilike.${encodeURIComponent(decoded)})`
    const directRes = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=${select}&${orFilter}&limit=1`,
      { headers },
    )
    if (directRes.ok) {
      const rows = await directRes.json()
      if (rows.length > 0) return mapRow(rows[0])
    }

    // 2) Fallback: kanoniczne dopasowanie po slugify (dla niekanonicznych slugów w bazie).
    const wanted = slugify(decoded)
    if (wanted) {
      const allRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?select=${select}`, { headers })
      if (allRes.ok) {
        const all = await allRes.json()
        const match = all.find((c: any) => c.slug && slugify(c.slug) === wanted)
        if (match) return mapRow(match)
      }
    }
  } catch {
    return null
  }
  return null
}

function mapRow(row: any): OgCompany {
  return {
    brand: resolveDisplayName(row.display_name, row.slug, row.name),
    country_code: row.country_code || null,
    website_url: row.website_url || null,
  }
}

// Pobiera logo z /public/logos/{domena}.{ext} jako data URI (jeden fetch, bez
// polegania na ponownym pobraniu przez Satori). Zwraca null, gdy pliku brak.
async function loadLogoDataUri(domain: string, base: string): Promise<string | null> {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    try {
      const res = await fetch(`${base}/logos/${domain}.${ext}`)
      if (!res.ok) continue
      const contentType = res.headers.get("content-type") || ""
      if (!contentType.startsWith("image")) continue
      const buf = await res.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let binary = ""
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      return `data:${contentType};base64,${btoa(binary)}`
    } catch {
      // spróbuj kolejnego rozszerzenia
    }
  }
  return null
}

export default async function Image({ params }: { params: { slug: string } }) {
  const company = await fetchCompany(params.slug)

  // Gdy nie uda się pobrać danych firmy — neutralny layout bez werdyktu
  // (nie twierdzimy "zagraniczna" dla nieznanej firmy). Gdy firma istnieje,
  // werdykt jest zgodny ze stroną: isPolish = country_code === "PL".
  const found = company !== null
  const brand = company?.brand || "Sprawdź firmę"
  const code = company?.country_code || null
  const isPolish = code?.toUpperCase() === "PL"
  const countryName = getCountryName(code)

  // Kod flagi dla flagcdn (lowercase alpha-2; UK -> gb).
  const flagCode = code ? (code.toLowerCase() === "uk" ? "gb" : code.toLowerCase()) : null

  // Logo (opcjonalne).
  const domain = getDomainFromUrl(company?.website_url)
  const logo = domain ? await loadLogoDataUri(domain, getBaseUrl()) : null

  // Kolorystyka werdyktu (neutralna, gdy brak danych firmy).
  const accent = !found ? "#dc2626" : isPolish ? "#16a34a" : "#dc2626"
  const verdictBg = isPolish ? "#f0fdf4" : "#fef2f2"
  const verdictBorder = isPolish ? "#bbf7d0" : "#fecaca"
  const verdictText = isPolish ? "Polska firma" : "Firma zagraniczna"

  // Dopasowanie wielkości nazwy do długości (limit szerokości).
  const brandFont = brand.length > 26 ? 52 : brand.length > 16 ? 64 : 76

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom right, #ffffff, #f1f5f9)",
          borderTop: `20px solid ${accent}`,
          padding: "72px 80px",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 80,
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src="https://flagcdn.com/w80/pl.png"
            width={40}
            alt=""
            style={{ borderRadius: "6px", marginRight: "16px" }}
          />
          <div style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            CzyPolskaFirma.pl
          </div>
        </div>

        {/* Logo w jasnej plakietce (stały kontener, contain — bez zniekształceń) */}
        {logo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 180,
              height: 180,
              background: "#ffffff",
              borderRadius: 28,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08)",
              marginBottom: 40,
            }}
          >
            <img
              src={logo}
              width={140}
              height={140}
              alt=""
              style={{ objectFit: "contain" }}
            />
          </div>
        )}

        {/* Nazwa marki */}
        <div
          style={{
            display: "flex",
            fontSize: brandFont,
            fontWeight: 800,
            color: "#0f172a",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            maxWidth: 1040,
            marginBottom: 36,
          }}
        >
          {brand}
        </div>

        {/* Werdykt (flaga + tekst) — tylko gdy mamy dane firmy */}
        {found ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: verdictBg,
              border: `2px solid ${verdictBorder}`,
              borderRadius: 9999,
              padding: "18px 34px",
            }}
          >
            {flagCode && (
              <img
                src={`https://flagcdn.com/w80/${flagCode}.png`}
                width={52}
                alt=""
                style={{ borderRadius: "6px", marginRight: "20px", boxShadow: "0 2px 4px rgb(0 0 0 / 0.1)" }}
              />
            )}
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: accent }}>
              {verdictText}
            </div>
          </div>
        ) : (
          // Brak danych firmy — neutralny podpis zamiast werdyktu.
          <div style={{ display: "flex", fontSize: 34, color: "#475569", textAlign: "center", maxWidth: 900 }}>
            Sprawdź pochodzenie kapitału firmy
          </div>
        )}

        {/* Kraj pochodzenia kapitału (dla firm zagranicznych) */}
        {found && !isPolish && countryName !== "Brak danych" && (
          <div style={{ display: "flex", fontSize: 28, color: "#64748b", marginTop: 22 }}>
            Kapitał: {countryName}
          </div>
        )}
      </div>
    ),
    { ...size },
  )
}
