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
