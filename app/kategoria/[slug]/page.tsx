import { Metadata } from "next"
import { notFound } from "next/navigation"
import CategoryPageView from "@/components/category-page-view"
import { getCachedCategoryData } from "@/lib/supabase/category-cache"

export const revalidate = 3600 // ISR: revalidate every hour

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params
  const data = await getCachedCategoryData(slug)

  if (!data.categoryName) {
    return {
      title: "Kategoria nie znaleziona | CzyPolskaFirma",
    }
  }

  const title = `Polskie marki: ${data.categoryName} - lista firm i kapitał | CzyPolskaFirma`
  const description = `Sprawdź, które firmy z kategorii ${data.categoryName} mają polski kapitał. Zobacz zestawienie polskich marek i alternatyw dla zagranicznych koncernów w branży ${data.categoryName}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://czypolskafirma.pl/kategoria/${slug}`,
    },
    alternates: {
      canonical: `https://czypolskafirma.pl/kategoria/${slug}`,
    },
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const data = await getCachedCategoryData(slug)

  if (!data.categoryName) {
    notFound()
  }

  const category = {
    slug: data.categorySlug,
    name: data.categoryName,
    short: data.categoryShort || `Zestawienie firm w kategorii ${data.categoryName}`,
    items: data.companies,
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Polskie firmy w kategorii ${data.categoryName}`,
    "description": `Lista firm i marek z kategorii ${data.categoryName} wraz z informacją o pochodzeniu kapitału.`,
    "itemListElement": data.companies.map((company: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://czypolskafirma.pl/firma/${company.slug || company.id}`,
      "name": company.brand || company.company
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPageView category={category} />
    </>
  )
}