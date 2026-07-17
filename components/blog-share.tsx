"use client"

import { useState } from "react"
import { Facebook, Link2, Check } from "lucide-react"

interface BlogShareProps {
  url: string
  title: string
}

const buttonClass =
  "inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all"

export function BlogShare({ url, title }: BlogShareProps) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API niedostępne (np. http) — cicho ignorujemy.
    }
  }

  const shareOnX = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const shareOnFb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={shareOnX} target="_blank" rel="noopener noreferrer" className={buttonClass} aria-label="Udostępnij na X">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Udostępnij
      </a>
      <a href={shareOnFb} target="_blank" rel="noopener noreferrer" className={buttonClass} aria-label="Udostępnij na Facebooku">
        <Facebook className="h-4 w-4" />
        Facebook
      </a>
      <button onClick={copyLink} className={buttonClass} aria-label="Kopiuj link do wpisu">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Skopiowano" : "Kopiuj link"}
      </button>
    </div>
  )
}
