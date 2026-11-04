import type { Metadata } from "next"

// Karty społecznościowe (Open Graph i X) dla stron z własnym adresem.
// Next nie łączy pól `openGraph` z layoutem, tylko podmienia cały obiekt, więc strona z własnym
// openGraph musi sama podać obrazek. Bez `twitter` karta na X brałaby tytuł strony głównej.

export const ADRES_SERWISU = "https://czypolskafirma.pl"

/**
 * Wspólna karta serwisu z app/opengraph-image.tsx (1200x630, statyczna, odświeżana raz na dobę).
 * Tę kartę strony bez własnego openGraph dziedziczyły z korzenia aplikacji; własny openGraph
 * by ją zgubił, więc podajemy ją jawnie. public/og-image.png (1200x510) Facebook przycina.
 */
export const OBRAZEK_OG = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "CzyPolskaFirma: sprawdź, z jakiego kraju jest firma",
}

export function kartySpolecznosciowe({
  tytul,
  opis,
  sciezka,
}: {
  /** Pełny tytuł karty (bez szablonu z layoutu, więc z nazwą serwisu, jeśli ma być). */
  tytul: string
  opis: string
  /** Ścieżka strony od ukośnika, np. "/metodologia"; "/" dla strony głównej. */
  sciezka: string
}): Pick<Metadata, "openGraph" | "twitter"> {
  const url = sciezka === "/" ? ADRES_SERWISU : `${ADRES_SERWISU}${sciezka}`
  return {
    openGraph: {
      title: tytul,
      description: opis,
      url,
      type: "website",
      locale: "pl_PL",
      siteName: "CzyPolskaFirma",
      images: [OBRAZEK_OG],
    },
    twitter: {
      card: "summary_large_image",
      title: tytul,
      description: opis,
      creator: "@CzyPolskaFirma",
      images: [OBRAZEK_OG.url],
    },
  }
}
