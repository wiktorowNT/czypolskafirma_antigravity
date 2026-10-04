"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

/**
 * =============================================
 * COMPANY LOGO COMPONENT
 * =============================================
 *
 * Logo są przechowywane lokalnie w /public/logos/{domena}.{ext}
 * Pobrane automatycznie skryptem tools/fetch-logos.mjs
 *
 * Fallback chain:
 *   1. Lokalne logo: /logos/{domena}.png (lub .svg, .jpg, .webp)
 *   2. Brandfetch CDN: https://cdn.brandfetch.io/domain/{domena}
 *   3. Letter avatar (pierwsza litera nazwy firmy)
 *
 * Aby dodać/zaktualizować logo:
 *   - Wrzuć plik {domena}.png do /public/logos/
 *   - Lub uruchom: node tools/fetch-logos.mjs --domain={domena}
 * =============================================
 */

interface CompanyLogoProps {
  websiteUrl?: string | null
  logoUrl?: string | null // Static logo URL (legacy support)
  name: string
  size?: number
  className?: string
  priority?: boolean
}

// Extract domain from URL
function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(urlWithProtocol)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Awatar z inicjałem: jeden spokojny kolor dla wszystkich firm (system „Półka”),
// zamiast losowych par kolorów, które nic nie znaczyły.
function getAvatarColor(_name: string): { bg: string; text: string } {
  return { bg: "var(--warm)", text: "var(--ink-2)" }
}

// Brandfetch CDN client ID (public — designed for use in <img> tags)
const BRANDFETCH_CLIENT_ID = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID || '1idDBakJbZwIqqTCivg'

/**
 * Build local logo URL candidates for a domain.
 * All logos are standardized to .png (with a few legacy .svg files).
 */
function getLocalLogoCandidates(domain: string): string[] {
  return [
    `/logos/${domain}.png`,
    `/logos/${domain}.svg`,
    `/logos/${domain}.jpg`,
    `/logos/${domain}.jpeg`,
    `/logos/${domain}.webp`,
  ]
}

/**
 * Build Brandfetch CDN URL for a domain.
 * Used as fallback when local logo is missing.
 */
function getBrandfetchCdnUrl(domain: string): string {
  return `https://cdn.brandfetch.io/domain/${domain}?c=${BRANDFETCH_CLIENT_ID}`
}

export function CompanyLogo({
  websiteUrl,
  logoUrl,
  name,
  size = 48,
  className,
  priority = false,
}: CompanyLogoProps) {
  const domain = getDomainFromUrl(websiteUrl)

  // Build ordered list of URLs to try
  const urlCandidates = useMemo(() => {
    const candidates: string[] = []

    // Priority 1: Local logo files (multiple extensions)
    if (domain) {
      candidates.push(...getLocalLogoCandidates(domain))
    }

    // Priority 2: Legacy static logo URL
    if (logoUrl) {
      candidates.push(logoUrl)
    }

    // Priority 3: Brandfetch CDN (runtime fallback for missing local logos)
    if (domain) {
      candidates.push(getBrandfetchCdnUrl(domain))
    }

    return candidates
  }, [domain, logoUrl])

  const [candidateIndex, setCandidateIndex] = useState(0)
  const [imageLoading, setImageLoading] = useState(true)
  const [showFallback, setShowFallback] = useState(urlCandidates.length === 0)

  // Reset when props change
  useEffect(() => {
    setCandidateIndex(0)
    setImageLoading(true)
    setShowFallback(urlCandidates.length === 0)
  }, [websiteUrl, logoUrl, urlCandidates.length])

  const currentUrl = candidateIndex < urlCandidates.length ? urlCandidates[candidateIndex] : null

  const handleLogoError = () => {
    const nextIndex = candidateIndex + 1
    if (nextIndex < urlCandidates.length) {
      // Try next candidate
      setCandidateIndex(nextIndex)
      setImageLoading(true)
    } else {
      // All candidates failed - show letter avatar
      setShowFallback(true)
      setImageLoading(false)
    }
  }

  const handleLogoLoad = () => {
    setImageLoading(false)
    setShowFallback(false)
  }

  const theme = getAvatarColor(name)
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden flex-shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: size >= 40 ? 16 : 12,
        backgroundColor: showFallback ? theme.bg : '#ffffff',
        border: '1px solid var(--line)',
      }}
    >
      {showFallback ? (
        // Letter Avatar Fallback
        <span
          className="font-extrabold select-none"
          style={{
            color: theme.text,
            fontSize: size * 0.45,
          }}
          aria-hidden="true"
        >
          {initial}
        </span>
      ) : (
        <>
          {/* Loading skeleton */}
          {imageLoading && (
            <div
              className="absolute inset-0 bg-warm animate-pulse"
              style={{ borderRadius: size >= 40 ? 16 : 12 }}
            />
          )}

          {/* Logo image */}
          {currentUrl && (
            <img
              src={currentUrl}
              alt={`Logo ${name}`}
              className="object-contain p-0.5"
              style={{
                width: size - 4,
                height: size - 4,
              }}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              onLoad={handleLogoLoad}
              onError={handleLogoError}
            />
          )}
        </>
      )}
    </div>
  )
}

// Alternative export for avatar-only use cases
export function CompanyAvatar({
  name,
  size = 40,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <CompanyLogo
      name={name}
      size={size}
      className={className}
    />
  )
}
