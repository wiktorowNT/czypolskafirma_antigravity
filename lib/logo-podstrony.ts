import logoPodstron from "@/data/logo-podstrony.json"

const LOGO_PODSTRON = logoPodstron as Record<string, string>

// Klucz logo podstrony: "domena~sciezka" (ścieżka i dopisek po "#" małymi literami, inne znaki -> "-").
// Dopisek po "#" pozwala dać własne logo marce, która nie ma osobnej strony
// (https://www.bat.com.pl/#pall-mall -> bat.com.pl~pall-mall); link dalej prowadzi na stronę grupy.
// Ta sama funkcja jest w tools/firmy/panel.mjs (kluczPodstrony) — zmieniaj obie naraz.
export function getSubpageKey(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    const sciezka = decodeURIComponent(u.pathname + u.hash.replace(/^#/, '/')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return sciezka ? `${host}~${sciezka}` : null
  } catch {
    return null
  }
}

/** Plik logo podstrony z data/logo-podstrony.json (np. "bros.pl~marki-microbec.svg") albo null. */
export function getSubpageLogoFile(url?: string | null): string | null {
  const key = getSubpageKey(url)
  return key && LOGO_PODSTRON[key] ? LOGO_PODSTRON[key] : null
}
