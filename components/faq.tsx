"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export function FAQ() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([])

  const toggleIndex = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const faqs = [
    {
      question: "Skąd pochodzą dane?",
      answer:
        "Prezentowane informacje opierają się wyłącznie na publicznych rejestrach: KRS, CRBR, CEIDG, GUS, sprawozdaniach finansowych, decyzjach UOKiK oraz oficjalnych stronach podmiotów. Przy każdej informacji znajduje się bezpośredni link do źródła.",
    },
    {
      question: "Jak często aktualizowane są informacje?",
      answer:
        "Baza danych jest aktualizowana regularnie, ze szczególnym uwzględnieniem zmian właścicielskich. Przy każdym wpisie widoczna jest data ostatniej weryfikacji, co pozwala ocenić świeżość danych.",
    },
    {
      question: "Dostęp do API i współpraca",
      answer:
        "W planach rozwojowych serwisu znajduje się udostępnienie API dla mediów i organizacji. W przypadku zainteresowania wykorzystaniem danych lub inną formą współpracy, dostępny jest formularz kontaktowy.",
    },
    {
      question: "Jak zgłosić błąd lub nieścisłość?",
      answer:
        "Do zgłaszania korekt służy formularz 'Zgłoś firmę lub poprawkę'. Wymagane jest podanie linku do źródła potwierdzającego zmianę. Każde zgłoszenie podlega weryfikacji, po której dane są niezwłocznie korygowane.",
    },
  ]

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Najczęściej zadawane pytania</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-slate-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                onClick={() => toggleIndex(index)}
              >
                <span className="font-medium text-slate-900">{faq.question}</span>
                {openIndexes.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </button>
              {openIndexes.includes(index) && (
                <div className="px-6 pb-4">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
