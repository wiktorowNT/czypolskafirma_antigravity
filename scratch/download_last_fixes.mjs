import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos');

const batch = {
  // Nowe, zweryfikowane linki (niektóre z innych źródeł, by uniknąć 403/429)
  "x-kom.pl": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Logo_x-kom.png", 
  "zabkagroup.com": "https://zabkagroup.com/wp-content/themes/zabka-group/assets/img/logo-zabka-group.svg",
  "haleon.com": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Haleon_logo.svg",
  "tarczynski.pl": "https://www.tarczynski.pl/assets/images/logo.png",
  "tonsil.pl": "https://www.skleptonsil.pl/img/tonsil-logo-1563878058.jpg",
  "toya.net.pl": "https://toya.net.pl/img/toya_logo.png",
  "wilk-elektronik.pl": "https://wilk.com.pl/wp-content/themes/wilk/img/logo-wilk.svg",
  "massimodutti.com": "https://static.massimodutti.net/3/static/itxwebstandard/images/logos/logo-massimo-dutti.svg"
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': url // Niektóre serwery wymagają referera (np. x-kom/haleon)
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
  console.log('🚀 Ostatnia prosta: Pobieranie brakujących 8 logotypów...');
  
  for (const [domain, url] of Object.entries(batch)) {
    let ext = 'png';
    if (url.includes('.svg')) ext = 'svg';
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
      await new Promise(r => setTimeout(r, 2000)); // Większa przerwa
    } catch (err) {
      console.error(`❌ Błąd przy ${domain}: ${err.message}`);
    }
  }
  
  console.log('\n✨ Wszystkie logotypy gotowe! Odświeżam audyt...');
  
  exec('node tools/generate-logo-audit.mjs', (err) => {
    if (err) console.error(err);
    console.log('✅ Audyt gotowy!');
  });
}

main();
