import Link from "next/link"
import { CalendarDays, Clock, ArrowRight } from "lucide-react"
import { getAllPosts } from "@/lib/blog"

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Sekcja "Z bloga" na stronie głównej: 3 najnowsze wpisy.
 * Server component — czyta pliki content/blog/ przy renderze (ISR strony głównej).
 */
export function HomeBlogSection() {
  const posts = getAllPosts().slice(0, 3)
  if (posts.length === 0) return null

  return (
    <section className="py-20 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 [font-family:var(--font-playfair)]">
            Z bloga
          </h2>
          <p className="text-lg text-slate-600">
            Przejęcia, pochodzenie kapitału i sukcesy polskiego biznesu — na twardych danych
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
            >
              <Link href={`/blog/${post.slug}`} className="flex flex-col h-full group">
                {post.image && (
                  <img
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    loading="lazy"
                    className="w-full aspect-video object-cover border-b border-slate-200"
                  />
                )}
                <div className="flex flex-col flex-1 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2.5">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingTimeMinutes} min
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-red-600 transition-colors [font-family:var(--font-playfair)]">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{post.description}</p>
                  )}
                  <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                    Czytaj
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors"
          >
            Zobacz wszystkie wpisy
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
