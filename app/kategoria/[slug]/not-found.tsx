import Link from "next/link"
import { ChevronLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CategoryNotFound() {
  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg border p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-brand-ink" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-ink mb-4">Nie znaleziono kategorii</h1>

          <p className="text-ink-2 mb-8">Przepraszamy, ale kategoria o podanej nazwie nie została znaleziona.</p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Wróć do strony głównej
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/#kategorie">Przeglądaj dostępne kategorie</Link>
            </Button>
          </div>
        </div>

        <p className="text-sm text-ink-3 mt-6">Sprawdź dostępne kategorie na stronie głównej.</p>
      </div>
    </div>
  )
}
