import { getCountryName } from "@/lib/company-faq"
import { cn } from "@/lib/utils"

/**
 * Metka z werdyktem — podstawowy element systemu „Półka” (docs/DESIGN_SYSTEM.md).
 * Cegła = polski kapitał, grafit = zagraniczny. Style: .metka w app/globals.css.
 *
 * Domyślna etykieta to nazwa kraju pochodzenia kapitału („Polska”, „Wielka Brytania”);
 * kolor metki niesie werdykt. Bez kodu kraju: „Firma zagraniczna”. Inny tekst: label={...}.
 */
export function VerdictTag({
    countryCode,
    label,
    size = "md",
    className,
}: {
    countryCode?: string | null
    label?: string
    size?: "sm" | "md" | "lg"
    className?: string
}) {
    const code = countryCode?.toUpperCase() || null
    const isPolish = code === "PL"
    const countryName = code ? getCountryName(code) : null
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
            {code && (
                <img
                    src={`https://flagcdn.com/w40/${code === "UK" ? "gb" : code.toLowerCase()}.png`}
                    alt={`Flaga: ${countryName} — kraj pochodzenia kapitału`}
                    width={20}
                    height={15}
                />
            )}
            {text}
        </span>
    )
}
