import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"

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
    default: "CzyPolskaFirma — sprawdź pochodzenie kapitału firmy",
    template: "%s | CzyPolskaFirma",
  },
  description: "Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska. Baza danych polskiego kapitału.",
  keywords: ["polska firma", "kapitał polski", "pochodzenie firmy", "patriotyzm gospodarczy", "właściciel firmy"],
  openGraph: {
    title: "CzyPolskaFirma — sprawdź pochodzenie kapitału firmy",
    description: "Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
    url: "https://czypolskafirma.pl",
    type: "website",
    locale: "pl_PL",
    siteName: "CzyPolskaFirma",
  },
  twitter: {
    card: "summary_large_image",
    title: "CzyPolskaFirma — sprawdź pochodzenie kapitału firmy",
    description: "Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
    creator: "@CzyPolskaFirma",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CzyPolskaFirma",
    "url": "https://czypolskafirma.pl",
    "description": "Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://czypolskafirma.pl/szukaj?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <html lang="pl-PL" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          <Header />
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </Suspense>
      </body>
    </html>
  )
}
