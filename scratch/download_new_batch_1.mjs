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
  "amica.pl": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Amica_Wronki_%28Unternehmen%29_logo.svg",
  "benix.pl": "https://benix.pl/assets/frontend/img/logo-xlw.svg",
  "c-and-a.com": "https://upload.wikimedia.org/wikipedia/commons/e/e8/C%26A_logo.svg",
  "carlsbergpolska.pl": "https://cdn.worldvectorlogo.com/logos/carlsberg-2.svg",
  "calzedonia.com": "https://www.calzedonia.com/on/demandware.static/-/Library-Sites-CalzedoniaContentLibrary/pl_PL/Calzedonia_logo.svg",
  "clochee.com": "https://www.clochee.com/data/gfx/mask/pol/logo_1_big.svg",
  "chatapolska.pl": "https://www.chatapolska.pl/web/img/chata_logo_web.gif",
  "comforty.pl": "https://comforty.pl/media/static/images/logo.png",
  "continental-opony.pl": "https://cdn.worldvectorlogo.com/logos/continental-4.svg",
  "credit-agricole.pl": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Cr%C3%A9dit_Agricole_2020_logo.svg",
  "com40.pl": "https://com40.pl/web/media/image/3/7/x/G/R/j/Y/N/J/g/L/com40_logo.png",
  "dacia.pl": "https://upload.wikimedia.org/wikipedia/commons/2/29/Dacia-Logo-2021.svg",
  "dax.com.pl": "https://www.dax.com.pl/new/files/2025_07_24_12_56_11_2013_01_11_09_36_57_dax.png",
  "delia.pl": "https://www.delia.pl/wp-content/uploads/2022/06/delia_logo_bez_r.png",
  "lilly.com.pl": "https://upload.wikimedia.org/wikipedia/commons/5/52/Lilly-Logo.svg"
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
  console.log('🚀 Rozpoczynam pobieranie Nowej Partii 1...');
  
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
