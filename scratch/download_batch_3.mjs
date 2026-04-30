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
  // Partia 3
  "inea.pl": "https://www.inea.pl/themes/custom/inea/logo.svg",
  "ikea.com": "https://upload.wikimedia.org/wikipedia/commons/c/c5/IKEA_logo.svg",
  "iglotex.pl": "http://zdjecia.iglotex.pl/Logotypy/Iglotex/logotyp%20iglotex.png",
  "jeep.pl": "https://upload.wikimedia.org/wikipedia/commons/d/df/Jeep_logo.svg",
  "kajima.pl": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Kajima_logo.svg",
  "kia.com": "https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo_2.svg",
  "kgsa.pl": "https://upload.wikimedia.org/wikipedia/commons/4/41/Kopex_group_logo.png",
  "lewiatan.pl": "https://upload.wikimedia.org/wikipedia/commons/2/23/Logo_Lewiatan.png",
  "loreal.com": "https://upload.wikimedia.org/wikipedia/commons/9/9d/L%27Oreal_logo.svg",
  "massimodutti.com": "https://upload.wikimedia.org/wikipedia/commons/5/52/Massimo_Dutti_logo.svg",
  "maxcom.pl": "https://maxcom.pl/media/2023/08/maxcom_logo.svg",
  "mazda.pl": "https://upload.wikimedia.org/wikipedia/commons/1/18/Mazda_logo_with_wordmark.svg",
  "meblik.pl": "https://www.meblik.pl/static/version1774954964/frontend/Growcode/meblik/pl_PL/images/logo.svg",
  "meblewojcik.com.pl": "https://meblewojcik.pl/app/uploads/2025/10/Frame-1769.png",
  "wearmedicine.com": "https://cdn.ans-media.com/assets/front/multi/static/images/logoMedicine_v3.svg?v=3",
  
  // Naprawa poprzednich (z poprawionym SSL i headers)
  "dawtona.pl": "https://dawtona.pl/wp-content/uploads/2024/08/Group-4543.svg",
  "ford.pl": "https://www.ford.pl/content/dam/guxeu/global-shared/header/ford-logo_DSe_global_nav_Light.svg",
  "calvinklein.pl": "https://upload.wikimedia.org/wikipedia/commons/0/06/Calvin_Klein_logo.svg",
  "cropp.com": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Cropp_logo.svg"
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      rejectUnauthorized: false // Ignoruj błędy certyfikatów (np. Dawtona)
    };
    
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
         // Follow redirects simple
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Rozpoczynam pobieranie Partii 3 + poprawki...');
  
  for (const [domain, url] of Object.entries(batch)) {
    let ext = 'png';
    if (url.includes('.svg')) ext = 'svg';
    else if (url.includes('.webp')) ext = 'webp';
    else if (url.includes('.jpg')) ext = 'jpg';
    
    const fileName = `${domain}.${ext}`;
    const dest = path.join(LOGOS_DIR, fileName);
    
    // Czyszczenie starych formatów
    const extensions = ['png', 'svg', 'jpg', 'webp'];
    for (const oldExt of extensions) {
      if (oldExt !== ext) {
        const oldFile = path.join(LOGOS_DIR, `${domain}.${oldExt}`);
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
          console.log(`🗑️  Usunięto stary ${oldExt} dla ${domain}`);
        }
      }
    }

    try {
      await download(url, dest);
      console.log(`✅ Pobrano: ${fileName}`);
      await sleep(1000); // 1 sekunda przerwy, żeby nas nie zbanowali
    } catch (err) {
      console.error(`❌ Błąd przy ${domain}: ${err.message}`);
    }
  }
  console.log('✨ Partia 3 zakończona!');
}

main();
