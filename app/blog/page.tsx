import { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, ArrowRight, Newspaper } from "lucide-react"
import { getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artykuły o polskiej gospodarce: przejęcia firm, pochodzenie kapitału znanych marek, sukcesy polskiego biznesu i praktyczne poradniki świadomego konsumenta.",
  alternates: {
    canonical: "https://czypolskafirma.pl/blog",
  },
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Blog CzyPolskaFirma
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Przejęcia, pochodzenie kapitału znanych marek i sukcesy polskiego biznesu —
            opisane na twardych danych z naszej bazy firm.
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 text-center">
            <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Pierwsze wpisy już wkrótce.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
              >
                <Link href={`/blog/${post.slug}`} className="block p-6 sm:p-8 group">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <CalendarDays className="w-4 h-4" />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 group-hover:text-red-600 transition-colors">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-4">
                      {post.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                    Czytaj dalej
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
