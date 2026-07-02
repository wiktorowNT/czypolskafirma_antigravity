// Country code to name mapping (shared)
const countryNames: Record<string, string> = {
    PL: "Polska", FR: "Francja", DE: "Niemcy", US: "USA", NL: "Holandia",
    GB: "Wielka Brytania", UK: "Wielka Brytania", SE: "Szwecja", DK: "Dania",
    ES: "Hiszpania", IT: "Włochy", JP: "Japonia", CH: "Szwajcaria",
    AT: "Austria", BE: "Belgia", LU: "Luksemburg", IE: "Irlandia",
    PT: "Portugalia", CZ: "Czechy", SK: "Słowacja", HU: "Węgry",
    KR: "Korea Południowa", FI: "Finlandia", NO: "Norwegia",
}

function getCountryName(code?: string | null): string {
    if (!code) return "Brak danych"
    return countryNames[code.toUpperCase()] || code.toUpperCase()
}

// Format slug as display name: "zara" -> "Zara", "polkomtel-plus" -> "Polkomtel Plus"
function formatSlugAsName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

interface CompanyArticleProps {
    slug: string
    country_code?: string | null
    ownership_description?: string | null
    owner_name?: string | null
    parent_company_name?: string | null
    business_description?: string | null
    categoryName?: string | null
    adres?: string | null
    siedziba_pl?: boolean
    founded_at?: string | null
    age?: number
    ownership_type?: string | null
}

export default function CompanyArticle({
    slug,
    country_code,
    ownership_description,
    owner_name,
    parent_company_name,
    business_description,
    categoryName,
    adres,
    siedziba_pl,
    founded_at,
    age,
    ownership_type,
}: CompanyArticleProps) {
    const name = formatSlugAsName(slug)
    const isPolish = country_code?.toUpperCase() === "PL"
    const countryName = getCountryName(country_code)
    const ownerDisplay = owner_name || parent_company_name

    // Build article paragraphs from available data
    const paragraphs: string[] = []

    // Opening paragraph — identity + origin
    const statusText = isPolish ? "polska firma" : "firma zagraniczna"
    let opening = `${name} to ${statusText}`
    if (!isPolish && countryName !== "Brak danych") {
        opening += `, której kapitał pochodzi z kraju: ${countryName}`
    }
    if (siedziba_pl) {
        opening += `. Firma posiada zarejestrowaną siedzibę w Polsce`
    }
    if (adres) {
        opening += ` pod adresem ${adres}`
    }
    opening += "."
    paragraphs.push(opening)

    // Business description paragraph
    if (business_description) {
        paragraphs.push(business_description)
    }

    // Ownership paragraph
    if (ownerDisplay || ownership_description) {
        let ownerPara = ""
        if (ownership_type && ownerDisplay) {
            const typeLabel =
                ownership_type === "Spółka Córka" ? "spółką córką należącą do" :
                ownership_type === "Spółka zależna" ? "spółką zależną od" :
                "firmą, której właścicielem jest"
            ownerPara = `${name} jest ${typeLabel} ${ownerDisplay}.`
        } else if (ownerDisplay) {
            ownerPara = `Właścicielem firmy ${name} jest ${ownerDisplay}.`
        }
        if (ownership_description) {
            ownerPara += ownerPara ? ` ${ownership_description}` : ownership_description
        }
        if (ownerPara.trim()) {
            paragraphs.push(ownerPara.trim())
        }
    }

    // History paragraph
    if (founded_at && age !== undefined && age > 0) {
        const year = new Date(founded_at).getFullYear()
        paragraphs.push(
            `${name} działa na polskim rynku od ${year} roku, co oznacza ponad ${age} lat obecności w Polsce.`
        )
    }

    // Category paragraph
    if (categoryName) {
        paragraphs.push(
            `Na stronie CzyPolskaFirma.pl firma ${name} jest sklasyfikowana w kategorii ${categoryName}. Sprawdź inne firmy z tej kategorii, aby porównać ich pochodzenie kapitału.`
        )
    }

    if (paragraphs.length <= 1) return null

    return (
        <section className="mt-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-medium text-slate-400 mb-2">
                {name} — podsumowanie
            </h2>
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                {paragraphs.map((para, index) => (
                    <p key={index}>{para}</p>
                ))}
            </div>
        </section>
    )
}
