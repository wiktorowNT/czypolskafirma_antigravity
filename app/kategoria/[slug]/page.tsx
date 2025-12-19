import { notFound } from "next/navigation"
import CategoryPageView from "@/components/category-page-view"
import { getCachedCategoryData } from "@/lib/supabase/category-cache"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  const data = await getCachedCategoryData(slug)

  if (!data.categoryName) {
    notFound()
  }

  const category = {
    slug: data.categorySlug,
    name: data.categoryName,
    short: data.categoryShort || `Lista firm w kategorii ${data.categoryName}`,
    items: data.companies,
  }

  return <CategoryPageView category={category} />
}