'use client';

import React, { useState, useEffect } from 'react';

const DEFAULT_DOMAINS = "amica.pl,benix.pl,c-and-a.com,calzedonia.com,carlsbergpolska.pl,cellnex.com,clochee.com,chatapolska.pl,comforty.pl,continental-opony.pl,credit-agricole.pl,com40.pl,dax.com.pl,delia.pl,develia.pl,drirenaeris.com,lilly.com.pl,dunagroup.com,esteelauder.pl,exatel.pl,eveline.pl,ferrari.com,garmin.com,maspex.com,goldbeck.pl,haleon.com,honda.pl,inea.pl,ikea.com,intimissimi.com,janpol.pl,jeep.pl,kajima.pl,kia.com,kgsa.pl,lancerto.com,levi.com,makemebio.com,massimodutti.com,mazda.pl,manta.eu,mdd.pl,mieszko.pl,miquido.com,miraculum.pl,mohito.com,modecom.com,mokate.com.pl,mokosh.pl,mondelezinternational.com,morele.net,ndi.pl,opel.pl,oracle.com,orange.pl,prymat.pl,puccini.pl,pullandbear.com,seat.pl,stokrotka.pl,tarczynski.pl,tatuum.com,tonsil.pl,teva.pl,toya.net.pl,virginmobile.pl,voice-net.pl,whirlpool.pl,wilk-elektronik.pl,x-kom.pl,wittchen.com,wolczanka.pl,zabkagroup.com,zortrax.com,zara.com";

export default function LogoFixer() {
  const [domains, setDomains] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});

  useEffect(() => {
    // Load domains from localStorage on mount
    const saved = localStorage.getItem('logoFixerDomains');
    if (saved) {
      setDomains(saved.split(',').map(d => d.trim()).filter(Boolean));
      setInputText(saved);
    } else {
      setDomains(DEFAULT_DOMAINS.split(','));
      setInputText(DEFAULT_DOMAINS);
    }
  }, []);

  const handleUpdateList = () => {
    const list = inputText.split(',').map(d => d.trim()).filter(Boolean);
    setDomains(list);
    localStorage.setItem('logoFixerDomains', list.join(','));
  };

  const handleDrop = async (e: React.DragEvent, domain: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await uploadFile(file, domain);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, domain: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, domain);
  };

  const uploadFile = async (file: File, domain: string) => {
    setStatus(prev => ({ ...prev, [domain]: 'uploading' }));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', domain);

    try {
      const res = await fetch('/api/tools/upload-logo', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setStatus(prev => ({ ...prev, [domain]: 'success' }));
      } else {
        setStatus(prev => ({ ...prev, [domain]: 'error' }));
      }
    } catch (err) {
      setStatus(prev => ({ ...prev, [domain]: 'error' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Automatyczny Logo Fixer</h1>
          <p className="text-gray-600 mb-8">
            Narzędzie pomocnicze do szybkiej ręcznej podmiany logotypów, których automat nie mógł pobrać z powodu Cloudflare.
          </p>

          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h2 className="text-sm font-bold text-blue-900 mb-2">Edytuj listę firm do weryfikacji</h2>
            <textarea 
              className="w-full text-sm border-gray-300 rounded p-2 h-24 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-mono"
              placeholder="Wklej domeny po przecinku, np: amica.pl, benix.pl, c-and-a.com"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              onClick={handleUpdateList}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Aktualizuj listę poniżej
            </button>
          </div>

          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 transition-colors">
                
                <div className="w-1/3">
                  <div className="font-semibold text-lg">{domain}</div>
                  <div className="flex gap-2 mt-2">
                    <a 
                      href={`https://brandfetch.com/${domain}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Brandfetch ↗
                    </a>
                    <a 
                      href={`https://worldvectorlogo.com/search?q=${domain.replace(/\.[a-z]+$/, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                    >
                      WVL ↗
                    </a>
                  </div>
                </div>

                <div className="w-2/3 flex items-center gap-4">
                  <div 
                    className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors
                      ${status[domain] === 'success' ? 'border-green-400 bg-green-50' : 
                        status[domain] === 'error' ? 'border-red-400 bg-red-50' : 
                        'border-gray-300 hover:border-blue-400 bg-white'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, domain)}
                  >
                    {status[domain] === 'uploading' ? (
                      <span className="text-blue-600 font-medium animate-pulse">Wgrywanie...</span>
                    ) : status[domain] === 'success' ? (
                      <span className="text-green-600 font-medium">✅ Zapisano!</span>
                    ) : status[domain] === 'error' ? (
                      <span className="text-red-600 font-medium">❌ Błąd wgrywania</span>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center">
                        <span className="text-sm text-gray-500">Przeciągnij tu plik (.svg, .png) lub <span className="text-blue-500 underline">kliknij</span></span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".svg,.png,.jpg,.jpeg,.webp" 
                          onChange={(e) => handleFileSelect(e, domain)}
                        />
                      </label>
                    )}
                  </div>
                </div>

              </div>
            ))}
            
            {domains.length === 0 && (
              <div className="text-center p-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                Lista jest pusta. Wklej domeny po przecinku w polu powyżej.
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
            <button 
              onClick={() => {
                fetch('/api/tools/upload-logo', { method: 'GET' }) // just a ping or do something else
                alert('Pamiętaj, aby na koniec odświeżyć audyt terminalem: node tools/generate-logo-audit.mjs');
              }}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800"
            >
              Odśwież narzędzia po zakończeniu
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
