import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Building2, Search } from "lucide-react"
import { getAllPosts, getPostBySlug } from "@/lib/blog"
import { getCompaniesBySlugs } from "@/lib/blog-companies"
import { serializeJsonLd } from "@/lib/json-ld"
import { CompanyCard } from "@/components/CompanyCard"
import { BlogShare } from "@/components/blog-share"

const BASE_URL = "https://czypolskafirma.pl"

// ISR: odśwież dane firm (sekcja "Firmy z tego wpisu") co godzinę.
export const revalidate = 3600

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

  const url = `${BASE_URL}/blog/${post.slug}`
  const relatedCompanies = await getCompaniesBySlugs(post.relatedCompanies)
  const otherPosts = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2)

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: "pl-PL",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
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

        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-1.5 bg-red-600" />
          <div className="p-6 sm:p-10">
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mb-5">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readingTimeMinutes} min czytania
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight [font-family:var(--font-playfair)]">
                {post.title}
              </h1>
            </header>

            <div
              className="text-slate-600 leading-relaxed text-sm sm:text-base
                [&>p:first-of-type]:text-base [&>p:first-of-type]:sm:text-lg [&>p:first-of-type]:text-slate-700 [&>p:first-of-type]:leading-relaxed
                [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:[font-family:var(--font-playfair)]
                [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:[font-family:var(--font-playfair)]
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

            {/* Udostępnianie */}
            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">Podziel się wpisem:</span>
              <BlogShare url={url} title={post.title} />
            </div>
          </div>
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

        {/* Czytaj też */}
        {otherPosts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Czytaj też</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {otherPosts.map((other) => (
                <article
                  key={other.slug}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <Link href={`/blog/${other.slug}`} className="flex flex-col h-full p-6 group">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mb-3">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        <time dateTime={other.date}>{formatDate(other.date)}</time>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {other.readingTimeMinutes} min
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-red-600 transition-colors [font-family:var(--font-playfair)]">
                      {other.title}
                    </h3>
                    <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                      Czytaj
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-10 bg-[#020617] rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 [font-family:var(--font-playfair)]">
            Sprawdź, czy Twoja marka jest polska
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Werdykt, ostateczny właściciel i struktura kapitału — dla setek zweryfikowanych
            firm działających w Polsce. Twoje pieniądze mają moc.
          </p>
          <Link
            href="/szukaj"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Przeszukaj bazę firm
          </Link>
        </section>

      </div>
    </main>
  )
}
