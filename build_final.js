const fs = require('fs');

const compiledJs = fs.readFileSync('temp.js', 'utf8');

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Generator Grafik Social Media</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>
    <script src="logos_bundle.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen">
    <div id="root"></div>

    <script type="text/javascript">
        var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useMemo = React.useMemo, Fragment = React.Fragment;

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
            const url = \`\${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url,country_code,categories(name,slug)&or=(name.ilike.*\${encodeURIComponent(formattedQuery)}*,slug.ilike.*\${encodeURIComponent(formattedQuery)}*,nip.ilike.*\${encodeURIComponent(formattedQuery)}*,krs.ilike.*\${encodeURIComponent(formattedQuery)}*)&limit=20\`;
            
            try {
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
                        brand: company.slug ? company.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : company.name,
                        company: company.name,
                        category: categoryData?.name || "Inne",
                        categorySlug: categoryData?.slug || "inne",
                        website_url: company.website_url,
                        country_code: company.country_code,
                    };
                });
                return { ok: true, json: async () => results };
            } catch (err) {
                return { ok: true, json: async () => [] };
            }
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
            
            const logoUrl = useMemo(() => {
                if (!domain) return null;
                const extensions = ['png', 'svg', 'jpg', 'jpeg', 'webp'];
                if (window.logosData) {
                    for (const ext of extensions) {
                        const key = \`\${domain}.\${ext}\`;
                        if (window.logosData[key]) return window.logosData[key];
                    }
                }
                return \`public/logos/\${domain}.png\`; // fallback
            }, [domain]);

            const [imageLoading, setImageLoading] = useState(true);
            const [showFallback, setShowFallback] = useState(!logoUrl);

            useEffect(() => {
                setImageLoading(true);
                setShowFallback(!logoUrl);
            }, [logoUrl]);

            const handleLogoError = () => {
                setShowFallback(true);
                setImageLoading(false);
            };

            const handleLogoLoad = () => {
                setImageLoading(false);
                setShowFallback(false);
            };

            const theme = getAvatarColor(name);
            const initial = name.charAt(0).toUpperCase();

            return React.createElement("div", {
                className: \`relative flex items-center justify-center overflow-hidden flex-shrink-0 \${className || ''}\`,
                style: {
                    width: size, height: size,
                    borderRadius: size >= 40 ? 16 : 12,
                    backgroundColor: showFallback ? theme.bg : '#ffffff',
                    border: showFallback ? 'none' : '1px solid #e2e8f0',
                }
            }, 
            showFallback ? 
                React.createElement("span", {
                    className: "font-bold select-none", 
                    style: { color: theme.text, fontSize: size * 0.45 }, 
                    "aria-hidden": "true"
                }, initial) 
                : React.createElement(React.Fragment, null, 
                    imageLoading && React.createElement("div", {
                        className: "absolute inset-0 bg-slate-100 animate-pulse", 
                        style: { borderRadius: size >= 40 ? 16 : 12 }
                    }),
                    logoUrl && React.createElement("img", {
                        src: logoUrl,
                        alt: \`Logo \${name}\`,
                        className: "object-contain p-0.5",
                        style: { width: size - 4, height: size - 4 },
                        onLoad: handleLogoLoad,
                        onError: handleLogoError
                    })
                )
            );
        }

        // --- INJECTED REACT COMPONENT ---
        ${compiledJs}
        
        function App() {
            useEffect(() => {
                setTimeout(() => {
                   if (window.lucide) {
                       window.lucide.createIcons();
                   }
                }, 100);
            });
            return React.createElement(GeneratorPage, null);
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App, null));
    </script>
</body>
</html>`;

fs.writeFileSync('Generator.html', html);
console.log('Generator.html created successfully without Babel!');
