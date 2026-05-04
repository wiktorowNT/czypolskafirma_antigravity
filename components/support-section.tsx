"use client"

import { Heart, Coffee, ArrowRight } from "lucide-react"

export function SupportSection() {
  return (
    <section id="support" className="py-20 bg-white border-t border-slate-100 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-[0.03]">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-8 border-red-600" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full border-8 border-slate-900" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-16 shadow-2xl overflow-hidden relative">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 opacity-50" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
                <Heart className="w-4 h-4 fill-current" />
                Niezależna inicjatywa
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                Podoba Ci się ten projekt? <br />
                <span className="text-red-500">Wesprzyj nasze działania!</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                CzyPolskaFirma.pl to niezależna inicjatywa stworzona dla każdego, kto chce kupować świadomie. 
                Twoje wsparcie pomaga nam rozwijać bazę danych, docierać do rzetelnych informacji 
                o strukturach własnościowych i budować największy w Polsce portal o pochodzeniu marek.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="https://buycoffee.to/czypolskafirma.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-600/20"
                >
                  <Coffee className="w-5 h-5" />
                  Postaw nam kawę
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </a>
                <p className="text-sm text-slate-400">
                  Wsparcie przez bezpieczne płatności buycoffee.to
                </p>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="w-64 h-64 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="text-center p-6">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Heart className="w-10 h-10 text-white fill-current" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">Dziękujemy!</div>
                  <div className="text-slate-400 text-sm">Każda cegiełka ma znaczenie</div>
                </div>
              </div>
              {/* Decor elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-red-500/20 blur-2xl rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-blue-500/20 blur-2xl rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
