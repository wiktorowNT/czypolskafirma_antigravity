"use client"

import { useState } from "react"
import { MapPin, Copy, Check, Globe, ExternalLink, FileText } from "lucide-react"

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
            className="p-1 rounded hover:bg-slate-200/80 transition-colors"
            title="Kopiuj"
        >
            {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            )}
        </button>
    )
}

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
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Address */}
                <div className="space-y-4">
                    {hasAddress && (
                        <div>
                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                Adres Siedziby
                            </h4>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-700 break-words">{adres}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Identifiers + Links */}
                <div className="space-y-4">
                    {/* Registry Identifiers */}
                    {hasIdentifiers && (
                        <div>
                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                Dane Rejestrowe
                            </h4>
                            <div className="flex flex-wrap items-center gap-3">
                                {nip && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200">
                                        <span className="text-xs text-slate-500 font-medium">NIP</span>
                                        <span className="text-sm font-mono text-slate-700">{nip}</span>
                                        <CopyButton text={nip} />
                                    </div>
                                )}
                                {krs && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200">
                                        <span className="text-xs text-slate-500 font-medium">KRS</span>
                                        <span className="text-sm font-mono text-slate-700">{krs}</span>
                                        <CopyButton text={krs} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* External Links */}
                    {hasLinks && (
                        <div>
                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                Linki
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                                {website_url && (
                                    <a
                                        href={website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors"
                                    >
                                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                                        Strona WWW
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </a>
                                )}
                                {registry_url && (
                                    <a
                                        href={registry_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                        Rejestr
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
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
