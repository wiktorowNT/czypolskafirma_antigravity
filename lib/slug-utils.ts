// Narzędzia do kanonicznych slugów URL i nazw wyświetlanych (marek).
// W bazie kolumna `slug` bywa "surowa" (np. "50 Style", "DM (Drogerie Markt)", "Dr. Max", "Mrówka").
// Kanoniczny slug URL generujemy deterministycznie przez slugify() i używamy go WSZĘDZIE:
// linki, sitemap, canonical, redirecty.

const POLISH_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n", Ó: "o", Ś: "s", Ź: "z", Ż: "z",
}

/**
 * Kanoniczny slug URL:
 * "50 Style" -> "50-style"
 * "DM (Drogerie Markt)" -> "dm-drogerie-markt"
 * "Dr. Max" -> "dr-max"
 * "Mrówka" -> "mrowka"
 * "TaniaKsiazka.pl" -> "taniaksiazka-pl"
 */
export function slugify(name: string): string {
  if (!name) return ""
  return name
    .trim()
    // transliteracja polskich znaków
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => POLISH_MAP[ch] || ch)
    // pozostałe znaki diakrytyczne (é, ü itd.) — rozbij i usuń znaki łączące
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // wszystko poza [a-z0-9] staje się separatorem (spacje, kropki, nawiasy, ukośniki, &, ...)
    .replace(/[^a-z0-9]+/g, "-")
    // zbicie wielokrotnych "-" i przycięcie z brzegów
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Nazwa marki do wyświetlania (H1, title, breadcrumby) na podstawie surowego sluga z bazy.
 * - "biedronka" -> "Biedronka", "polkomtel-plus" -> "Polkomtel Plus" (czyste slugi kebab-case)
 * - "50 Style", "DM (Drogerie Markt)", "Dr. Max", "Mrówka" -> bez zmian (to już nazwa marki)
 */
export function displayNameFromSlug(rawSlug: string): string {
  if (!rawSlug) return ""
  const raw = rawSlug.trim()
  // Jeśli slug zawiera cokolwiek poza małymi literami/cyframi/myślnikami,
  // traktujemy go jako gotową nazwę marki.
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw)) {
    return raw
  }
  return raw
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Nazwa marki do wyświetlania, z priorytetem dla ręcznie zweryfikowanej kolumny
 * `display_name` z bazy (poprawne diakrytyki i wielkość liter, np. "Żabka", "PKO BP").
 * Kolejność: display_name (jeśli niepuste) -> displayNameFromSlug(slug) -> name.
 * Dzięki temu brak wypełnionego display_name nie powoduje regresji — strona
 * zachowuje się tak jak przed dodaniem kolumny.
 */
export function resolveDisplayName(
  displayName: string | null | undefined,
  rawSlug: string | null | undefined,
  fallbackName?: string | null,
): string {
  const dn = displayName?.trim()
  if (dn) return dn
  if (rawSlug) return displayNameFromSlug(rawSlug)
  return fallbackName?.trim() || ""
}

/** Usuwa zdublowane prefiksy w adresach, np. "ul. ul. Żniwna 5" -> "ul. Żniwna 5". */
export function cleanAddress<T extends string | null | undefined>(adres: T): T {
  if (!adres) return adres
  return adres.replace(/\b(ul|al|pl|os)\.\s+\1\.\s*/gi, "$1. ") as T
}
