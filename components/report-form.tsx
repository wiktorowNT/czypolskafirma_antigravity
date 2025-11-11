"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, CheckCircle, Upload, Flag } from "lucide-react"

export function ReportForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    requestType: "add-brand", // "add-brand", "correction", "remove-logo"
    brandName: "",
    sourceLink: "",
    comment: "",
    email: "",
    attachment: null as File | null,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Plik jest za duży. Maksymalny rozmiar to 10MB.")
        return
      }
      setFormData({ ...formData, attachment: file })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo submission - no backend
    setIsSubmitted(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsSubmitted(false)
      setFormData({ requestType: "add-brand", brandName: "", sourceLink: "", comment: "", email: "", attachment: null })
    }, 2000)
  }

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "add-brand":
        return "Dodaj nową markę"
      case "correction":
        return "Zgłoś poprawkę"
      case "remove-logo":
        return "Usuń logo/znak towarowy"
      default:
        return "Zgłoszenie"
    }
  }

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Zgłoś markę lub poprawkę</h2>
        <p className="text-xl text-slate-600 mb-8">Pomóż nam rozwijać bazę. Podaj nazwę i link do źródła.</p>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Zgłoś markę
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Zgłoś markę lub poprawkę</DialogTitle>
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
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="add-brand" id="add-brand" />
                      <Label htmlFor="add-brand" className="text-sm">
                        Dodaj nową markę do bazy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="correction" id="correction" />
                      <Label htmlFor="correction" className="text-sm">
                        Zgłoś poprawkę do istniejącej marki
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="remove-logo" id="remove-logo" />
                      <Label htmlFor="remove-logo" className="text-sm">
                        Usuń moje logo/znak towarowy
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandName" className="text-sm font-medium text-slate-700">
                    Nazwa marki *
                  </Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="np. Przykładowa Marka"
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

                <div className="space-y-2">
                  <Label htmlFor="attachment" className="text-sm font-medium text-slate-700">
                    Załącznik (opcjonalnie)
                  </Label>
                  <div className="relative">
                    <Input
                      id="attachment"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xlsx,.xls"
                      className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                    />
                    <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formData.requestType === "remove-logo"
                      ? "Dołącz dokumenty potwierdzające prawo do znaku towarowego (opcjonalnie)"
                      : "Obsługiwane formaty: PDF, DOC, DOCX, JPG, PNG, GIF, TXT, CSV, XLS, XLSX. Maksymalny rozmiar: 10MB"}
                  </p>
                  {formData.attachment && (
                    <p className="text-sm text-green-600">
                      Wybrano: {formData.attachment.name} ({(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

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

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                  {formData.requestType === "remove-logo" ? "Zgłoś do usunięcia" : "Wyślij zgłoszenie"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <div className="mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-transparent"
              >
                <Flag className="h-4 w-4" />
                Usuń moje logo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Usunięcie logo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Jeśli jesteś właścicielem praw do logo prezentowanego w naszym serwisie i chcesz je usunąć, skontaktuj
                  się z nami bezpośrednio:
                </p>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium">Email: kontakt@czypolskafirma.pl</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Usuniemy logo w ciągu 48 godzin od otrzymania uzasadnionego zgłoszenia.
                  </p>
                </div>
                <Button
                  onClick={() => setFormData({ ...formData, requestType: "remove-logo" }) || setIsOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  Wypełnij formularz zgłoszenia
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
