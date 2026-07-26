import { ImageResponse } from "next/og"
import {
  OG_SIZE,
  OG_COLORS,
  OG_BOTTOM_SAFE_AREA,
  getOgBaseUrl,
  loadFlagDataUri,
  loadOgFonts,
} from "@/lib/og-assets"

export const runtime = "edge"

export const alt = "CzyPolskaFirma — sprawdź, z jakiego kraju jest firma"
export const size = OG_SIZE
export const contentType = "image/png"

export default async function Image() {
  const [fonts, flag] = await Promise.all([loadOgFonts(), loadFlagDataUri("pl", getOgBaseUrl())])

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
        <div
          style={{ display: "flex", width: "100%", height: 10, background: OG_COLORS.foreignBright }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: `48px 72px ${OG_BOTTOM_SAFE_AREA}px 72px`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
            {flag && (
              <img src={flag} width={72} alt="" style={{ borderRadius: 8, marginRight: 24 }} />
            )}
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 800,
                color: OG_COLORS.wordmark,
                letterSpacing: "-0.03em",
              }}
            >
              CzyPolskaFirma.pl
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 800,
              color: OG_COLORS.brand,
              // ≥1.2, inaczej Satori przycina diakrytyki nad wielkimi literami.
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              maxWidth: 1000,
              marginBottom: 28,
            }}
          >
            Sprawdź, z jakiego kraju jest firma
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 500,
              color: OG_COLORS.muted,
              lineHeight: 1.4,
              maxWidth: 940,
            }}
          >
            Wybieraj świadomie. Poznaj strukturę właścicielską i pochodzenie kapitału marek z Polski.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
