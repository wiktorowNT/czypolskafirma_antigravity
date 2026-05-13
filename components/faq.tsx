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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  }

  return (
    <section id="faq" className="py-20 bg-slate-50 border-t border-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Najczęściej zadawane pytania</h2>
        </div>

        <div className="space-y-4" role="list">
          {faqs.map((faq, index) => {
            const isOpen = openIndexes.includes(index)
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-button-${index}`
            return (
              <div key={index} className="border border-slate-200 rounded-lg" role="listitem">
                <button
                  id={buttonId}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  onClick={() => toggleIndex(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="font-medium text-slate-900">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-6 pb-4"
                  >
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
