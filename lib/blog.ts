// Wczytywanie i parsowanie wpisów blogowych z content/blog/*.md.
// Wpisy mają frontmatter (title, slug, date, description, relatedCompanies)
// parsowany przez gray-matter, a treść renderowana lekkim rendererem
// markdown -> HTML (bez zewnętrznych zależności renderujących).
// Pliki zaczynające się od "_" (np. _szablon.md) są pomijane.

import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { slugify } from "@/lib/slug-utils"

const BLOG_DIR = path.join(process.cwd(), "content", "blog")

export interface BlogPostMeta {
  slug: string
  title: string
  /** Data publikacji w formacie ISO (RRRR-MM-DD). */
  date: string
  description: string
  /** Kanoniczne slugi firm z /firma/[slug] powiązanych z wpisem. */
  relatedCompanies: string[]
}

export interface BlogPost extends BlogPostMeta {
  /** Treść wpisu wyrenderowana do HTML. */
  html: string
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === "string") {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  }
  return ""
}

function parsePostFile(filePath: string): { meta: BlogPostMeta; content: string } | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(raw)

    const title = typeof data.title === "string" ? data.title.trim() : ""
    const date = toIsoDate(data.date)
    if (!title || !date) return null

    const fileSlug = path.basename(filePath).replace(/\.md$/i, "")
    const slug = slugify(typeof data.slug === "string" && data.slug.trim() ? data.slug : fileSlug)
    if (!slug) return null

    const relatedCompanies = Array.isArray(data.relatedCompanies)
      ? data.relatedCompanies
          .filter((s: unknown): s is string => typeof s === "string")
          .map((s: string) => slugify(s))
          .filter(Boolean)
      : []

    return {
      meta: {
        slug,
        title,
        date,
        description: typeof data.description === "string" ? data.description.trim() : "",
        relatedCompanies,
      },
      content,
    }
  } catch (err) {
    console.error(`[blog] Błąd parsowania pliku ${filePath}:`, err)
    return null
  }
}

function listPostFiles(): string[] {
  try {
    return fs
      .readdirSync(BLOG_DIR)
      .filter((f) => f.toLowerCase().endsWith(".md") && !f.startsWith("_"))
      .map((f) => path.join(BLOG_DIR, f))
  } catch {
    // Brak katalogu content/blog — traktujemy jak brak wpisów.
    return []
  }
}

/** Wszystkie opublikowane wpisy, posortowane od najnowszego. */
export function getAllPosts(): BlogPostMeta[] {
  const posts = listPostFiles()
    .map((file) => parsePostFile(file)?.meta)
    .filter((meta): meta is BlogPostMeta => Boolean(meta))

  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Pojedynczy wpis (metadane + wyrenderowany HTML) albo null, gdy nie istnieje. */
export function getPostBySlug(slug: string): BlogPost | null {
  const wanted = slugify(slug)
  if (!wanted) return null

  for (const file of listPostFiles()) {
    const parsed = parsePostFile(file)
    if (parsed && parsed.meta.slug === wanted) {
      return { ...parsed.meta, html: renderMarkdown(parsed.content) }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Lekki renderer markdown -> HTML.
// Obsługuje: nagłówki (##/###/####), akapity, listy (-/*/1.), cytaty (>),
// linie poziome (---), bloki kodu (```), pogrubienie, kursywę, kod inline
// i linki. Cała treść jest escapowana przed składaniem HTML.
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderInline(text: string): string {
  let out = escapeHtml(text)

  // Kod inline — najpierw, żeby nie formatować jego wnętrza.
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>")

  // Linki [tekst](url) — tylko http(s) i ścieżki względne.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
    if (/^https?:\/\//i.test(url)) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
    }
    if (url.startsWith("/") || url.startsWith("#")) {
      return `<a href="${url}">${label}</a>`
    }
    return match
  })

  // Pogrubienie i kursywa (pogrubienie najpierw, żeby ** nie łapało się na *).
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  return out
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const html: string[] = []

  let paragraph: string[] = []
  let listItems: string[] = []
  let listTag: "ul" | "ol" | null = null
  let inCodeBlock = false
  let codeLines: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(" "))}</p>`)
      paragraph = []
    }
  }
  const flushList = () => {
    if (listTag && listItems.length) {
      html.push(`<${listTag}>${listItems.map((li) => `<li>${li}</li>`).join("")}</${listTag}>`)
    }
    listItems = []
    listTag = null
  }

  for (const line of lines) {
    if (inCodeBlock) {
      if (line.trim().startsWith("```")) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`)
        codeLines = []
        inCodeBlock = false
      } else {
        codeLines.push(line)
      }
      continue
    }

    const trimmed = line.trim()

    if (trimmed.startsWith("```")) {
      flushParagraph()
      flushList()
      inCodeBlock = true
      continue
    }

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = trimmed.match(/^(#{2,4})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushParagraph()
      flushList()
      html.push("<hr />")
      continue
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph()
      flushList()
      html.push(`<blockquote><p>${renderInline(trimmed.slice(2))}</p></blockquote>`)
      continue
    }

    const unordered = trimmed.match(/^[-*]\s+(.*)$/)
    if (unordered) {
      flushParagraph()
      if (listTag !== "ul") flushList()
      listTag = "ul"
      listItems.push(renderInline(unordered[1]))
      continue
    }

    const ordered = trimmed.match(/^\d+\.\s+(.*)$/)
    if (ordered) {
      flushParagraph()
      if (listTag !== "ol") flushList()
      listTag = "ol"
      listItems.push(renderInline(ordered[1]))
      continue
    }

    paragraph.push(trimmed)
  }

  if (inCodeBlock && codeLines.length) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`)
  }
  flushParagraph()
  flushList()

  return html.join("\n")
}
