import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/narzedzia/", "/szukaj/", "/companies/"],
      },
    ],
    sitemap: "https://czypolskafirma.pl/sitemap.xml",
  }
}
