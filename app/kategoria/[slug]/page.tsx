import { Metadata } from "next"
import { notFound } from "next/navigation"
import CategoryPageView, { type InnaKategoria } from "@/components/category-page-view"
import { KategoriaNaBlogu, InneKategorieLinki, type WpisKategorii } from "@/components/category-extras"
import { getCachedCategoryData, getAllCategoriesFromSupabase } from "@/lib/supabase/category-cache"
import { serializeJsonLd } from "@/lib/json-ld"
import { getAllPosts } from "@/lib/blog"
import { ADRES_SERWISU, OBRAZEK_OG } from "@/lib/meta-strony"

/** „1 firma”, „3 firmy”, „5 firm”, „22 firmy”, „112 firm”. */
function liczbaFirm(n: number): string {
  const r10 = n % 10
  const r100 = n % 100
  if (n === 1) return "1 firma"
  if (r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14)) return `${n} firmy`
  return `${n} firm`
}

/** Pierwsza litera wielka, bez psucia skrótów („AGD”). */
function zWielkiej(tekst: string): string {
  return tekst.charAt(0).toLocaleUpperCase("pl") + tekst.slice(1)
}

const MAKS_WPISOW = 6

/**
 * Wpisy z bloga, których `relatedCompanies` przecina się z firmami kategorii. Czyta pliki
 * content/blog (lib/blog.ts) raz na render strony, bez zapytania do bazy. Kolejność: najpierw
 * wpisy o większej liczbie firm z kategorii, potem nowsze (getAllPosts zwraca od najnowszego).
 */
function wpisyOFirmachKategorii(firmy: { slug?: string | null; brand: string }[]): WpisKategorii[] {
  const markaPoSlugu = new Map<string, string>()
  for (const firma of firmy) {
    if (firma.slug) markaPoSlugu.set(firma.slug, firma.brand)
  }
  if (markaPoSlugu.size === 0) return []

  return getAllPosts()
    .map((post) => ({
      post,
      marki: post.relatedCompanies
        .filter((slug) => markaPoSlugu.has(slug))
        .map((slug) => markaPoSlugu.get(slug)!)
        .filter((marka, i, wszystkie) => marka && wszystkie.indexOf(marka) === i),
    }))
    .filter(({ marki }) => marki.length > 0)
    .sort((a, b) => b.marki.length - a.marki.length) // sort stabilny: przy remisie zostaje kolejność dat
    .slice(0, MAKS_WPISOW)
    .map(({ post, marki }) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      description: post.description,
      marki: marki.slice(0, 4),
    }))
}

export const revalidate = 86400 // ISR: doba, jak profile firm i /companies (deploy i tak czyści cache)

// Bez generateStaticParams trasa była dynamiczna (ƒ w tabeli builda): każde wejście to pełny
// render na Vercelu z `Cache-Control: no-store`, a `revalidate` było ignorowane.
// W przeciwieństwie do profili (1555, pusta lista) kategorii jest 27 i to one zbierają ruch
// z Google, więc prerenderujemy wszystkie w buildzie: pierwsze wejście po deployu nie czeka
// na render. Kategoria dodana w bazie po buildzie wyrenderuje się przy pierwszym wejściu
// (dynamicParams zostaje domyślne), a nieznany slug kończy się 404 jak dotąd.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const kategorie = await getAllCategoriesFromSupabase()
  return Object.keys(kategorie).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getCachedCategoryData(slug)

  if (!data.categoryName) {
    return {
      title: "Kategoria nie znaleziona",
      robots: { index: false, follow: false },
    }
  }

  // Sufiks "| CzyPolskaFirma.pl" dodaje title.template z layoutu — bez ręcznego dopisywania.
  const title = `Polskie marki: ${data.categoryName} - lista firm i kapitał`
  // Liczby z tych samych danych co lista (getCachedCategoryData łączy wywołanie ze stroną).
  const wszystkich = data.companies.length
  const polskich = data.companies.filter((firma: { country_code?: string | null }) => firma.country_code === "PL").length
  const description = `${zWielkiej(data.categoryName)}: ${liczbaFirm(wszystkich)} w bazie, ${polskich > 0 ? `w tym ${polskich} z polskim kapitałem` : "żadna z polskim kapitałem"}. Sprawdź, kto jest właścicielem marek z tej kategorii i które należą do zagranicznych grup.`
  const canonicalUrl = `${ADRES_SERWISU}/kategoria/${encodeURIComponent(data.categorySlug)}`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | CzyPolskaFirma.pl`,
      description,
      type: "website",
      url: canonicalUrl,
      locale: "pl_PL",
      siteName: "CzyPolskaFirma",
      // Własny openGraph podmienia cały obiekt z layoutu, razem z obrazkiem: trzeba go podać.
      images: [OBRAZEK_OG],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CzyPolskaFirma.pl`,
      description,
      creator: "@CzyPolskaFirma",
      images: [OBRAZEK_OG.url],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getCachedCategoryData(slug)

  if (!data.categoryName) {
    notFound()
  }

  // Jedno małe zapytanie (27 wierszy) raz na regenerację ISR; wcześniej każda wizyta pytała
  // /api/categories z przeglądarki, a linków nie było w HTML-u.
  const wszystkieKategorie = await getAllCategoriesFromSupabase()
  const inneKategorie: InnaKategoria[] = Object.values(wszystkieKategorie)
    .filter((kat) => kat.slug !== data.categorySlug)
    .map((kat) => ({ slug: kat.slug, name: kat.name, icon: kat.icon }))

  const wpisy = wpisyOFirmachKategorii(data.companies)
  const kategoriaUrl = `${ADRES_SERWISU}/kategoria/${encodeURIComponent(data.categorySlug)}`

  const category = {
    slug: data.categorySlug,
    name: data.categoryName,
    short: data.categoryShort || `Zestawienie firm w kategorii ${data.categoryName}`,
    items: data.companies,
  }

  const itemList = {
    "@type": "ItemList",
    "name": `Firmy w kategorii ${data.categoryName}`,
    "description": `Lista firm i marek z kategorii ${data.categoryName} wraz z informacją o pochodzeniu kapitału.`,
    "itemListElement": data.companies.map((company: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      // company.slug jest już kanoniczny (slugify w lib/supabase/category-cache.ts)
      "url": `https://czypolskafirma.pl/firma/${company.slug || company.id}`,
      "name": company.brand || company.company
    }))
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      itemList,
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Start", "item": ADRES_SERWISU },
          { "@type": "ListItem", "position": 2, "name": "Kategorie", "item": `${ADRES_SERWISU}/kategorie` },
          { "@type": "ListItem", "position": 3, "name": data.categoryName, "item": kategoriaUrl },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <CategoryPageView
        category={category}
        inneKategorie={inneKategorie}
        ponizejListy={
          <>
            <KategoriaNaBlogu wpisy={wpisy} nazwaKategorii={data.categoryName} />
            <InneKategorieLinki kategorie={inneKategorie} />
          </>
        }
      />
    </>
  )
}