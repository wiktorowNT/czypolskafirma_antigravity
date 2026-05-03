import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Analytics } from "@vercel/analytics/next"
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
  title: "CzyPolskaFirma — sprawdź z jakiego kraju jest firma",
  description: "Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
  openGraph: {
    title: "CzyPolskaFirma — sprawdź z jakiego kraju jest firma",
    description: "Wybieraj świadomie. Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
    url: "https://czypolskafirma.pl",
    type: "website",
    locale: "pl_PL",
    siteName: "CzyPolskaFirma",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "CzyPolskaFirma",
      url: "https://czypolskafirma.pl",
      description: "Sprawdź, czy firma jest polska oraz jaka jest jej struktura właścicielska.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://czypolskafirma.pl/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    }),
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl-PL" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body className="font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          <Header />
          {children}
          <Footer />
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
