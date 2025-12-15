import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ReportDialog } from "@/components/report-dialog"

export function ReportForm() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Zgłoś firmę lub poprawkę</h2>
        <p className="text-xl text-slate-600 mb-8">Pomóż nam rozwijać bazę. Podaj nazwę i link do źródła.</p>

        <ReportDialog>
          <Button className="bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Zgłoś firmę
          </Button>
        </ReportDialog>
      </div>
    </section>
  )
}
