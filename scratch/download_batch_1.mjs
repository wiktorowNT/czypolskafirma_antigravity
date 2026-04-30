import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos');

const batch = {
  "abbvie.pl": "https://upload.wikimedia.org/wikipedia/commons/c/cc/AbbVie_logo.svg",
  "bandi.pl": "https://www.bandi.pl/img/2026/logo_bandi.png",
  "benix.pl": "https://benix.pl/assets/frontend/img/logo-xlw.svg",
  "bnpparibas.pl": "https://upload.wikimedia.org/wikipedia/commons/8/85/BNP_Paribas_logo.svg",
  "calvinklein.pl": "https://upload.wikimedia.org/wikipedia/commons/0/06/Calvin_Klein_logo.svg",
  "bytom.com.pl": "https://bytom.com.pl/public-image/logo.svg",
  "carlsbergpolska.pl": "https://www.carlsbergpolska.pl/media/1004/carlsberg-polska-logo.png",
  "capgemini.com": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg",
  "credit-agricole.pl": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Cr%C3%A9dit_Agricole_logo_2017.svg",
  "cropp.com": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Cropp_logo.svg"
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('🚀 Rozpoczynam pobieranie Partii 1...');
  
  for (const [domain, url] of Object.entries(batch)) {
    const ext = url.split('.').pop().split('?')[0];
    const fileName = `${domain}.${ext}`;
    const dest = path.join(LOGOS_DIR, fileName);
    
    // Usuń stare PNG jeśli wgrywamy SVG
    if (ext === 'svg') {
      const oldPng = path.join(LOGOS_DIR, `${domain}.png`);
      if (fs.existsSync(oldPng)) {
        fs.unlinkSync(oldPng);
        console.log(`🗑️  Usunięto stary PNG dla ${domain}`);
      }
    }

    try {
      await download(url, dest);
      console.log(`✅ Pobrano: ${fileName}`);
    } catch (err) {
      console.error(`❌ Błąd przy ${domain}: ${err.message}`);
    }
  }
  console.log('✨ Partia 1 zakończona!');
}

main();
