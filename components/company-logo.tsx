"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CompanyLogoProps {
  id: string
  brandName: string
  logoUrl?: string
  logoDarkUrl?: string
  brandColor?: string
  size?: number
  rounded?: number
  className?: string
  priority?: boolean
}

// Generate deterministic color from company ID
function generateColorFromId(id: string): string {
  const colors = [
    "#DC2626",
    "#EA580C",
    "#D97706",
    "#CA8A04",
    "#65A30D",
    "#16A34A",
    "#059669",
    "#0891B2",
    "#0284C7",
    "#2563EB",
    "#4F46E5",
    "#7C3AED",
    "#9333EA",
    "#C026D3",
    "#DB2777",
  ]

  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) & 0xffffffff
  }

  return colors[Math.abs(hash) % colors.length]
}

// Check if color is light or dark for contrast
function isLightColor(color: string): boolean {
  const hex = color.replace("#", "")
  const r = Number.parseInt(hex.substr(0, 2), 16)
  const g = Number.parseInt(hex.substr(2, 2), 16)
  const b = Number.parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

export function CompanyLogo({
  id,
  brandName,
  logoUrl,
  logoDarkUrl,
  brandColor,
  size = 40,
  rounded = 8,
  className,
  priority = false,
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Use provided brand color or generate one from ID
  const backgroundColor = brandColor || generateColorFromId(id)
  const textColor = isLightColor(backgroundColor) ? "#000000" : "#FFFFFF"
  const initial = brandName.charAt(0).toUpperCase()

  // Show avatar if no logo URL or image failed to load
  const showAvatar = !logoUrl || imageError

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gray-100 border border-gray-200",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: showAvatar ? backgroundColor : undefined,
      }}
    >
      {showAvatar ? (
        // Avatar with initial
        <span
          className="font-semibold select-none"
          style={{
            color: textColor,
            fontSize: size * 0.4,
          }}
          aria-hidden="true"
        >
          {initial}
        </span>
      ) : (
        <>
          {/* Loading skeleton */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" style={{ borderRadius: rounded }} />
          )}

          {/* Logo image */}
          <Image
            src={logoUrl || "/placeholder.svg"}
            alt={`Logo ${brandName}`}
            width={size}
            height={size}
            className="object-contain"
            style={{
              width: size,
              height: size,
            }}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            decoding="async"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
          />
        </>
      )}
    </div>
  )
}

// Alternative export for avatar-only use cases
export function CompanyAvatar({
  id,
  brandName,
  brandColor,
  size = 40,
  rounded = 8,
  className,
}: Omit<CompanyLogoProps, "logoUrl" | "logoDarkUrl" | "priority">) {
  return (
    <CompanyLogo
      id={id}
      brandName={brandName}
      brandColor={brandColor}
      size={size}
      rounded={rounded}
      className={className}
    />
  )
}
