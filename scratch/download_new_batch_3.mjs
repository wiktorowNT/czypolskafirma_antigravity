import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos');

const batch = {
  "massimodutti.com": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Massimo_Dutti_logo_2024.svg",
  "mazda.pl": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Mazda_logo_2024.svg",
  "mieszko.pl": "https://logopik.pl/wp-content/uploads/2021/04/mieszko-logo-png.png",
  "miquido.com": "https://media2.pl/g/0/49969.jpg",
  "miraculum.pl": "https://miraculum.pl/wp-content/uploads/2021/04/miraculum-logo-black.png",
  "mohito.com": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Mohito_logo.svg",
  "modecom.com": "https://modecom.com/wp-content/uploads/2021/05/Logo_MODECOM_black.png",
  "netto.pl": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Netto_Polska_Logo.svg",
  "ndi.pl": "https://ndi.pl/wp-content/themes/ndi/img/logo.svg",
  "opel.pl": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Opel_logo_2023.svg",
  "plusbank.pl": "https://upload.wikimedia.org/wikipedia/commons/4/41/Plus_Bank_logo.svg",
  "cellnex.com": "https://upload.wikimedia.org/wikipedia/commons/7/77/Cellnex_Telecom_logo.svg",
  "premiummobile.pl": "https://premiummobile.pl/wp-content/themes/freedom/img/premium-mobile-logo.svg",
  "prymat.pl": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Prymat_logo.svg",
  "profim.pl": "https://www.profim.pl/assets/images/logo.svg"
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': url 
      },
      rejectUnauthorized: false
    };
    
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
         download(response.headers.location, dest).then(resolve).catch(reject);
         return;
      }
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
  console.log('🚀 Rozpoczynam pobieranie Nowej Partii 3...');
  
  for (const [domain, url] of Object.entries(batch)) {
    let ext = 'png';
    if (url.includes('.svg')) ext = 'svg';
    else if (url.includes('.jpg')) ext = 'jpg';
    else if (url.includes('.gif')) ext = 'gif';
    
    const fileName = `${domain}.${ext}`;
    const dest = path.join(LOGOS_DIR, fileName);
    
    const extensions = ['png', 'svg', 'jpg', 'webp', 'gif'];
    for (const oldExt of extensions) {
      if (oldExt !== ext) {
        const oldFile = path.join(LOGOS_DIR, `${domain}.${oldExt}`);
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      }
    }

    try {
      await download(url, dest);
      console.log(`✅ Pobrano: ${fileName}`);
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`❌ Błąd przy ${domain}: ${err.message}`);
    }
  }
}

main();
