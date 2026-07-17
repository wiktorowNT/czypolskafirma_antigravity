import { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, Clock, ArrowRight, Newspaper, Sparkles } from "lucide-react"
import { getAllPosts, type BlogPostMeta } from "@/lib/blog"
import { getCompaniesBySlugs, type BlogCompany } from "@/lib/blog-companies"
import { CompanyLogo } from "@/components/company-logo"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artykuły o polskiej gospodarce: przejęcia firm, pochodzenie kapitału znanych marek, sukcesy polskiego biznesu i praktyczne poradniki świadomego konsumenta.",
  alternates: {
    canonical: "https://czypolskafirma.pl/blog",
  },
}

// ISR: odśwież logotypy/dane firm na kartach co godzinę.
export const revalidate = 3600

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function PostMeta({ post }: { post: BlogPostMeta }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
      <span className="flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4" />
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="w-4 h-4" />
        {post.readingTimeMinutes} min czytania
      </span>
    </div>
  )
}

function CompanyLogos({ companies }: { companies: BlogCompany[] }) {
  if (companies.length === 0) return null
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {companies.slice(0, 3).map((company) => (
          <div key={company.id} className="rounded-full ring-2 ring-white">
            <CompanyLogo
              websiteUrl={company.website_url}
              name={company.brand}
              size={30}
              className="rounded-full"
            />
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-500">
        {companies
          .slice(0, 3)
          .map((c) => c.brand)
          .join(" · ")}
      </span>
    </div>
  )
}

export default async function BlogPage() {
  const posts = getAllPosts()

  const allCompanySlugs = Array.from(new Set(posts.flatMap((p) => p.relatedCompanies)))
  const companies = await getCompaniesBySlugs(allCompanySlugs)
  const companyBySlug = new Map(companies.map((c) => [c.slug, c]))
  const companiesFor = (post: BlogPostMeta): BlogCompany[] =>
    post.relatedCompanies
      .map((slug) => companyBySlug.get(slug))
      .filter((c): c is BlogCompany => Boolean(c))

  const [featured, ...rest] = posts

  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 [font-family:var(--font-playfair)]">
            Blog CzyPolskaFirma
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Przejęcia, pochodzenie kapitału znanych marek i sukcesy polskiego biznesu —
            opisane na twardych danych z naszej bazy firm.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 text-center max-w-3xl mx-auto">
            <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Pierwsze wpisy już wkrótce.</p>
          </div>
        ) : (
          <>
            {/* Wyróżniony najnowszy wpis */}
            <article className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden mb-8">
              <div className="h-1.5 bg-red-600" />
              <Link href={`/blog/${featured.slug}`} className="block p-6 sm:p-10 group">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wide">
                    <Sparkles className="w-3 h-3" />
                    Najnowszy
                  </span>
                  <PostMeta post={featured} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-red-600 transition-colors [font-family:var(--font-playfair)]">
                  {featured.title}
                </h2>
                {featured.description && (
                  <p className="text-slate-600 leading-relaxed text-base mb-6 max-w-2xl">
                    {featured.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CompanyLogos companies={companiesFor(featured)} />
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600">
                    Czytaj dalej
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </article>

            {/* Pozostałe wpisy */}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {rest.map((post) => (
                  <article
                    key={post.slug}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    <Link href={`/blog/${post.slug}`} className="flex flex-col h-full p-6 sm:p-8 group">
                      <PostMeta post={post} />
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-3 mb-3 leading-snug group-hover:text-red-600 transition-colors [font-family:var(--font-playfair)]">
                        {post.title}
                      </h2>
                      {post.description && (
                        <p className="text-slate-600 leading-relaxed text-sm mb-5">
                          {post.description}
                        </p>
                      )}
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                        <CompanyLogos companies={companiesFor(post)} />
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 ml-auto">
                          Czytaj
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}
