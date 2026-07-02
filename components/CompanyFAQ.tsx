"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

// Country code to name mapping
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

interface CompanyFAQProps {
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
}

export default function CompanyFAQ({
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
}: CompanyFAQProps) {
    const name = formatSlugAsName(slug)
    const isPolish = country_code?.toUpperCase() === "PL"
    const countryName = getCountryName(country_code)
    const ownerDisplay = owner_name || parent_company_name

    // Build FAQ items dynamically from available data
    const faqItems: { question: string; answer: string }[] = []

    // Q1: Is it a Polish company?
    const originText = isPolish
        ? `Tak, ${name} to polska firma. Kapitał firmy pochodzi z Polski.`
        : `Nie, ${name} to firma zagraniczna. Kapitał firmy pochodzi z kraju: ${countryName}.`
    const ownershipSuffix = ownership_description
        ? ` ${ownership_description}`
        : ""
    faqItems.push({
        question: `Czy ${name} to polska firma?`,
        answer: `${originText}${ownershipSuffix}`,
    })

    // Q2: Who owns the company?
    if (ownerDisplay || ownership_description) {
        const ownerText = ownerDisplay
            ? `Właścicielem firmy ${name} jest ${ownerDisplay}.`
            : ""
        const descText = ownership_description
            ? ` ${ownership_description}`
            : ""
        faqItems.push({
            question: `Kto jest właścicielem ${name}?`,
            answer: `${ownerText}${descText}`.trim(),
        })
    }

    // Q3: Where is the headquarters?
    if (adres || siedziba_pl !== undefined) {
        const addressText = adres
            ? `Siedziba firmy ${name} w Polsce znajduje się pod adresem: ${adres}.`
            : siedziba_pl
                ? `${name} posiada zarejestrowaną siedzibę na terenie Polski.`
                : `${name} nie posiada zarejestrowanej siedziby w Polsce.`
        faqItems.push({
            question: `Gdzie ${name} ma siedzibę?`,
            answer: addressText,
        })
    }

    // Q4: What industry / what does the company do?
    if (business_description || categoryName) {
        const bizText = business_description
            ? `${name} — ${business_description}`
            : `${name} działa w kategorii ${categoryName}.`
        const catSuffix = business_description && categoryName
            ? ` Firma jest sklasyfikowana w kategorii: ${categoryName}.`
            : ""
        faqItems.push({
            question: `Czym zajmuje się ${name}?`,
            answer: `${bizText}${catSuffix}`,
        })
    }

    // Q5: How long has the company been operating in Poland?
    if (founded_at && age !== undefined && age > 0) {
        const year = new Date(founded_at).getFullYear()
        faqItems.push({
            question: `Od kiedy ${name} działa w Polsce?`,
            answer: `${name} jest obecna na polskim rynku od ${year} roku, co oznacza ponad ${age} lat działalności w Polsce.`,
        })
    }

    if (faqItems.length === 0) return null

    return (
        <section className="mt-8 pt-6 border-t border-slate-100">
            <h2 className="text-sm font-medium text-slate-400 mb-3">
                Najczęściej zadawane pytania o {name}
            </h2>
            <Accordion type="single" collapsible className="space-y-1">
                {faqItems.map((item, index) => (
                    <AccordionItem
                        key={index}
                        value={`faq-${index}`}
                        className="border border-slate-100 rounded-lg px-4 data-[state=open]:bg-slate-50/50"
                    >
                        <AccordionTrigger className="text-sm text-slate-600 hover:text-slate-900 hover:no-underline py-3 [&[data-state=open]]:text-slate-900">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-slate-500 leading-relaxed pb-3">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    )
}
