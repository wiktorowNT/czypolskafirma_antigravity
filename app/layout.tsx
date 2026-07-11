import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import { serializeJsonLd } from "@/lib/json-ld"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://czypolskafirma.pl"),
  title: {
    default: "CzyPolskaFirma — sprawdź, czy firma jest polska",
    template: "%s | CzyPolskaFirma.pl",
  },
  description: "Wybieraj świadomie polskie produkty. Sprawdź pochodzenie kapitału, strukturę właścicielską i podatki ponad 500 firm w Polsce. Twoje pieniądze mają moc!",
  // Uwaga: bez globalnego `alternates.canonical` — każda strona ustawia canonical na samą siebie.
  // Uwaga: bez `keywords` — Google ignoruje meta keywords, to tylko szum.
  openGraph: {
    title: "CzyPolskaFirma — sprawdź pochodzenie kapitału firmy",
    description: "Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
    url: "https://czypolskafirma.pl",
    type: "website",
    locale: "pl_PL",
    siteName: "CzyPolskaFirma",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CzyPolskaFirma Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CzyPolskaFirma — sprawdź pochodzenie kapitału firmy",
    description: "Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
    creator: "@CzyPolskaFirma",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "CzyPolskaFirma",
        "url": "https://czypolskafirma.pl",
        "description": "Niezależna baza danych polskiego kapitału i struktury właścicielskiej firm.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://czypolskafirma.pl/szukaj?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "name": "CzyPolskaFirma",
        "url": "https://czypolskafirma.pl",
        "logo": "https://czypolskafirma.pl/logo.png",
        "foundingDate": "2023",
        "description": "Niezależny projekt obywatelski promujący patriotyzm gospodarczy poprzez dostarczanie sprawdzonych informacji o pochodzeniu kapitału przedsiębiorstw działających w Polsce.",
        "sameAs": [
          "https://x.com/czypolskafirma"
        ]
      }
    ]
  }

  return (
    <html lang="pl-PL" className={`${inter.variable} ${playfair.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="d7fcfe14-5859-4a38-9101-1ea0565f2b4e"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <Header />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
