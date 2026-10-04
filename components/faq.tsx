"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { serializeJsonLd } from "@/lib/json-ld"

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
    <section id="faq" className="bg-warm py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-ink mb-6">Najczęściej zadawane pytania</h2>

        <div className="space-y-2" role="list">
          {faqs.map((faq, index) => {
            const isOpen = openIndexes.includes(index)
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-button-${index}`
            return (
              <div key={index} className="bg-card border-[1.5px] border-line rounded-2xl" role="listitem">
                <button
                  id={buttonId}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                  onClick={() => toggleIndex(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="text-[15.5px] font-bold text-ink">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-ink-2" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-ink-2" />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-5 pb-4"
                  >
                    <p className="text-[15px] text-ink-2 leading-relaxed">{faq.answer}</p>
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
