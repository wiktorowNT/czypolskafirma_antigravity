export interface CompanyBreakdown {
  capital: number
  hq: number
  taxes: number
  production: number
  employment: number
  rd: number
  brand: number
}

export interface CompanyBadge {
  type: string
}

// Weights for each criterion
const WEIGHTS = {
  capital: 40,
  hq: 15,
  taxes: 15,
  production: 10,
  employment: 10,
  rd: 5,
  brand: 5,
}

// Badge coverage mapping
const BADGE_COVERAGE = {
  PL_CAPITAL_50: { criterion: "capital", coverage: 0.8 },
  HQ_PL: { criterion: "hq", coverage: 1.0 },
  CIT_PL: { criterion: "taxes", coverage: 0.9 },
  PRODUCTION_PL_PARTIAL: { criterion: "production", coverage: 0.5 },
  PRODUCTION_PL: { criterion: "production", coverage: 1.0 },
  EMPLOYMENT_PL: { criterion: "employment", coverage: 0.7 },
  RD_PL: { criterion: "rd", coverage: 0.9 },
  BRAND_FROM_PL: { criterion: "brand", coverage: 1.0 },
  COOP: { criterion: "capital", coverage: 0.1 }, // bonus
  COOP_NETWORK: { criterion: "employment", coverage: 0.1 }, // bonus
} as const

export function calculateIndexBreakdown(score: number, badges: string[]): CompanyBreakdown {
  // Initialize coverage for each criterion
  const coverage = {
    capital: 0,
    hq: 0,
    taxes: 0,
    production: 0,
    employment: 0,
    rd: 0,
    brand: 0,
  }

  // Apply badge coverage
  badges.forEach((badge) => {
    const badgeInfo = BADGE_COVERAGE[badge as keyof typeof BADGE_COVERAGE]
    if (badgeInfo) {
      const criterion = badgeInfo.criterion as keyof typeof coverage
      if (badge === "COOP" || badge === "COOP_NETWORK") {
        // Add bonus coverage
        coverage[criterion] = Math.min(1.0, coverage[criterion] + badgeInfo.coverage)
      } else {
        // Set base coverage
        coverage[criterion] = Math.max(coverage[criterion], badgeInfo.coverage)
      }
    }
  })

  // Calculate base points
  const basePoints = {
    capital: coverage.capital * WEIGHTS.capital,
    hq: coverage.hq * WEIGHTS.hq,
    taxes: coverage.taxes * WEIGHTS.taxes,
    production: coverage.production * WEIGHTS.production,
    employment: coverage.employment * WEIGHTS.employment,
    rd: coverage.rd * WEIGHTS.rd,
    brand: coverage.brand * WEIGHTS.brand,
  }

  const totalBasePoints = Object.values(basePoints).reduce((sum, points) => sum + points, 0)

  let breakdown: CompanyBreakdown

  if (totalBasePoints === 0) {
    // No badges - distribute score proportionally to weights
    const totalWeight = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0)
    breakdown = {
      capital: Math.floor((score * WEIGHTS.capital) / totalWeight),
      hq: Math.floor((score * WEIGHTS.hq) / totalWeight),
      taxes: Math.floor((score * WEIGHTS.taxes) / totalWeight),
      production: Math.floor((score * WEIGHTS.production) / totalWeight),
      employment: Math.floor((score * WEIGHTS.employment) / totalWeight),
      rd: Math.floor((score * WEIGHTS.rd) / totalWeight),
      brand: Math.floor((score * WEIGHTS.brand) / totalWeight),
    }
  } else {
    // Scale base points to match target score
    const scaleFactor = score / totalBasePoints
    breakdown = {
      capital: Math.floor(basePoints.capital * scaleFactor),
      hq: Math.floor(basePoints.hq * scaleFactor),
      taxes: Math.floor(basePoints.taxes * scaleFactor),
      production: Math.floor(basePoints.production * scaleFactor),
      employment: Math.floor(basePoints.employment * scaleFactor),
      rd: Math.floor(basePoints.rd * scaleFactor),
      brand: Math.floor(basePoints.brand * scaleFactor),
    }
  }

  // Adjust for rounding differences
  const currentTotal = Object.values(breakdown).reduce((sum, points) => sum + points, 0)
  const difference = score - currentTotal

  if (difference > 0) {
    // Find the criterion with the highest value to add the difference
    const maxCriterion = Object.entries(breakdown).reduce(
      (max, [key, value]) => (value > max.value ? { key: key as keyof CompanyBreakdown, value } : max),
      { key: "capital" as keyof CompanyBreakdown, value: 0 },
    )
    breakdown[maxCriterion.key] += difference
  }

  return breakdown
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

export function getScoreBackgroundColor(score: number): string {
  if (score >= 70) return "bg-green-100"
  if (score >= 40) return "bg-yellow-100"
  return "bg-red-100"
}

export function getProgressBarColor(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export const CRITERION_LABELS = {
  capital: "Kapitał i własność",
  hq: "Siedziba główna",
  taxes: "Podatki",
  production: "Produkcja",
  employment: "Zatrudnienie",
  rd: "Badania i rozwój",
  brand: "Pochodzenie marki",
} as const

export const CRITERION_DESCRIPTIONS = {
  capital: "Struktura właścicielska i pochodzenie kapitału",
  hq: "Lokalizacja siedziby głównej firmy",
  taxes: "Płacenie podatków w Polsce",
  production: "Miejsce produkcji towarów i usług",
  employment: "Zatrudnienie pracowników w Polsce",
  rd: "Prowadzenie badań i rozwoju w Polsce",
  brand: "Pochodzenie i historia marki",
} as const
