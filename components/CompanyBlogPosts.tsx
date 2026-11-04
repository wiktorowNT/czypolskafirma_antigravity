import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"

interface CompanyBlogPost {
    slug: string
    title: string
    date: string
    description: string
}

interface CompanyBlogPostsProps {
    posts: CompanyBlogPost[]
}

function formatDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

/**
 * Wpisy blogowe, które piszą o tej firmie (odwrotność sekcji „Firmy z tego wpisu”).
 * Lista przychodzi z serwera (lib/blog.ts), więc linki są w wyjściowym HTML.
 */
export default function CompanyBlogPosts({ posts }: CompanyBlogPostsProps) {
    if (posts.length === 0) return null

    return (
        <section>
            <h2 className="text-xl font-extrabold tracking-tight text-ink mb-3.5">Więcej o tej firmie na blogu</h2>
            <div className="grid gap-2.5">
                {posts.map((post) => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group block rounded-2xl border-[1.5px] border-line px-4 py-3.5 hover:border-ink transition-colors"
                    >
                        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <time dateTime={post.date}>{formatDate(post.date)}</time>
                        </span>
                        <p className="mt-1 text-[15.5px] font-bold text-ink leading-snug group-hover:underline underline-offset-4">
                            {post.title}
                        </p>
                        {post.description && (
                            <p className="mt-1 text-[14px] text-ink-2 leading-relaxed line-clamp-2">{post.description}</p>
                        )}
                        <span className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-bold text-brand-ink">
                            Czytaj wpis
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    )
}
