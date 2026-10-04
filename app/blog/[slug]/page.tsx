import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Search } from "lucide-react"
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
  const imageAlt = post.imageAlt || post.title
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
      ...(post.image ? { images: [{ url: post.image, alt: imageAlt }] } : {}),
    },
    ...(post.image
      ? {
          twitter: {
            card: "summary_large_image" as const,
            title: post.title,
            description: post.description,
            images: [post.image],
          },
        }
      : {}),
  }
}

/** Absolutny URL zdjęcia (ścieżki z public/ dostają domenę produkcyjną). */
function absoluteImageUrl(image: string): string {
  return image.startsWith("/") ? `${BASE_URL}${image}` : image
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
    ...(post.image ? { image: [absoluteImageUrl(post.image)] } : {}),
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
    <main className="min-h-screen bg-warm py-12 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Wszystkie wpisy
        </Link>

        <article className="bg-card rounded-[24px] border-[1.5px] border-line overflow-hidden">
          {post.image && (
            <img
              src={post.image}
              alt={post.imageAlt || post.title}
              className="w-full aspect-[1200/630] object-cover bg-warm"
            />
          )}
          <div className="p-6 sm:p-10">
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-3 mb-5">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readingTimeMinutes} min czytania
                </span>
              </div>
              <h1 className="text-[30px] sm:text-[40px] font-extrabold text-ink tracking-[-0.03em] leading-[1.1]">
                {post.title}
              </h1>
            </header>

            <div
              className="text-ink-2 leading-relaxed text-[15.5px] sm:text-[17px]
                [&>p:first-of-type]:text-[17px] [&>p:first-of-type]:sm:text-[19px] [&>p:first-of-type]:text-ink [&>p:first-of-type]:leading-relaxed
                [&_h2]:text-[22px] [&_h2]:sm:text-[26px] [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-ink [&_h2]:mt-10 [&_h2]:mb-4
                [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-8 [&_h3]:mb-3
                [&_h4]:text-base [&_h4]:sm:text-lg [&_h4]:font-semibold [&_h4]:text-ink [&_h4]:mt-6 [&_h4]:mb-2
                [&_p]:mb-4 [&_p:last-child]:mb-0
                [&_a]:text-brand-ink [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-ink
                [&_strong]:text-ink
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
                [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:bg-warm [&_blockquote]:rounded-r-2xl [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:text-ink-2 [&_blockquote_p]:mb-0
                [&_figure]:my-6 [&_figure_img]:w-full [&_figure_img]:rounded-2xl [&_figure_img]:border [&_figure_img]:border-line
                [&_figcaption]:text-xs [&_figcaption]:text-ink-3 [&_figcaption]:mt-2 [&_figcaption]:text-center
                [&_hr]:my-8 [&_hr]:border-line
                [&_code]:bg-warm [&_code]:text-ink [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]
                [&_pre]:bg-ink [&_pre]:text-white [&_pre]:rounded-2xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />

            {/* Udostępnianie */}
            <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-medium text-ink-3">Podziel się wpisem:</span>
              <BlogShare url={url} title={post.title} />
            </div>
          </div>
        </article>

        {/* Firmy z tego wpisu */}
        {relatedCompanies.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[22px] sm:text-2xl font-extrabold tracking-tight text-ink mb-4">Firmy z tego wpisu</h2>
            <div className="space-y-2.5">
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
            <h2 className="text-[22px] sm:text-2xl font-extrabold tracking-tight text-ink mb-4">Czytaj też</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {otherPosts.map((other) => (
                <article
                  key={other.slug}
                  className="bg-card rounded-[20px] border-[1.5px] border-line hover:border-ink transition-colors"
                >
                  <Link href={`/blog/${other.slug}`} className="flex flex-col h-full p-6 group">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-3 mb-3">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        <time dateTime={other.date}>{formatDate(other.date)}</time>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {other.readingTimeMinutes} min
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-ink leading-snug group-hover:underline underline-offset-4">
                      {other.title}
                    </h3>
                    <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink">
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
        <section className="mt-10 bg-panel rounded-[24px] p-7 sm:p-10">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-white mb-2">
            Sprawdź, czy Twoja marka jest polska
          </h2>
          <p className="text-[#d6d0c6] text-[15px] sm:text-base max-w-xl mb-6">
            Werdykt, ostateczny właściciel i struktura kapitału — dla setek zweryfikowanych
            firm działających w Polsce.
          </p>
          <Link
            href="/szukaj"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-brand hover:bg-[#d4452b] text-white font-bold transition-colors"
          >
            <Search className="w-4 h-4" />
            Przeszukaj bazę firm
          </Link>
        </section>

      </div>
    </main>
  )
}
