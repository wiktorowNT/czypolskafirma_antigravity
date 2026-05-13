import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos');
const PORT = 3005;

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/upload') {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', async () => {
            try {
                // This is a simplified multipart parser for this specific tool
                // We expect a custom format or just binary with headers
                // But to keep it simple and robust, we'll use a very basic approach:
                // The standalone tool will send JSON with { domain, fileBase64, fileName }
                
                const data = JSON.parse(Buffer.concat(body).toString());
                const { domain, fileBase64, fileName } = data;

                if (!domain || !fileBase64) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing domain or file' }));
                    return;
                }

                const safeDomain = domain.replace(/[^a-zA-Z0-9.\-]/g, '');
                const ext = path.extname(fileName) || '.png';
                const buffer = Buffer.from(fileBase64.split(',')[1], 'base64');

                if (!fs.existsSync(LOGOS_DIR)) {
                    fs.mkdirSync(LOGOS_DIR, { recursive: true });
                }

                // Delete old files
                ['.png', '.svg', '.jpg', '.jpeg', '.webp'].forEach(oldExt => {
                    const oldFile = path.join(LOGOS_DIR, `${safeDomain}${oldExt}`);
                    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
                });

                const newPath = path.join(LOGOS_DIR, `${safeDomain}${ext}`);
                fs.writeFileSync(newPath, buffer);

                console.log(`✅ Zapisano logo dla: ${safeDomain} (${ext})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: newPath }));
            } catch (err) {
                console.error('❌ Błąd:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Serwer Logo Fixer działa na http://localhost:${PORT}`);
    console.log(`📂 Zapisuje logotypy do: ${LOGOS_DIR}`);
});
