/**
 * Rozpoznanie „ogólnego” właściciela: zapis opisuje grupę osób, a nie jeden podmiot
 * („Polscy właściciele”, „Akcjonariat rozproszony”, „Trzech polskich wspólników”).
 *
 * Profil firmy pokazuje sekcję „Inne firmy, których właścicielem jest …” po równości
 * `owner_name`. Dla ogólnika połączyłaby niepowiązane firmy: audyt danych z 2026-11
 * (docs/AUDYT_DANYCH_2026-11.md, sekcja 1e) znalazł m.in. „Polscy właściciele” przy
 * 22 profilach z 22 różnych spółek. Dla takich zapisów sekcji nie pokazujemy.
 *
 * Konkretne podmioty z dopiskiem („Haleon plc (akcjonariat rozproszony)”) i nazwane osoby
 * („Założyciele Maspeksu i ich rodziny”) zostają, bo zapis zaczyna się od konkretu.
 */

/** Zapisy, które od początku są ogólnikiem. */
const OGOLNY_POCZATEK =
  /^(brak|nieznan|rozproszon|akcjonariusz|akcjonariat|akconariat|inwestorzy|free float|wielu|osoby fizyczne|osoba fizyczna|inni|fundusze inwestycyjne)/i

/** Liczebnik na początku: „Trzech polskich wspólników”, „Dwaj założyciele”. */
const LICZEBNIK = /^(dwaj|dwie|dwóch|dwoje|trzej|trzech|troje|czterej|czterech|pięciu)\s/i

/**
 * Przymiotnik + rzeczownik opisujący grupę: „Polscy właściciele”, „Polski beneficjent
 * rzeczywisty”, „Prywatny wspólnik większościowy”, „Polscy inwestorzy prywatni”.
 * Dopuszcza jedno słowo pomiędzy („Polscy prywatni inwestorzy”). Nazwy firm zaczynające
 * się od „Polska …” („Polska Grupa Zbrojeniowa”) nie pasują, bo brak rzeczownika z listy.
 */
const PRZYMIOTNIK_I_GRUPA =
  /^(polsc|polsk|prywatn)\S*\s+(\S+\s+)?(właściciel|założyciel|wspólni|akcjonariusz|inwestor|beneficjen|udziałowc|osob)/i

export function czyOgolnyWlasciciel(wlasciciel: string | null | undefined): boolean {
  const zapis = (wlasciciel || "").trim()
  if (zapis.length < 3) return true
  return OGOLNY_POCZATEK.test(zapis) || LICZEBNIK.test(zapis) || PRZYMIOTNIK_I_GRUPA.test(zapis)
}
