"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle, Upload, Flag } from "lucide-react"

interface ReportDialogProps {
    children: React.ReactNode
    defaultBrandName?: string
}

export function ReportDialog({ children, defaultBrandName = "" }: ReportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        requestType: "add-brand", // "add-brand", "correction", "remove-logo"
        brandName: defaultBrandName,
        sourceLink: "",
        comment: "",
        email: "",
    })
    const [attachments, setAttachments] = useState<File[]>([])
    const [fileError, setFileError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            const newFiles = Array.from(files)

            const MAX_TOTAL_SIZE_MB = 8
            const MAX_FILES = 5

            if (attachments.length + newFiles.length > MAX_FILES) {
                setFileError(`Możesz dodać maksymalnie ${MAX_FILES} plików.`)
                e.target.value = "" // Reset input
                return
            }

            // Calculate current total size
            const currentTotalSize = attachments.reduce((acc, file) => acc + file.size, 0)

            // Calculate new files total size
            const newFilesTotalSize = newFiles.reduce((acc, file) => acc + file.size, 0)

            if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
                setFileError(`Łączny rozmiar plików nie może przekraczać ${MAX_TOTAL_SIZE_MB}MB.`)
                e.target.value = ""
                return
            }

            const validFiles: File[] = []

            for (const file of newFiles) {
                // Check for duplicates
                const isDuplicate = attachments.some(a => a.name === file.name && a.size === file.size)
                if (!isDuplicate) {
                    validFiles.push(file)
                }
            }

            setFileError(null)
            setAttachments(prev => [...prev, ...validFiles])

            // Reset input to allow selecting same file again if needed (or others)
            e.target.value = ""
        }
    }

    const removeFile = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove))
        setFileError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setFileError(null)

        const formDataToSend = new FormData()
        formDataToSend.append("requestType", formData.requestType)
        formDataToSend.append("brandName", formData.brandName)
        formDataToSend.append("sourceLink", formData.sourceLink)
        formDataToSend.append("comment", formData.comment)
        formDataToSend.append("email", formData.email)

        // Append all attachments
        attachments.forEach((file) => {
            formDataToSend.append("attachment", file)
        })

        try {
            const response = await fetch("/api/zglos-firme", {
                method: "POST",
                body: formDataToSend,
            })

            // Check content type to safely parse JSON
            const contentType = response.headers.get("content-type")
            let result

            if (contentType && contentType.includes("application/json")) {
                result = await response.json()
            } else {
                // Non-JSON response (likely 413 or 500 HTML page)
                if (!response.ok) throw new Error(`Server returned ${response.status} ${response.statusText}`)
            }

            if (response.ok && result?.success) {
                setIsSubmitted(true)
                setTimeout(() => {
                    setIsOpen(false)
                    setIsSubmitted(false)
                    setFormData({ requestType: "add-brand", brandName: defaultBrandName, sourceLink: "", comment: "", email: "" })
                    setAttachments([])
                }, 3000)
            } else {
                alert(result?.message || "Wystąpił błąd podczas wysyłania zgłoszenia. Sprawdź rozmiar plików.")
            }
        } catch (error) {
            console.error("Błąd wysyłki:", error)
            alert("Wystąpił błąd sieciowy lub pliki są zbyt duże. Spróbuj zmniejszyć rozmiar załączników.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle>Zgłoś firmę lub poprawkę</DialogTitle>
                </DialogHeader>

                {isSubmitted ? (
                    <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Dziękujemy za zgłoszenie!</h3>
                        <p className="text-slate-600">
                            {formData.requestType === "remove-logo"
                                ? "Sprawdzimy Twoje zgłoszenie i usuniemy logo w ciągu 48 godzin."
                                : "Sprawdzimy podane informacje i dodamy je do bazy."}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-slate-700">Typ zgłoszenia *</Label>
                            <RadioGroup
                                value={formData.requestType}
                                onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                                className="space-y-3"
                            >
                                {[
                                    { id: "add-brand", label: "Dodaj nową firmę do bazy" },
                                    { id: "correction", label: "Zgłoś poprawkę do istniejącej firmy" },
                                    { id: "remove-logo", label: "Usuń moje logo/znak towarowy" },
                                ].map((option) => (
                                    <div key={option.id}>
                                        <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                                        <Label
                                            htmlFor={option.id}
                                            className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 bg-white cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:bg-red-50 transition-all"
                                        >
                                            <span className="text-sm font-medium text-slate-900">{option.label}</span>
                                            <div className={`w-4 h-4 rounded-full border-2 ${formData.requestType === option.id ? 'border-red-600 bg-red-600' : 'border-slate-300'}`} />
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="brandName" className="text-sm font-medium text-slate-700">
                                Nazwa firmy *
                            </Label>
                            <Input
                                id="brandName"
                                value={formData.brandName}
                                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                placeholder="np. Przykładowa Firma"
                                className="w-full"
                                required
                            />
                        </div>

                        {formData.requestType !== "remove-logo" && (
                            <div className="space-y-2">
                                <Label htmlFor="sourceLink" className="text-sm font-medium text-slate-700">
                                    Link do źródła *
                                </Label>
                                <Input
                                    id="sourceLink"
                                    type="url"
                                    value={formData.sourceLink}
                                    onChange={(e) => setFormData({ ...formData, sourceLink: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full"
                                    required
                                />
                            </div>
                        )}

                        {(formData.requestType === "correction" || formData.requestType === "remove-logo") && (
                            <div className="space-y-3">
                                <Label htmlFor="attachment" className="text-sm font-medium text-slate-700">
                                    Załączniki (opcjonalnie)
                                </Label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            id="attachment"
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xlsx,.xls"
                                            className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                                        />
                                        <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    </div>

                                    {fileError && (
                                        <p className="text-sm text-red-600 font-medium">
                                            {fileError}
                                        </p>
                                    )}

                                    {attachments.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {attachments.map((file, index) => (
                                                <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className="p-1.5 bg-white rounded border border-slate-100 shrink-0">
                                                            <Flag className="h-3 w-3 text-slate-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                        aria-label="Usuń plik"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-slate-500">
                                    {formData.requestType === "remove-logo"
                                        ? "Dołącz dokumenty potwierdzające prawo do znaku towarowego."
                                        : "Obsługiwane formaty: PDF, DOC, IMG, XLS. Max 8MB łącznie. Max 5 plików."}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="comment" className="text-sm font-medium text-slate-700">
                                {formData.requestType === "remove-logo" ? "Uzasadnienie żądania usunięcia" : "Komentarz"}
                            </Label>
                            <Textarea
                                id="comment"
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                placeholder={
                                    formData.requestType === "remove-logo"
                                        ? "Proszę opisać podstawę prawną żądania usunięcia logo..."
                                        : "Dodatkowe informacje..."
                                }
                                rows={3}
                                className="w-full resize-none"
                                required={formData.requestType === "remove-logo"}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                Twój email {formData.requestType === "remove-logo" ? "*" : "(opcjonalnie)"}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="twoj@email.com"
                                className="w-full"
                                required={formData.requestType === "remove-logo"}
                            />
                            <p className="text-xs text-slate-500">
                                {formData.requestType === "remove-logo"
                                    ? "Wymagany do kontaktu w sprawie usunięcia logo"
                                    : "Podaj email, aby otrzymać powiadomienie gdy firma zostanie dodana lub zaktualizowana."}
                            </p>
                        </div>

                        {formData.requestType === "remove-logo" && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-800">
                                    <strong>Informacja:</strong> Jeśli jesteś właścicielem praw do prezentowanego logo lub znaku
                                    towarowego, usuniemy je w ciągu 48 godzin od otrzymania uzasadnionego zgłoszenia.
                                </p>
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting
                                ? "Wysyłanie..."
                                : (formData.requestType === "remove-logo" ? "Zgłoś do usunięcia" : "Wyślij zgłoszenie")
                            }
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
