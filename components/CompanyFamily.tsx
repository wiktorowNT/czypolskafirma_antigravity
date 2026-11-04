import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"

interface FamilyCompany {
    id: string
    slug: string
    brand: string
    website_url?: string
}

interface CompanyFamilyProps {
    brandName: string
    sameCompany: FamilyCompany[]
    sameOwner: FamilyCompany[]
    ownerName?: string
}

function FamilyGrid({ items }: { items: FamilyCompany[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map((item) => (
                <Link
                    key={item.id}
                    href={`/firma/${encodeURIComponent(item.slug)}`}
                    className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line px-3.5 py-3 hover:border-ink transition-colors"
                >
                    <CompanyLogo websiteUrl={item.website_url} name={item.brand} size={40} />
                    <p className="flex-1 min-w-0 text-[15px] font-bold text-ink truncate">{item.brand}</p>
                    <ChevronRight className="w-4 h-4 text-ink-3 group-hover:text-ink transition-colors flex-shrink-0" />
                </Link>
            ))}
        </div>
    )
}

/**
 * Linki do innych profili tej samej spółki i tego samego właściciela. Renderowane
 * po stronie serwera (dane przychodzą z page.tsx), więc linki są w wyjściowym HTML.
 */
export default function CompanyFamily({ brandName, sameCompany, sameOwner, ownerName }: CompanyFamilyProps) {
    if (sameCompany.length === 0 && sameOwner.length === 0) return null

    return (
        <section className="space-y-8">
            {sameCompany.length > 0 && (
                <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-ink">
                        Inne marki z tej samej spółki co {brandName}
                    </h2>
                    <p className="text-[15px] text-ink-2 mt-1 mb-3.5">
                        Te marki należą do tej samej spółki, więc mają tego samego właściciela.
                    </p>
                    <FamilyGrid items={sameCompany} />
                </div>
            )}

            {sameOwner.length > 0 && ownerName && (
                <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-ink">
                        Inne firmy, których właścicielem jest {ownerName}
                    </h2>
                    <p className="text-[15px] text-ink-2 mt-1 mb-3.5">
                        Osobne spółki z tym samym ostatecznym właścicielem.
                    </p>
                    <FamilyGrid items={sameOwner} />
                </div>
            )}
        </section>
    )
}
