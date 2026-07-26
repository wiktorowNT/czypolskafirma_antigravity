import { ImageResponse } from "next/og"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import { getCountryName } from "@/lib/company-faq"
import {
  OG_SIZE,
  OG_COLORS,
  OG_BOTTOM_SAFE_AREA,
  getOgBaseUrl,
  getDomainFromUrl,
  getFlagCode,
  loadLogoDataUri,
  loadFlagDataUri,
  loadOgFonts,
} from "@/lib/og-assets"

export const runtime = "edge"

export const alt = "Sprawdź pochodzenie kapitału firmy — CzyPolskaFirma.pl"
export const size = OG_SIZE
export const contentType = "image/png"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface OgCompany {
  brand: string
  country_code: string | null
  website_url: string | null
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

  // Bez tego Next 14 cache'uje odpowiedź Supabase bezterminowo (domyślne
  // force-cache dla fetch) i karta serwuje nieaktualne dane firmy — łącznie
  // z werdyktem — długo po zmianie w bazie.
  const revalidate = { next: { revalidate: 3600 } }

  try {
    // 1) Dopasowanie bezpośrednie (exact / znormalizowany / case-insensitive).
    const orFilter = `or=(slug.eq.${encodeURIComponent(decoded)},slug.eq.${encodeURIComponent(
      normalized,
    )},slug.ilike.${encodeURIComponent(decoded)})`
    const directRes = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=${select}&${orFilter}&limit=1`,
      { headers, ...revalidate },
    )
    if (directRes.ok) {
      const rows = await directRes.json()
      if (rows.length > 0) return mapRow(rows[0])
    }

    // 2) Fallback: kanoniczne dopasowanie po slugify (dla niekanonicznych slugów w bazie).
    const wanted = slugify(decoded)
    if (wanted) {
      const allRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?select=${select}`, {
        headers,
        ...revalidate,
      })
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

// Kolumna tekstu ma ~840 px (1200 minus marginesy, kafelek logo i odstęp).
// Dobieramy stopień pisma tak, żeby nazwa zmieściła się w maks. dwóch wierszach.
function getBrandFontSize(brand: string): number {
  const len = brand.length
  if (len <= 16) return 84
  if (len <= 24) return 68
  if (len <= 34) return 56
  return 46
}

// Pierwsza litera marki — zastępuje logo, gdy firma nie ma pliku w public/logos/.
function getMonogram(brand: string): string {
  const first = brand.trim().charAt(0)
  return first ? first.toUpperCase() : "?"
}

export default async function Image({ params }: { params: { slug: string } }) {
  const [company, fonts] = await Promise.all([fetchCompany(params.slug), loadOgFonts()])

  // Gdy nie uda się pobrać danych firmy — neutralny layout bez werdyktu
  // (nie twierdzimy "zagraniczna" dla nieznanej firmy). Gdy firma istnieje,
  // werdykt jest zgodny ze stroną: isPolish = country_code === "PL".
  const found = company !== null
  const brand = company?.brand || "Sprawdź, czy to polska firma"
  const code = company?.country_code || null
  const isPolish = code?.toUpperCase() === "PL"
  const countryName = getCountryName(code)

  const base = getOgBaseUrl()
  const domain = getDomainFromUrl(company?.website_url)
  const flagCode = found ? getFlagCode(code) : null

  const [logo, wordmarkFlag, verdictFlag] = await Promise.all([
    domain ? loadLogoDataUri(domain, base) : Promise.resolve(null),
    loadFlagDataUri("pl", base),
    flagCode ? loadFlagDataUri(flagCode, base) : Promise.resolve(null),
  ])

  // Kolorystyka werdyktu (neutralna czerwień marki, gdy brak danych firmy).
  const accent = found && isPolish ? OG_COLORS.polish : OG_COLORS.foreign
  const accentBright = found && isPolish ? OG_COLORS.polishBright : OG_COLORS.foreignBright
  const verdictText = isPolish ? "Polska firma" : "Firma zagraniczna"

  // Kraj pokazujemy tylko dla firm zagranicznych — przy "Polska firma"
  // wiersz "Kapitał: Polska" tylko powtarzałby werdykt.
  const showCapitalLine = found && !isPolish && countryName !== "Brak danych"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter",
          background: `linear-gradient(135deg, ${OG_COLORS.bgFrom} 0%, ${OG_COLORS.bgVia} 55%, ${OG_COLORS.bgTo} 100%)`,
        }}
      >
        {/* Pasek werdyktu — czytelny sygnał koloru nawet w miniaturze */}
        <div style={{ display: "flex", width: "100%", height: 10, background: accentBright }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: `44px 64px ${OG_BOTTOM_SAFE_AREA}px 64px`,
          }}
        >
          {/* Wordmark — stała belka nad treścią */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {wordmarkFlag && (
              <img src={wordmarkFlag} width={38} alt="" style={{ borderRadius: 5, marginRight: 16 }} />
            )}
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 800,
                color: OG_COLORS.wordmark,
                letterSpacing: "-0.02em",
              }}
            >
              CzyPolskaFirma.pl
            </div>
          </div>

          {/* Blok główny wyśrodkowany w pionie: treść po lewej, logo po prawej */}
          <div style={{ display: "flex", flex: 1, width: "100%", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: getBrandFontSize(brand),
                  fontWeight: 800,
                  color: OG_COLORS.brand,
                  // Nie schodzić poniżej ~1.2: Satori przycina wtedy znaki
                  // diakrytyczne nad wielkimi literami (Ż w "Żabka", Ó, Ź).
                  lineHeight: 1.2,
                  letterSpacing: "-0.03em",
                }}
              >
                {brand}
              </div>

              {found ? (
                /* Werdykt — wypełniona plakietka, dużo mocniejsza niż pastelowa ramka */
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    background: accent,
                    borderRadius: 9999,
                    padding: "16px 34px",
                    marginTop: 28,
                    boxShadow: `0 14px 30px -10px ${accent}`,
                  }}
                >
                  {verdictFlag && (
                    <img
                      src={verdictFlag}
                      width={48}
                      alt=""
                      style={{ borderRadius: 5, marginRight: 20 }}
                    />
                  )}
                  <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#ffffff" }}>
                    {verdictText}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    fontSize: 34,
                    fontWeight: 500,
                    color: OG_COLORS.muted,
                    marginTop: 28,
                  }}
                >
                  Baza pochodzenia kapitału marek działających w Polsce
                </div>
              )}

              {showCapitalLine && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 30,
                    fontWeight: 500,
                    color: OG_COLORS.muted,
                    marginTop: 22,
                  }}
                >
                  Kapitał: {countryName}
                </div>
              )}
            </div>

            {/* Kafelek logo — biały, bo logotypy projektowane są pod jasne tło.
                Bez logotypu wyświetlamy monogram, żeby karta nie miała dziury.
                Dla nieznanej firmy kafelka nie ma w ogóle — nie ma czego pokazać. */}
            {found && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  width: 176,
                  height: 176,
                  marginLeft: 56,
                  background: OG_COLORS.tile,
                  borderRadius: 30,
                  border: `1px solid ${OG_COLORS.tileBorder}`,
                  boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.55)",
                }}
              >
                {logo ? (
                  <img src={logo} width={132} height={132} alt="" style={{ objectFit: "contain" }} />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      fontSize: 92,
                      fontWeight: 800,
                      color: accent,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {getMonogram(brand)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
