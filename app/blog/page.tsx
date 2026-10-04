import { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, Clock, ArrowRight, Newspaper } from "lucide-react"
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-3">
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
      <span className="text-xs text-ink-3">
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
    <main className="min-h-screen bg-background pt-10 pb-16 sm:pt-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 sm:mb-12 max-w-2xl">
          <h1 className="text-[34px] sm:text-[46px] font-extrabold text-ink tracking-[-0.03em] leading-[1.08] mb-3">
            Blog CzyPolskaFirma
          </h1>
          <p className="text-[17px] sm:text-lg text-ink-2">
            Przejęcia, pochodzenie kapitału znanych marek i sukcesy polskiego biznesu —
            opisane na twardych danych z naszej bazy firm.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-warm rounded-[24px] p-10 text-center max-w-3xl mx-auto">
            <Newspaper className="w-10 h-10 text-ink-3 mx-auto mb-4" />
            <p className="text-ink-2">Pierwsze wpisy już wkrótce.</p>
          </div>
        ) : (
          <>
            {/* Wyróżniony najnowszy wpis */}
            <article className="bg-card rounded-[24px] border-[1.5px] border-line hover:border-ink transition-colors overflow-hidden mb-4">
              <Link href={`/blog/${featured.slug}`} className="block group">
                {featured.image && (
                  <img
                    src={featured.image}
                    alt={featured.imageAlt || featured.title}
                    loading="lazy"
                    className="w-full aspect-[1200/630] object-cover bg-warm"
                  />
                )}
                <div className="p-6 sm:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center h-7 px-3 rounded-full bg-warm text-ink text-xs font-extrabold uppercase tracking-[0.06em]">
                    Najnowszy
                  </span>
                  <PostMeta post={featured} />
                </div>
                <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-tight text-ink mb-3 leading-tight group-hover:underline underline-offset-4 decoration-2">
                  {featured.title}
                </h2>
                {featured.description && (
                  <p className="text-ink-2 leading-relaxed text-base mb-6 max-w-2xl">
                    {featured.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CompanyLogos companies={companiesFor(featured)} />
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink">
                    Czytaj dalej
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                </div>
              </Link>
            </article>

            {/* Pozostałe wpisy */}
            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {rest.map((post) => (
                  <article
                    key={post.slug}
                    className="bg-card rounded-[20px] border-[1.5px] border-line hover:border-ink transition-colors overflow-hidden"
                  >
                    <Link href={`/blog/${post.slug}`} className="flex flex-col h-full group">
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.imageAlt || post.title}
                          loading="lazy"
                          className="w-full aspect-[1200/630] object-cover bg-warm"
                        />
                      )}
                      <div className="flex flex-col flex-1 p-5 sm:p-6">
                      <PostMeta post={post} />
                      <h2 className="text-lg sm:text-xl font-bold text-ink mt-2.5 mb-2 leading-snug group-hover:underline underline-offset-4">
                        {post.title}
                      </h2>
                      {post.description && (
                        <p className="text-ink-2 leading-relaxed text-sm mb-5">
                          {post.description}
                        </p>
                      )}
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                        <CompanyLogos companies={companiesFor(post)} />
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink ml-auto">
                          Czytaj
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
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
