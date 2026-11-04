/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  experimental: {
    // Next 15 zmienił domyślny czas życia klienckiego Router Cache dla segmentów
    // stron z 30 s (Next 14) na 0. Przy /kategoria/[slug], która renderuje się
    // dynamicznie, każda nawigacja Linkiem i każde „wstecz" oznaczałoby wtedy
    // nowe wywołanie funkcji na Vercelu. Przywracamy wartość z Next 14, żeby
    // migracja nie podniosła zużycia CPU.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },

  // Next 15: outputFileTracingIncludes jest stabilne i przeniesione z `experimental`
  // na najwyższy poziom konfiguracji. Pod `experimental` Next 15 go NIE czyta
  // („Unrecognized key"), co wróciłoby błędem opisanym poniżej.
  //
  // Wpisy bloga czytamy z dysku (content/blog/*.md) przez fs w czasie działania.
  // Next nie potrafi wyśledzić tej zależności automatycznie, bo ścieżka powstaje
  // dynamicznie z process.cwd() — przez co pliki .md nie trafiały do bundla funkcji
  // na Vercelu. Skutek: po pierwszej regeneracji (revalidate) listPostFiles() nie
  // widziało katalogu, zwracało [] i WSZYSTKIE wpisy blogowe znikały z sitemapy.
  // Strony /blog/[slug] tego nie ujawniały, bo są prerenderowane w czasie builda.
  outputFileTracingIncludes: {
    '/sitemap.xml': ['./content/blog/**/*'],
    '/sitemap-blog.xml': ['./content/blog/**/*'],
    '/blog': ['./content/blog/**/*'],
    '/blog/[slug]': ['./content/blog/**/*'],
    // Fonty kart OG czytane przez fs (lib/og-assets.ts).
    '/opengraph-image': ['./assets/og/**/*'],
    '/firma/[slug]/opengraph-image': ['./assets/og/**/*'],
  },
}

export default nextConfig
