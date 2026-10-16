import { getCountryCodes, getCountryLabel, getCountryName } from "@/lib/company-faq"
import { cn } from "@/lib/utils"

/**
 * Metka z werdyktem — podstawowy element systemu „Półka” (docs/DESIGN_SYSTEM.md).
 * Cegła = polski kapitał, grafit = zagraniczny. Style: .metka w app/globals.css.
 *
 * Domyślna etykieta to nazwa kraju pochodzenia kapitału („Polska”, „Wielka Brytania”);
 * kolor metki niesie werdykt. Bez kodu kraju: „Firma zagraniczna”. Inny tekst: label={...}.
 * Wspólna kontrola 50/50 (countryCode2): dwie flagi i „Niemcy i Szwajcaria”; kolor wg countryCode.
 */
export function VerdictTag({
    countryCode,
    countryCode2,
    label,
    size = "md",
    className,
}: {
    countryCode?: string | null
    countryCode2?: string | null
    label?: string
    size?: "sm" | "md" | "lg"
    className?: string
}) {
    const code = countryCode?.toUpperCase() || null
    const isPolish = code === "PL"
    const codes = getCountryCodes(code, countryCode2)
    const countryName = code ? getCountryLabel(code, countryCode2) : null
    const text = label ?? countryName ?? "Firma zagraniczna"

    return (
        <span
            className={cn(
                "metka",
                isPolish && "metka-pl",
                size === "sm" && "metka-sm",
                size === "lg" && "metka-lg",
                className,
            )}
        >
            {codes.map((c) => (
                <img
                    key={c}
                    src={`https://flagcdn.com/w80/${c === "UK" ? "gb" : c.toLowerCase()}.png`}
                    alt={`Flaga: ${getCountryName(c)} — kraj pochodzenia kapitału`}
                    width={26}
                    height={20}
                />
            ))}
            {text}
        </span>
    )
}
