"use client"

interface CategoryStatsProps {
    categoryName: string
    totalCompanies: number
    polishCompanies: number
    foreignCompanies: number
}

export function CategoryStats({
    categoryName,
    totalCompanies,
    polishCompanies,
    foreignCompanies,
}: CategoryStatsProps) {
    const polishPercentage = totalCompanies > 0
        ? Math.round((polishCompanies / totalCompanies) * 100)
        : 0

    return (
        <div className="bg-white rounded-xl md:rounded-2xl border border-line p-3 md:p-6 mb-6 md:mb-8">
            {/* Header Row */}
            <div className="flex items-baseline justify-between mb-2 md:mb-4">
                <h2 className="text-lg md:text-2xl font-bold text-ink">{categoryName}</h2>
                <span className="text-xs md:text-sm text-ink-3">
                    <span className="font-semibold text-ink">{totalCompanies}</span>
                    <span className="hidden md:inline"> firm w bazie</span>
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 md:h-4 bg-warm-2 rounded-full overflow-hidden mb-2 md:mb-3">
                <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${polishPercentage}%` }}
                />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs md:text-sm">
                <div className="flex items-center gap-1.5 md:gap-2">
                    <img
                        src="/flags/pl-w40.png"
                        alt="PL"
                        className="w-4 md:w-5 h-auto rounded"
                    />
                    <span className="font-bold text-ink">
                        {polishCompanies}
                        <span className="hidden md:inline"> Polskich</span>
                    </span>
                    <span className="hidden md:inline text-ink-3">({polishPercentage}%)</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-ink-3">
                        {foreignCompanies}
                        <span className="hidden md:inline"> Zagranicznych</span>
                    </span>
                    <span className="hidden md:inline text-ink-3">({100 - polishPercentage}%)</span>
                    <span className="text-base md:text-lg">🌍</span>
                </div>
            </div>
        </div>
    )
}
