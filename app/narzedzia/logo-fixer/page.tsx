'use client';

import React, { useState, useEffect, useCallback } from 'react';

const DEFAULT_DOMAINS = "amica.pl,benix.pl,c-and-a.com,calzedonia.com,carlsbergpolska.pl,cellnex.com,clochee.com,chatapolska.pl,comforty.pl,continental-opony.pl,credit-agricole.pl,com40.pl,dax.com.pl,delia.pl,develia.pl,drirenaeris.com,lilly.com.pl,dunagroup.com,esteelauder.pl,exatel.pl,eveline.pl,ferrari.com,garmin.com,maspex.com,goldbeck.pl,haleon.com,honda.pl,inea.pl,ikea.com,intimissimi.com,janpol.pl,jeep.pl,kajima.pl,kia.com,kgsa.pl,lancerto.com,levi.com,makemebio.com,massimodutti.com,mazda.pl,manta.eu,mdd.pl,mieszko.pl,miquido.com,miraculum.pl,mohito.com,modecom.com,mokate.com.pl,mokosh.pl,mondelezinternational.com,morele.net,ndi.pl,opel.pl,oracle.com,orange.pl,prymat.pl,puccini.pl,pullandbear.com,seat.pl,stokrotka.pl,tarczynski.pl,tatuum.com,tonsil.pl,teva.pl,toya.net.pl,virginmobile.pl,voice-net.pl,whirlpool.pl,wilk-elektronik.pl,x-kom.pl,wittchen.com,wolczanka.pl,zabkagroup.com,zortrax.com,zara.com";

const BRANDFETCH_CLIENT_ID = '1idDBakJbZwIqqTCivg';
const LOGO_EXTENSIONS = ['png', 'svg', 'jpg', 'jpeg', 'webp'];

export default function LogoFixer() {
  const [domains, setDomains] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [logoPreview, setLogoPreview] = useState<Record<string, { url: string; ext: string; size: string } | null>>({});
  const [batchProgress, setBatchProgress] = useState<{ running: boolean; current: number; total: number } | null>(null);

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

  // Sprawdź jakie logo istnieje dla danej domeny
  const checkLogoExists = useCallback(async (domain: string) => {
    for (const ext of LOGO_EXTENSIONS) {
      const url = `/logos/${domain}.${ext}`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          const contentLength = res.headers.get('content-length');
          const sizeKb = contentLength ? `${(parseInt(contentLength) / 1024).toFixed(1)}KB` : '';
          setLogoPreview(prev => ({ ...prev, [domain]: { url, ext: ext.toUpperCase(), size: sizeKb } }));
          return;
        }
      } catch {
        // Próbuj następne rozszerzenie
      }
    }
    setLogoPreview(prev => ({ ...prev, [domain]: null }));
  }, []);

  // Sprawdź logo dla wszystkich domen po załadowaniu
  useEffect(() => {
    domains.forEach(d => checkLogoExists(d));
  }, [domains, checkLogoExists]);

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
        // Odśwież podgląd
        setTimeout(() => checkLogoExists(domain), 500);
      } else {
        setStatus(prev => ({ ...prev, [domain]: 'error' }));
      }
    } catch (err) {
      setStatus(prev => ({ ...prev, [domain]: 'error' }));
    }
  };

  // Pobierz logo z Brandfetch CDN i uploaduj
  const autoFetchFromBrandfetch = async (domain: string) => {
    setStatus(prev => ({ ...prev, [domain]: 'uploading' }));

    try {
      const cdnUrl = `https://cdn.brandfetch.io/domain/${domain}?c=${BRANDFETCH_CLIENT_ID}`;
      const imgResponse = await fetch(cdnUrl);
      
      if (!imgResponse.ok) {
        setStatus(prev => ({ ...prev, [domain]: 'error' }));
        return;
      }

      const blob = await imgResponse.blob();
      
      // Określ rozszerzenie na podstawie content-type
      const contentType = imgResponse.headers.get('content-type') || 'image/png';
      let ext = 'png';
      if (contentType.includes('svg')) ext = 'svg';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
      else if (contentType.includes('webp')) ext = 'webp';

      const file = new File([blob], `${domain}.${ext}`, { type: contentType });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('domain', domain);

      const res = await fetch('/api/tools/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setStatus(prev => ({ ...prev, [domain]: 'success' }));
        setTimeout(() => checkLogoExists(domain), 500);
      } else {
        setStatus(prev => ({ ...prev, [domain]: 'error' }));
      }
    } catch (err) {
      setStatus(prev => ({ ...prev, [domain]: 'error' }));
    }
  };

  // Pobierz wszystkie brakujące logo z Brandfetch
  const autoFetchAllMissing = async () => {
    const missing = domains.filter(d => logoPreview[d] === null);
    if (missing.length === 0) {
      alert('Wszystkie domeny mają już logo!');
      return;
    }

    setBatchProgress({ running: true, current: 0, total: missing.length });

    for (let i = 0; i < missing.length; i++) {
      setBatchProgress({ running: true, current: i + 1, total: missing.length });
      await autoFetchFromBrandfetch(missing[i]);
      // Opóźnienie między requestami (rate limit)
      await new Promise(r => setTimeout(r, 500));
    }

    setBatchProgress(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Automatyczny Logo Fixer</h1>
          <p className="text-gray-600 mb-8">
            Narzędzie pomocnicze do szybkiej ręcznej podmiany logotypów, których automat nie mógł pobrać z powodu Cloudflare.
          </p>

          {/* Przycisk: Pobierz wszystkie brakujące z Brandfetch */}
          <div className="mb-6">
            <button
              onClick={autoFetchAllMissing}
              disabled={batchProgress?.running}
              className="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {batchProgress?.running ? (
                <span className="animate-pulse">⏳ Pobieram {batchProgress.current}/{batchProgress.total}...</span>
              ) : (
                <>⚡ Pobierz wszystkie brakujące z Brandfetch</>
              )}
            </button>
          </div>

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
            {domains.map((domain) => {
              const preview = logoPreview[domain];
              return (
                <div key={domain} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 transition-colors">
                  
                  {/* Podgląd aktualnego logo */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                      {preview ? (
                        <img 
                          src={preview.url} 
                          alt={domain}
                          className="w-10 h-10 object-contain"
                          key={preview.url + Date.now()} // Force reload after upload
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    {preview && (
                      <span className="text-[9px] text-gray-400 font-mono">{preview.ext} · {preview.size}</span>
                    )}
                  </div>

                  {/* Nazwa domeny + linki */}
                  <div className="min-w-0 flex-shrink-0" style={{ width: '200px' }}>
                    <div className="font-semibold text-lg truncate">{domain}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <a 
                        href={`https://brandfetch.com/${domain}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
                      >
                        Brandfetch ↗
                      </a>
                      <a 
                        href={`https://worldvectorlogo.com/search?q=${domain.replace(/\.[a-z]+$/, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200"
                      >
                        WVL ↗
                      </a>
                      <button
                        onClick={() => autoFetchFromBrandfetch(domain)}
                        disabled={status[domain] === 'uploading'}
                        className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded hover:bg-amber-200 font-medium disabled:opacity-50"
                        title="Pobierz automatycznie z Brandfetch CDN"
                      >
                        ⚡ Auto
                      </button>
                    </div>
                  </div>

                  {/* Drag-and-drop / upload */}
                  <div className="flex-1">
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors
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
              );
            })}
            
            {domains.length === 0 && (
              <div className="text-center p-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                Lista jest pusta. Wklej domeny po przecinku w polu powyżej.
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
            <button 
              onClick={() => {
                window.location.reload();
              }}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              Odśwież widok
            </button>
            <button 
              onClick={() => {
                alert('Pamiętaj, aby na koniec odświeżyć audyt terminalem: node tools/generate-logo-audit.mjs');
              }}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800"
            >
              Zakończ i przejdź do audytu
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
