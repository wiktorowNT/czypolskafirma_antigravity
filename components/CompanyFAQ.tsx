"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { buildCompanyFaqItems } from "@/lib/company-faq"

// Format slug as display name: "zara" -> "Zara", "polkomtel-plus" -> "Polkomtel Plus"
function formatSlugAsName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

interface CompanyFAQProps {
    slug: string
    brandName?: string
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
    brandName,
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
    const name = brandName || formatSlugAsName(slug)

    // Wspólna logika z lib/company-faq.ts — te same pytania/odpowiedzi trafiają
    // do JSON-LD FAQPage na stronie firmy.
    const faqItems = buildCompanyFaqItems({
        brandName: name,
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
    })

    if (faqItems.length === 0) return null

    return (
        <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink mb-4">
                Najczęściej zadawane pytania o {name}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
                {faqItems.map((item, index) => (
                    <AccordionItem
                        key={index}
                        value={`faq-${index}`}
                        className="border-[1.5px] border-line rounded-2xl px-5 last:border-b-[1.5px] data-[state=open]:border-ink/40"
                    >
                        <AccordionTrigger className="text-[15.5px] font-bold text-ink hover:no-underline py-4">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-[15px] text-ink-2 leading-relaxed pb-4">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    )
}
