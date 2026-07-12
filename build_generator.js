const fs = require('fs');

const pageCode = fs.readFileSync('app/narzedzia/generator/page.tsx', 'utf8');

let reactCode = pageCode
  .replace(/import .* from .*/g, '')
  .replace(/"use client"/g, '')
  .replace(/export default function GeneratorPage/g, 'function GeneratorPage')
  .replace(/<Download /g, '<i data-lucide="download" ')
  .replace(/<X /g, '<i data-lucide="x" ')
  .replace(/<LayoutTemplate /g, '<i data-lucide="layout-template" ')
  .replace(/<Globe /g, '<i data-lucide="globe" ')
  .replace(/<Heart /g, '<i data-lucide="heart" ')
  .replace(/<Search /g, '<i data-lucide="search" ')
  .replace(/<\/Download>|<\/X>|<\/LayoutTemplate>|<\/Globe>|<\/Heart>|<\/Search>/g, '</i>')
  .replace(/fetch\(\`\/api\/generator\/search\?q=\$\{encodeURIComponent\(searchQuery\)\}\`\)/g, 'fetchSupabase(searchQuery)')
  .replace(/<Button /g, '<button ')
  .replace(/<\/Button>/g, '</button>')
  .replace(/const htmlToImage = await import\("html-to-image"\)/g, 'const htmlToImage = window.htmlToImage');

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Generator Grafik Social Media</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useRef, useMemo } = React;

        const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTA3NjAsImV4cCI6MjA3NDU2Njc2MH0.FcT8xR_nED2Ev7hrQ5ATEIJ3XM1csOP43qz7VqQwxeQ";

        const countryNames = {
            "PL": "Polska", "DE": "Niemcy", "FR": "Francja", "IT": "Włochy",
            "US": "USA", "GB": "Wielka Brytania", "CH": "Szwajcaria", "SE": "Szwecja",
            "JP": "Japonia", "KR": "Korea Południowa", "ES": "Hiszpania", "NL": "Holandia",
            "BE": "Belgia", "AT": "Austria", "CZ": "Czechy", "SK": "Słowacja",
            "DK": "Dania", "FI": "Finlandia", "NO": "Norwegia", "CN": "Chiny",
            "TR": "Turcja", "BR": "Brazylia", "IN": "Indie", "IL": "Izrael",
            "PT": "Portugalia", "IE": "Irlandia", "GR": "Grecja",
        };

        async function fetchSupabase(query) {
            if (query.includes('czypolskafirma.pl/firma/')) {
                query = query.split('/firma/').pop().split('?')[0] || query;
            }
            const formattedQuery = query.trim().replace(/\\s+/g, "*");
            const url = \`\${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,display_name,website_url,country_code,owner_name,ownership_description,founded_at,verified_at,categories(name,slug)&or=(name.ilike.*\${encodeURIComponent(formattedQuery)}*,slug.ilike.*\${encodeURIComponent(formattedQuery)}*,nip.ilike.*\${encodeURIComponent(formattedQuery)}*,krs.ilike.*\${encodeURIComponent(formattedQuery)}*)&limit=20\`;
            
            const res = await fetch(url, {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: \`Bearer \${SUPABASE_ANON_KEY}\`,
                    Accept: "application/json",
                }
            });
            
            if (!res.ok) return { ok: true, json: async () => [] };
            const data = await res.json();
            
            const results = data.map(company => {
                const categoryData = Array.isArray(company.categories) ? company.categories[0] : company.categories;
                return {
                    id: company.id,
                    slug: company.slug,
                    brand: company.display_name || (company.slug ? company.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : company.name),
                    company: company.name,
                    category: categoryData?.name || "Inne",
                    categorySlug: categoryData?.slug || "inne",
                    website_url: company.website_url,
                    country_code: company.country_code,
                    owner_name: company.owner_name,
                    ownership_description: company.ownership_description,
                    founded_at: company.founded_at,
                    verified_at: company.verified_at,
                };
            });
            return { ok: true, json: async () => results };
        }

        function getDomainFromUrl(url) {
            if (!url) return null;
            try {
                const urlWithProtocol = url.startsWith('http') ? url : \`https://\${url}\`;
                const urlObj = new URL(urlWithProtocol);
                return urlObj.hostname.replace(/^www\\./, '');
            } catch { return null; }
        }

        function getAvatarColor(name) {
            const colors = [
                { bg: "#EFF6FF", text: "#2563EB" },
                { bg: "#F0FDF4", text: "#16A34A" },
                { bg: "#FEF2F2", text: "#DC2626" },
                { bg: "#FFF7ED", text: "#EA580C" },
                { bg: "#FAF5FF", text: "#9333EA" },
                { bg: "#ECFEFF", text: "#0891B2" },
                { bg: "#FDF4FF", text: "#C026D3" },
            ];
            let hash = 0;
            for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff;
            return colors[Math.abs(hash) % colors.length];
        }

        function CompanyLogo({ websiteUrl, name, size = 48, className }) {
            const domain = getDomainFromUrl(websiteUrl);
            const urlCandidates = useMemo(() => {
                if (!domain) return [];
                return [
                    \`/public/logos/\${domain}.png\`,
                    \`/public/logos/\${domain}.svg\`,
                    \`/public/logos/\${domain}.jpg\`,
                    \`/public/logos/\${domain}.jpeg\`,
                    \`/public/logos/\${domain}.webp\`
                ];
            }, [domain]);

            const [candidateIndex, setCandidateIndex] = useState(0);
            const [imageLoading, setImageLoading] = useState(true);
            const [showFallback, setShowFallback] = useState(urlCandidates.length === 0);

            useEffect(() => {
                setCandidateIndex(0);
                setImageLoading(true);
                setShowFallback(urlCandidates.length === 0);
            }, [websiteUrl, urlCandidates.length]);

            const currentUrl = candidateIndex < urlCandidates.length ? urlCandidates[candidateIndex] : null;

            const handleLogoError = () => {
                const nextIndex = candidateIndex + 1;
                if (nextIndex < urlCandidates.length) {
                    setCandidateIndex(nextIndex);
                    setImageLoading(true);
                } else {
                    setShowFallback(true);
                    setImageLoading(false);
                }
            };

            const handleLogoLoad = () => {
                setImageLoading(false);
                setShowFallback(false);
            };

            const theme = getAvatarColor(name);
            const initial = name.charAt(0).toUpperCase();

            return (
                <div
                    className={\`relative flex items-center justify-center overflow-hidden flex-shrink-0 \${className || ''}\`}
                    style={{
                        width: size, height: size,
                        borderRadius: size >= 40 ? 16 : 12,
                        backgroundColor: showFallback ? theme.bg : '#ffffff',
                        border: showFallback ? 'none' : '1px solid #e2e8f0',
                    }}
                >
                    {showFallback ? (
                        <span className="font-bold select-none" style={{ color: theme.text, fontSize: size * 0.45 }} aria-hidden="true">
                            {initial}
                        </span>
                    ) : (
                        <React.Fragment>
                            {imageLoading && <div className="absolute inset-0 bg-slate-100 animate-pulse" style={{ borderRadius: size >= 40 ? 16 : 12 }} />}
                            {currentUrl && (
                                <img
                                    src={currentUrl}
                                    alt={\`Logo \${name}\`}
                                    className="object-contain p-0.5"
                                    style={{ width: size - 4, height: size - 4 }}
                                    onLoad={handleLogoLoad}
                                    onError={handleLogoError}
                                />
                            )}
                        </React.Fragment>
                    )}
                </div>
            );
        }

        // --- INJECTED REACT COMPONENT ---
        ${reactCode}
        
        function App() {
            useEffect(() => {
                lucide.createIcons();
            });
            return <GeneratorPage />;
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>`;

fs.writeFileSync('Generator.html', html);
console.log('Generator.html created successfully.');
