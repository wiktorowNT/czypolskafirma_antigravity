import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'tools', 'audyt-logo.html');

// Config do bazy
const SUPABASE_URL = 'https://bwciuhgrcibtjhhksjqk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTA3NjAsImV4cCI6MjA3NDU2Njc2MH0.FcT8xR_nED2Ev7hrQ5ATEIJ3XM1csOP43qz7VqQwxeQ';

function getDomainFromUrl(url) {
  if (!url) return null;
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function main() {
  console.log('🔍 Pobieranie danych z Supabase i sprawdzanie plików...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, website_url, slug')
    .order('slug', { ascending: true });

  if (error) {
    console.error('❌ Błąd Supabase:', error);
    return;
  }

  // Pobierz listę plików
  if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });
  const existingFiles = fs.readdirSync(LOGOS_DIR).filter(f => !f.startsWith('.'));
  const fileSet = new Set(existingFiles);

  // Mapowanie: domena -> firma
  const missingLogos = [];
  const foundLogos = [];

  companies.forEach(c => {
    const domain = getDomainFromUrl(c.website_url);
    if (!domain) return;

    // Generuj ładną nazwę ze sluga (np. dr-irena-eris -> Dr Irena Eris)
    const displayName = c.slug 
        ? c.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : c.name;

    const extensions = ['.png', '.svg', '.jpg', '.jpeg', '.webp'];
    const actualFile = existingFiles.find(f => extensions.some(ext => f === domain + ext));
    const hasFile = !!actualFile;

    const companyData = {
      id: c.id,
      name: displayName,
      fullName: c.name,
      domain: domain,
      fileName: actualFile || `${domain}.png`,
      url: c.website_url
    };

    if (hasFile) {
        foundLogos.push({ ...companyData, actualFile });
    } else {
        missingLogos.push(companyData);
    }
  });

  console.log(`📋 Wynik: ${foundLogos.length} obecnych, ${missingLogos.length} brakujących.`);

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audyt Logotypów 2.0 - CzyPolskaFirma.pl</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .logo-card.selected { border-color: #ef4444; background-color: #fef2f2; ring: 2px; ring-color: #ef4444; }
        .logo-card.selected .selection-indicator { display: flex; }
        .logo-img { max-height: 80px; object-fit: contain; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen p-8 pb-32 font-sans">
    <div class="max-w-7xl mx-auto">
        <header class="mb-12">
            <h1 class="text-4xl font-black text-slate-900 mb-2">Audyt Logotypów 2.0</h1>
            <p class="text-slate-500">Zarządzaj brandingiem ${companies.length} firm w Twojej bazie.</p>
        </header>

        <!-- SEKCJA BRAKUJĄCYCH -->
        <section class="mb-16">
            <div class="flex items-center gap-4 mb-6">
                <h2 class="text-2xl font-bold text-red-600">Brakujące Logotypy (${missingLogos.length})</h2>
                <div class="h-px flex-1 bg-red-100"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${missingLogos.map(c => `
                <div class="bg-white border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-slate-900 leading-tight mb-1">${c.name}</h3>
                        <p class="text-[11px] text-slate-500 mb-3">Strona: <a href="${c.url}" target="_blank" class="text-blue-500 underline">${c.domain}</a></p>
                    </div>
                    <div class="bg-red-50 p-2 rounded border border-red-100">
                        <p class="text-[10px] font-bold text-red-700 uppercase mb-1">Nazwij plik tak:</p>
                        <code class="text-sm font-mono text-red-600 bg-white px-2 py-0.5 rounded border border-red-200 block truncate">${c.fileName}</code>
                    </div>
                </div>
                `).join('')}
            </div>
        </section>

        <!-- SEKCJA OBECNYCH -->
        <section>
            <div class="flex items-center gap-4 mb-6">
                <h2 class="text-2xl font-bold text-slate-900">Obecne w folderze (${foundLogos.length})</h2>
                <div class="h-px flex-1 bg-slate-200"></div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${foundLogos.map(c => `
                <div class="logo-card bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex flex-col items-center justify-between transition-all cursor-pointer hover:shadow-md relative" 
                     onclick="toggleSelection(this, '${c.domain}')">
                    <div class="selection-indicator hidden absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center text-white shadow-sm z-10">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div class="flex-1 flex items-center justify-center w-full mb-3 bg-slate-50 rounded-lg p-2 min-h-[100px]">
                        <img src="../public/logos/${c.actualFile}?v=${Date.now()}" alt="${c.domain}" class="logo-img drop-shadow-sm" loading="lazy">
                    </div>
                    <div class="w-full">
                        <p class="text-[10px] font-bold text-slate-900 truncate mb-0.5 leading-tight" title="${c.name}">${c.name}</p>
                        <p class="text-[9px] text-slate-400 truncate font-mono">${c.domain}</p>
                        <div class="mt-2 flex items-center justify-between opacity-50">
                             <span class="text-[8px] px-1 bg-slate-100 rounded text-slate-500 font-mono">${c.actualFile.split('.').pop().toUpperCase()}</span>
                             <a href="http://localhost:3000/firma/${c.id}" target="_blank" class="text-[8px] text-blue-500 hover:underline" onclick="event.stopPropagation()">Podgląd ↗</a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </section>
    </div>

    <!-- Sticky Footer Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 shadow-2xl transform transition-transform translate-y-full z-50" id="footer-bar">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <div>
                <p class="text-slate-900 font-bold text-lg"><span id="count">0</span> wybranych logotypów</p>
                <p class="text-slate-500 text-sm italic">Skopiuj komendę, wklej w terminal i naciśnij Enter.</p>
                <p class="text-red-500 text-[10px] font-bold mt-1 uppercase">POTEM WPISZ: node tools/generate-logo-audit.mjs (aby odświeżyć ten widok)</p>
            </div>
            <button onclick="copyCommand()" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-3 shadow-lg shadow-red-200">
                <span>Kopiuj komendę naprawy</span>
                <kbd class="bg-red-500 text-xs px-2 py-1 rounded">CTRL+C</kbd>
            </button>
        </div>
    </div>

    <script>
        const selected = new Set();
        
        function toggleSelection(el, domain) {
            if (selected.has(domain)) {
                selected.delete(domain);
                el.classList.remove('selected');
            } else {
                selected.add(domain);
                el.classList.add('selected');
            }
            updateUI();
        }

        function updateUI() {
            const count = selected.size;
            document.getElementById('count').innerText = count;
            const bar = document.getElementById('footer-bar');
            if (count > 0) {
                bar.classList.remove('translate-y-full');
            } else {
                bar.classList.add('translate-y-full');
            }
        }

        function copyCommand() {
            const domains = Array.from(selected).join(',');
            const command = \`node tools/fetch-logos.mjs --force --domain=\${domains}\`;
            
            navigator.clipboard.writeText(command).then(() => {
                alert('Skopiowano komendę! Teraz wklej ją do terminala i naciśnij Enter.');
            });
        }
    </script>
</body>
</html>
  `;

  fs.writeFileSync(OUTPUT_FILE, html);
  console.log(`✅ Audyt 2.0 wygenerowany!`);
}

main().catch(console.error);
