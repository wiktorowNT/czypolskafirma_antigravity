import { describe, expect, it } from "vitest"
import { czyOgolnyWlasciciel } from "@/lib/wlasciciele"

// Zapisy z docs/AUDYT_DANYCH_2026-11.md, sekcja 1e: ogólniki, które łączyłyby
// niepowiązane firmy w sekcji „Inne firmy, których właścicielem jest …”.
describe("czyOgolnyWlasciciel: ogólniki", () => {
  it.each([
    "Polscy właściciele",
    "Polscy założyciele",
    "Akconariat rozproszony",
    "Akcjonariat rozproszony",
    "Polscy wspólnicy (osoby fizyczne)",
    "Polscy wspólnicy prywatni",
    "Polscy wspólnicy, osoby fizyczne",
    "Prywatny wspólnik większościowy (osoba fizyczna)",
    "Polski właściciel prywatny (osoba fizyczna)",
    "Polscy akcjonariusze prywatni",
    "Trzech polskich wspólników (osoby fizyczne)",
    "Polscy beneficjenci rzeczywiści (CRBR)",
    "Prywatni właściciele z Polski (2 beneficjentów wg CRBR)",
    "Polski beneficjent rzeczywisty (CRBR)",
    "Polscy inwestorzy prywatni",
    "Polscy prywatni inwestorzy",
    "Brak danych",
    "Osoby fizyczne",
    "",
    "  ",
    "AB",
  ])("%j", (zapis) => {
    expect(czyOgolnyWlasciciel(zapis)).toBe(true)
  })

  it("null i undefined", () => {
    expect(czyOgolnyWlasciciel(null)).toBe(true)
    expect(czyOgolnyWlasciciel(undefined)).toBe(true)
  })
})

describe("czyOgolnyWlasciciel: konkretne podmioty zostają", () => {
  it.each([
    "Polska Grupa Zbrojeniowa",
    "Polski Fundusz Rozwoju",
    "Haleon plc (akcjonariat rozproszony)",
    "Hugo Boss AG (akcjonariat rozproszony)",
    "Założyciele Maspeksu i ich rodziny",
    "Założyciele Wirtualnej Polski (Świderski, Brański, Sierota)",
    "Rodzina Mulliez",
    "Skarb Państwa",
    "Mike Ashley (Frasers Group)",
    "CVC Capital Partners",
    "Dominik Kulczyk",
  ])("%j", (zapis) => {
    expect(czyOgolnyWlasciciel(zapis)).toBe(false)
  })
})
