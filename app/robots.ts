import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Uwaga: /companies/ musi być crawlowalne — to główna lista firm (internal linking).
        disallow: ["/api/", "/narzedzia/", "/szukaj/"],
      },
    ],
    sitemap: "https://czypolskafirma.pl/sitemap.xml",
  }
}
