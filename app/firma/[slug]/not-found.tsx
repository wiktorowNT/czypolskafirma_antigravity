import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CompanyNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Firma nie znaleziona</h1>
          <p className="text-slate-600">
            Nie znaleźliśmy profilu firmy o podanym identyfikatorze w naszej bazie danych.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do strony głównej
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full bg-transparent">
            <Link href="/#kategorie">Przeglądaj kategorie</Link>
          </Button>
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Jeśli uważasz, że ta firma powinna być w naszej bazie, możesz ją zgłosić za pomocą formularza na stronie
            głównej.
          </p>
        </div>
      </div>
    </div>
  )
}
