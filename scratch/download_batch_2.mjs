import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos');

const batch = {
  "dax.com.pl": "https://www.dax.com.pl/new/img/logo_new_2025.png",
  "dawtona.pl": "https://dawtona.pl/wp-content/uploads/2024/08/Group-4543.svg",
  "elektrotim.pl": "https://elektrotim.pl/wp-content/themes/nomonday/dist/gfx/logo/logo-elektrotim-black.svg",
  "ford.pl": "https://www.ford.pl/content/dam/guxeu/global-shared/header/ford-logo_DSe_global_nav_Light.svg",
  "fujitsu.com": "https://download.logo.wine/logo/Fujitsu/Fujitsu-Logo.wine.png",
  "galameble.com": "https://www.galameble.com/wp-content/themes/wordpress/img/logo.svg",
  "hagi.com.pl": "https://www.hagi.com.pl/media/5e/1f/16/1773140257/hagi%20logo.svg?ts=1773140257",
  "haleon.com": "https://www.haleon.com/content/experience-fragments/haleon/corporate/en/header/master/_jcr_content/root/container/container_481579621/image.coreimg.svg/1741808075713/haleon-logo-white.svg",
  "hyundai.pl": "https://www.hyundai.com/etc/designs/hyundai/ww/en/images/common/logo.png",
  "housebrand.com": "https://www.housebrand.com/skin/frontend/6.455.0/narch/public/images/logo-house.1oeW6au.svg"
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
  console.log('🚀 Rozpoczynam pobieranie Partii 2...');
  
  for (const [domain, url] of Object.entries(batch)) {
    // Determine extension from URL or path
    let ext = 'png';
    if (url.includes('.svg')) ext = 'svg';
    else if (url.includes('.webp')) ext = 'webp';
    else if (url.includes('.jpg')) ext = 'jpg';
    
    const fileName = `${domain}.${ext}`;
    const dest = path.join(LOGOS_DIR, fileName);
    
    // Clean up old formats
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
    } catch (err) {
      console.error(`❌ Błąd przy ${domain}: ${err.message}`);
    }
  }
  console.log('✨ Partia 2 zakończona!');
}

main();
