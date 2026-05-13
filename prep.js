const fs = require('fs');
let code = fs.readFileSync('app/narzedzia/generator/page.tsx', 'utf8');

code = code.replace(/import .* from .*/g, '');
code = code.replace(/"use client"/g, '');
code = code.replace(/export default function GeneratorPage/g, 'function GeneratorPage');
code = code.replace(/<Download /g, '<i data-lucide="download" ');
code = code.replace(/<X /g, '<i data-lucide="x" ');
code = code.replace(/<LayoutTemplate /g, '<i data-lucide="layout-template" ');
code = code.replace(/<Globe /g, '<i data-lucide="globe" ');
code = code.replace(/<Heart /g, '<i data-lucide="heart" ');
code = code.replace(/<Search /g, '<i data-lucide="search" ');
code = code.replace(/<\/Download>|<\/X>|<\/LayoutTemplate>|<\/Globe>|<\/Heart>|<\/Search>/g, '</i>');
code = code.replace(/<Button /g, '<button ');
code = code.replace(/<\/Button>/g, '</button>');
code = code.replace(/fetch\(\`\/api\/generator\/search\?q=\$\{encodeURIComponent\(searchQuery\)\}\`\)/g, 'fetchSupabase(searchQuery)');
code = code.replace(/const htmlToImage = await import\("html-to-image"\)/g, 'const htmlToImage = window.htmlToImage');

fs.writeFileSync('temp.tsx', code);
