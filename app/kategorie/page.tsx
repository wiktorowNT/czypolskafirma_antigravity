import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getCategoryIcon } from "@/components/category-icon"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAllCategoriesFromSupabase } from "@/lib/supabase/category-cache"
import { serializeJsonLd } from "@/lib/json-ld"

export const revalidate = 3600 // ISR: odśwież co godzinę

const BASE_URL = "https://czypolskafirma.pl"

export const metadata: Metadata = {
  // Sufiks "| CzyPolskaFirma.pl" dodaje title.template z layoutu.
  title: "Kategorie firm — przeglądaj branże i pochodzenie kapitału",
  description:
    "Przeglądaj wszystkie kategorie firm w serwisie CzyPolskaFirma. Wybierz branżę i sprawdź, które marki mają polski kapitał, a które należą do zagranicznych właścicieli.",
  alternates: {
    canonical: `${BASE_URL}/kategorie`,
  },
  openGraph: {
    title: "Kategorie firm — CzyPolskaFirma.pl",
    description:
      "Przeglądaj wszystkie kategorie firm i sprawdź pochodzenie kapitału marek w każdej branży.",
    type: "website",
    url: `${BASE_URL}/kategorie`,
    locale: "pl_PL",
    siteName: "CzyPolskaFirma",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kategorie firm — CzyPolskaFirma.pl",
    description:
      "Przeglądaj wszystkie kategorie firm i sprawdź pochodzenie kapitału marek w każdej branży.",
  },
}

interface CategoryEntry {
  slug: string
  name: string
  icon: string | null
  count: number | null
}

// Ikona Lucide po nazwie (spójne z components/category-tabs.tsx); fallback: Tag.
const getIconComponent = (iconName: string | null) => getCategoryIcon(iconName)

// Liczba firm per category_id — jedno lekkie zapytanie; przy błędzie pomijamy liczby.
async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.from("companies").select("category_id").limit(20000)
    if (error || !data) return {}
    const counts: Record<string, number> = {}
    for (const row of data as { category_id: string | null }[]) {
      if (row.category_id) counts[row.category_id] = (counts[row.category_id] || 0) + 1
    }
    return counts
  } catch {
    return {}
  }
}

async function getCategories(): Promise<CategoryEntry[]> {
  // getAllCategoriesFromSupabase zwraca mapę slug -> { name, slug, icon } (bez id),
  // więc liczby dołączamy osobnym zapytaniem po id kategorii.
  const supabase = await getSupabaseServerClient()
  const [{ data: catRows }, counts] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon").order("name", { ascending: true }),
    getCategoryCounts(),
  ])

  if (!catRows) {
    // Fallback na cache'owaną mapę (bez liczb), gdyby zapytanie z id zawiodło.
    const map = await getAllCategoriesFromSupabase()
    return Object.values(map).map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, count: null }))
  }

  return (catRows as { id: string; name: string; slug: string; icon: string | null }[]).map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    count: Object.keys(counts).length ? counts[c.id] || 0 : null,
  }))
}

export default async function KategoriePage() {
  const categories = await getCategories()

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Kategorie firm",
        description:
          "Wszystkie kategorie firm w serwisie CzyPolskaFirma wraz z informacją o pochodzeniu kapitału marek.",
        url: `${BASE_URL}/kategorie`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Kategorie", item: `${BASE_URL}/kategorie` },
        ],
      },
      {
        "@type": "ItemList",
        name: "Kategorie firm",
        itemListElement: categories.map((c, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: c.name,
          url: `${BASE_URL}/kategoria/${encodeURIComponent(c.slug)}`,
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-slate-500">
            <li>
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Strona główna
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4" />
            </li>
            <li>
              <span className="text-slate-900 font-medium">Kategorie</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Kategorie firm</h1>
          <p className="text-slate-500 text-sm">
            Wybierz branżę i sprawdź, które marki mają polski kapitał, a które należą do zagranicznych właścicieli.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="text-slate-500">Brak kategorii do wyświetlenia.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon)
              return (
                <Link
                  key={category.slug}
                  href={`/kategoria/${encodeURIComponent(category.slug)}`}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-red-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 transition-colors group-hover:bg-red-50 group-hover:text-red-600">
                    <IconComponent className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                      {category.name}
                    </span>
                    {category.count != null && (
                      <span className="block text-sm text-slate-500">
                        {category.count} {category.count === 1 ? "firma" : "firm"}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
