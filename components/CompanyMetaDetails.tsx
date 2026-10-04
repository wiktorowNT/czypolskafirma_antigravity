"use client"

import { useState } from "react"
import { MapPin, Copy, Check, ExternalLink } from "lucide-react"

interface CompanyMetaDetailsProps {
    adres?: string | null
    nip?: string | null
    krs?: string | null
    website_url?: string | null
    registry_url?: string | null
}

// Copy button with feedback
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-warm transition-colors"
            title="Kopiuj"
            aria-label={`Kopiuj ${text}`}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-ink" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    )
}

const label = "text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.06em] mb-2"
const pill = "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-card border-[1.5px] border-line text-[13.5px] font-bold text-ink"

export default function CompanyMetaDetails({
    adres,
    nip,
    krs,
    website_url,
    registry_url
}: CompanyMetaDetailsProps) {
    const hasAddress = !!adres
    const hasIdentifiers = !!nip || !!krs
    const hasLinks = !!website_url || !!registry_url

    // Don't render if no data
    if (!hasAddress && !hasIdentifiers && !hasLinks) {
        return null
    }

    return (
        <div className="bg-warm rounded-3xl p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {hasAddress && (
                        <div>
                            <h4 className={label}>Adres Siedziby w Polsce</h4>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-ink-2 mt-0.5 flex-shrink-0" />
                                <span className="text-[15px] font-semibold text-ink break-words">{adres}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {hasIdentifiers && (
                        <div>
                            <h4 className={label}>Dane Rejestrowe</h4>
                            <div className="flex flex-wrap items-center gap-2">
                                {nip && (
                                    <div className={pill}>
                                        <span className="text-xs text-ink-2">NIP</span>
                                        <span className="tabular-nums">{nip}</span>
                                        <CopyButton text={nip} />
                                    </div>
                                )}
                                {krs && (
                                    <div className={pill}>
                                        <span className="text-xs text-ink-2">KRS</span>
                                        <span className="tabular-nums">{krs}</span>
                                        <CopyButton text={krs} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {hasLinks && (
                        <div>
                            <h4 className={label}>Linki</h4>
                            <div className="flex flex-wrap items-center gap-2">
                                {website_url && (
                                    <a
                                        href={website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${pill} hover:border-ink transition-colors`}
                                    >
                                        Strona WWW
                                        <ExternalLink className="w-3.5 h-3.5 text-ink-2" />
                                    </a>
                                )}
                                {registry_url && (
                                    <a
                                        href={registry_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${pill} hover:border-ink transition-colors`}
                                    >
                                        Rejestr
                                        <ExternalLink className="w-3.5 h-3.5 text-ink-2" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
