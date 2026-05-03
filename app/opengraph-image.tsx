import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'CzyPolskaFirma — sprawdź z jakiego kraju jest firma'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #ffffff, #f1f5f9)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px',
          borderTop: '20px solid #dc2626',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: '50px',
          }}
        >
          <img
            src="https://flagcdn.com/w160/pl.png"
            alt="Polska flaga"
            width={80}
            style={{ borderRadius: '8px', marginRight: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            CzyPolskaFirma
          </div>
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: '#1e293b',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '32px',
            maxWidth: '1000px',
          }}
        >
          Sprawdź z jakiego kraju jest firma
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: '#475569',
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '900px',
          }}
        >
          Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
