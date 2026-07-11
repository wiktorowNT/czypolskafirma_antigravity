// Bezpieczna serializacja danych strukturalnych (JSON-LD) do wstrzyknięcia
// w <script type="application/ld+json"> przez dangerouslySetInnerHTML.
//
// JSON.stringify sam w sobie NIE zabezpiecza przed wyjściem z tagu <script>:
// jeśli którekolwiek pole zawiera podciąg "</script>" (albo separatory linii
// U+2028/U+2029), przeglądarka zamyka skrypt i reszta trafia do DOM.
// Escapujemy więc znaki, które mogłyby przerwać kontekst skryptu:
//   0x3C '<'   0x3E '>'   0x26 '&'   0x2028 LS   0x2029 PS
const NEEDS_ESCAPE = new Set([0x3c, 0x3e, 0x26, 0x2028, 0x2029])

export function serializeJsonLd(data: unknown): string {
  const json = JSON.stringify(data)
  let out = ""
  for (const ch of json) {
    const code = ch.codePointAt(0) as number
    out += NEEDS_ESCAPE.has(code)
      ? "\\u" + code.toString(16).padStart(4, "0")
      : ch
  }
  return out
}
