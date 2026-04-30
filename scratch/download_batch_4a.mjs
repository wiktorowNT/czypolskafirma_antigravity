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
  // Partia 4a (znalezione wczoraj)
  "paese.pl": "https://paese.pl/data/gfx/mask/pol/logo_1_big.png",
  "pollena.com.pl": "https://pollena.com.pl/img/pollena-logo-1526036142.jpg",
  "pirelli.com": "https://cdn.worldvectorlogo.com/logos/pirelli-2.svg",
  "polimex-mostostal.pl": "https://images.seeklogo.com/logo-png/26/1/grupa-polimex-mostostal-logo-png_seeklogo-267144.png",
  "polsatbox.pl": "https://www.polsatbox.pl/binaries/web/logo-polsat.DiBXPHra.svg",
  
  // Ponowienie próby (wczorajsze blokady)
  "loreal.com": "https://upload.wikimedia.org/wikipedia/commons/9/9d/L%27Oreal_logo.svg",
  "mazda.pl": "https://upload.wikimedia.org/wikipedia/commons/1/18/Mazda_logo_with_wordmark.svg",
  "massimodutti.com": "https://upload.wikimedia.org/wikipedia/commons/5/52/Massimo_Dutti_logo.svg",
  "lewiatan.pl": "https://upload.wikimedia.org/wikipedia/commons/2/23/Logo_Lewiatan.png",
  "ford.pl": "https://www.ford.pl/content/dam/guxeu/global-shared/header/ford-logo_DSe_global_nav_Light.svg",
  "haleon.com": "https://brandfetch.com/haleon.com/logo.svg" // Zmiana źródła na Brandfetch dla Haleon
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
  console.log('🚀 Rozpoczynam pobieranie Partii 4a + poprawki z wczoraj...');
  
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
      await new Promise(r => setTimeout(r, 1500)); // Przerwa, żeby nie prowokować blokad
    } catch (err) {
      console.error(`❌ Błąd przy ${domain}: ${err.message}`);
    }
  }
  console.log('✨ Zakończono grupę 4a!');
}

main();
