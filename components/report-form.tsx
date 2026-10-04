import { Plus } from "lucide-react"
import { ReportDialog } from "@/components/report-dialog"

export function ReportForm() {
  return (
    <section className="pb-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-warm rounded-[24px] px-5 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-[22px] font-extrabold tracking-tight text-ink">Zgłoś firmę lub poprawkę</h2>
            <p className="text-[15px] text-ink-2 mt-1">Pomóż nam rozwijać bazę. Podaj nazwę i link do źródła.</p>
          </div>
          <ReportDialog>
            <button className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-card border-[1.5px] border-line text-[15px] font-bold text-ink hover:border-ink transition-colors">
              <Plus className="h-4 w-4" />
              Zgłoś firmę
            </button>
          </ReportDialog>
        </div>
      </div>
    </section>
  )
}
