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
  "esteelauder.pl": "https://upload.wikimedia.org/wikipedia/commons/3/37/Est%C3%A9e_Lauder_Companies_logo.svg",
  "dunagroup.com": "https://www.dunagroup.com/section-main/immagini/duna-corradini.png",
  "exatel.pl": "https://upload.wikimedia.org/wikipedia/commons/e/ea/EXATEL_LOGO_RGB.jpg",
  "maspex.com": "https://foto.maspex.com/theme/public/assets/img/logo.svg",
  "haleon.com": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Haleon_Logo.svg",
  "honda.pl": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg",
  "inea.pl": "https://inea.pl/sites/default/files/2024-08/logo_INEA_cyjan_300_RGB.png",
  "jeep.pl": "https://upload.wikimedia.org/wikipedia/commons/0/03/Jeep_logo.svg",
  "ikea.com": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Ikea_logo.svg",
  "intimissimi.com": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Intimissimi_Logo.svg",
  "janpol.pl": "https://www.janpol.pl/wp-content/themes/janpol/img/logo.svg",
  "kajima.pl": "https://www.kajima.pl/wp-content/themes/kajima/img/logo.svg",
  "kgsa.pl": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Kopex_group_logo.png",
  "lancerto.com": "https://www.lancerto.com/media/logo/default/logo_lancerto_black.svg",
  "levi.com": "https://upload.wikimedia.org/wikipedia/commons/d/da/Levi%27s_logo.svg"
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
  console.log('🚀 Rozpoczynam pobieranie Nowej Partii 2...');
  
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
