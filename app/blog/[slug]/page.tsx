import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, Building2 } from "lucide-react"
import { getAllPosts, getPostBySlug } from "@/lib/blog"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import { serializeJsonLd } from "@/lib/json-ld"
import { CompanyCard } from "@/components/CompanyCard"

const BASE_URL = "https://czypolskafirma.pl"

// ISR: odśwież dane firm (sekcja "Firmy z tego wpisu") co godzinę.
export const revalidate = 3600

interface RelatedCompany {
  id: string
  slug: string
  brand: string
  website_url?: string
  country_code?: string
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug)
  if (!post) {
    return { title: "Wpis nie znaleziony" }
  }

  const url = `${BASE_URL}/blog/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      locale: "pl_PL",
      siteName: "CzyPolskaFirma",
      publishedTime: post.date,
    },
  }
}

async function getRelatedCompanies(companySlugs: string[]): Promise<RelatedCompany[]> {
  if (companySlugs.length === 0) return []
  try {
    const supabase = await getSupabaseServerClient()
    // Slugi w bazie bywają "surowe" (spacje, nawiasy), więc dopasowujemy
    // po kanonicznym slugify() — tak samo jak profil /firma/[slug].
    const { data, error } = await supabase
      .from("companies")
      .select("id, slug, name, display_name, website_url, country_code")

    if (error || !data) return []

    const wanted = new Map(companySlugs.map((s, index) => [s, index]))
    return data
      .filter((c: any) => c.slug && wanted.has(slugify(c.slug)))
      .map((c: any) => ({
        id: c.id,
        slug: slugify(c.slug) || c.id,
        brand: resolveDisplayName(c.display_name, c.slug, c.name),
        website_url: c.website_url || undefined,
        country_code: c.country_code || undefined,
      }))
      .sort((a, b) => (wanted.get(a.slug) ?? 0) - (wanted.get(b.slug) ?? 0))
  } catch (err) {
    console.error("[blog] Błąd pobierania firm z wpisu:", err)
    return []
  }
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const relatedCompanies = await getRelatedCompanies(post.relatedCompanies)

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: "pl-PL",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${post.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "CzyPolskaFirma",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "CzyPolskaFirma",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Wszystkie wpisy
        </Link>

        <article className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <CalendarDays className="w-4 h-4" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {post.title}
            </h1>
          </header>

          <div
            className="text-slate-600 leading-relaxed text-sm sm:text-base
              [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-4
              [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-8 [&_h3]:mb-3
              [&_h4]:text-base [&_h4]:sm:text-lg [&_h4]:font-semibold [&_h4]:text-slate-900 [&_h4]:mt-6 [&_h4]:mb-2
              [&_p]:mb-4 [&_p:last-child]:mb-0
              [&_a]:text-red-600 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-red-700
              [&_strong]:text-slate-900
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
              [&_blockquote]:border-l-4 [&_blockquote]:border-red-200 [&_blockquote]:bg-slate-50 [&_blockquote]:rounded-r-lg [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:text-slate-700 [&_blockquote_p]:mb-0
              [&_hr]:my-8 [&_hr]:border-slate-200
              [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]
              [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>

        {/* Firmy z tego wpisu */}
        {relatedCompanies.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Firmy z tego wpisu</h2>
            </div>
            <div className="space-y-3">
              {relatedCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  slug={company.slug}
                  brand={company.brand}
                  websiteUrl={company.website_url}
                  countryCode={company.country_code}
                  isPolish={company.country_code?.toUpperCase() === "PL"}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
