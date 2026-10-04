import Link from "next/link"
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
    <section className="bg-warm py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 mb-6">
          <div>
            <h2 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-ink">Z bloga</h2>
            <p className="text-[15px] text-ink-2 mt-1">
              Przejęcia, pochodzenie kapitału i sukcesy polskiego biznesu — na twardych danych
            </p>
          </div>
          <Link href="/blog" className="text-sm font-bold text-brand-ink hover:underline underline-offset-4 whitespace-nowrap">
            Zobacz wszystkie wpisy →
          </Link>
        </div>

        <div className="grid gap-3.5 md:grid-cols-3">
          {posts.map((post) => (
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
                <div className="flex flex-col flex-1 p-4 sm:p-5">
                  <p className="text-[12.5px] font-bold text-ink-3 mb-2 tabular-nums">
                    <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingTimeMinutes} min
                  </p>
                  <h3 className="text-[17px] font-bold text-ink leading-snug group-hover:underline underline-offset-4">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-[14.5px] text-ink-2 leading-relaxed line-clamp-3 mt-2">{post.description}</p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
