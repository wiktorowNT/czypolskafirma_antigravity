"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

/**
 * =============================================
 * LOCAL VIP LOGOS CONFIGURATION
 * =============================================
 * 
 * Aby dodać logo VIP:
 * 1. Wrzuć plik {domena}.svg do folderu /public/logos/
 * 2. Dodaj domenę do tablicy LOCAL_LOGOS poniżej
 * 
 * Przykład: Dla biedronka.pl -> /public/logos/biedronka.pl.svg
 * =============================================
 */
const LOCAL_LOGOS = new Set([
  'biedronka.pl',
  'mieszkaj.skanska.pl',
  'torpol.pl',
  'hochtief.pl',
  'gulermak.com',
  'ghelamco.com'
])

interface CompanyLogoProps {
  websiteUrl?: string | null
  logoUrl?: string | null // Static logo URL (legacy support)
  name: string
  size?: number
  className?: string
  priority?: boolean
}

// Extract domain from URL for external logo APIs
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

// Generate deterministic color from company name
function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: "#EFF6FF", text: "#2563EB" }, // Blue
    { bg: "#F0FDF4", text: "#16A34A" }, // Green
    { bg: "#FEF2F2", text: "#DC2626" }, // Red
    { bg: "#FFF7ED", text: "#EA580C" }, // Orange
    { bg: "#FAF5FF", text: "#9333EA" }, // Purple
    { bg: "#ECFEFF", text: "#0891B2" }, // Cyan
    { bg: "#FDF4FF", text: "#C026D3" }, // Fuchsia
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff
  }

  return colors[Math.abs(hash) % colors.length]
}

// Logo source types for fallback chain
type LogoSource = 'local' | 'static' | 'clearbit' | 'google' | 'fallback'

export function CompanyLogo({
  websiteUrl,
  logoUrl,
  name,
  size = 48,
  className,
  priority = false,
}: CompanyLogoProps) {
  const domain = getDomainFromUrl(websiteUrl)
  const isLocalLogo = domain ? LOCAL_LOGOS.has(domain) : false

  // Determine initial source based on available data
  const getInitialSource = (): LogoSource => {
    // Priority 1: Local VIP logos
    if (isLocalLogo && domain) return 'local'
    // Priority 2: Static logo URL (legacy)
    if (logoUrl) return 'static'
    // Priority 3: External APIs
    if (domain) return 'clearbit'
    // Fallback
    return 'fallback'
  }

  const getInitialUrl = (): string | null => {
    if (isLocalLogo && domain) return `/logos/${domain}.svg`
    if (logoUrl) return logoUrl
    if (domain) return `https://logo.clearbit.com/${domain}`
    return null
  }

  const [logoSource, setLogoSource] = useState<LogoSource>(getInitialSource)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(getInitialUrl)
  const [imageLoading, setImageLoading] = useState(true)

  // Update when props change
  useEffect(() => {
    const newSource = getInitialSource()
    const newUrl = getInitialUrl()

    if (domain) {
      console.log('CompanyLogo: Domain parsed:', domain, isLocalLogo ? '(VIP)' : '')
    }

    setLogoSource(newSource)
    setCurrentLogoUrl(newUrl)
    setImageLoading(true)
  }, [websiteUrl, logoUrl, domain, isLocalLogo])

  // Handle logo load error - cascade through sources
  const handleLogoError = () => {
    console.log(`CompanyLogo: Failed to load from ${logoSource}, trying next...`)

    if (logoSource === 'local' && domain) {
      // Local VIP failed, try Clearbit
      console.log('CompanyLogo: Local logo failed, falling back to Clearbit')
      setLogoSource('clearbit')
      setCurrentLogoUrl(`https://logo.clearbit.com/${domain}`)
    } else if (logoSource === 'static' && domain) {
      // Static failed, try Clearbit
      setLogoSource('clearbit')
      setCurrentLogoUrl(`https://logo.clearbit.com/${domain}`)
    } else if (logoSource === 'static' && !domain) {
      // Static failed, no domain - go to fallback
      setLogoSource('fallback')
      setCurrentLogoUrl(null)
    } else if (logoSource === 'clearbit' && domain) {
      // Clearbit failed, try Google Favicons
      console.log('CompanyLogo: Trying Google Favicons...')
      setLogoSource('google')
      setCurrentLogoUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)
    } else if (logoSource === 'google' || logoSource === 'clearbit') {
      // All external sources failed
      console.log('CompanyLogo: All sources failed, using letter fallback')
      setLogoSource('fallback')
      setCurrentLogoUrl(null)
    }
  }

  const handleLogoLoad = () => {
    setImageLoading(false)
  }

  const theme = getAvatarColor(name)
  const initial = name.charAt(0).toUpperCase()
  const showFallback = logoSource === 'fallback' || !currentLogoUrl

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
        border: showFallback ? 'none' : '1px solid #e2e8f0',
      }}
    >
      {showFallback ? (
        // Letter Avatar Fallback
        <span
          className="font-bold select-none"
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
              className="absolute inset-0 bg-slate-100 animate-pulse"
              style={{ borderRadius: size >= 40 ? 16 : 12 }}
            />
          )}

          {/* Logo image */}
          <img
            src={currentLogoUrl!}
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
