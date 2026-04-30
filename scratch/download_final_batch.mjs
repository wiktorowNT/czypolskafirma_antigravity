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
  "reebok.eu": "https://cdn.worldvectorlogo.com/logos/reebok-5.svg",
  "relpol.com.pl": "https://www.relpol.pl/extension/frontenddesign/design/main/images/relpol_2025_3.png",
  "sap.com": "https://cdn.worldvectorlogo.com/logos/sap-3.svg",
  "sits.eu": "https://media.licdn.com/dms/image/v2/D4D0BAQGDKwMeYMaANQ/company-logo_200_200/company-logo_200_200/0/1725875791453/sits_furniture_logo?e=2147483647&v=beta&t=vB4smUSYLW1fJ7WppNtjCBxTaATy_ksjQ0bYTrbS5pE",
  "sinsay.com": "https://upload.wikimedia.org/wikipedia/commons/6/61/Sinsay_logo.svg",
  "spar.pl": "https://cdn.worldvectorlogo.com/logos/spar-1.svg",
  "stradivarius.com": "https://cdn.worldvectorlogo.com/logos/stradivarius-1.svg",
  "superdrob.pl": "https://superdrob.pl/wp-content/uploads/2024/12/logo-color.svg",
  "tonsil.pl": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Logo_firmy_tonsil.png",
  "tarczynski.pl": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Tarczynski_SA_logo.svg",
  "toya.net.pl": "https://upload.wikimedia.org/wikipedia/commons/4/4b/TV_TOYA_Nowe_Logo_od_2014.svg",
  "tolpa.pl": "https://tolpa.pl/static/version1776927188/frontend/Fwc/tolpa/pl_PL/images/logo.svg",
  "unibep.pl": "https://unibep.pl/images/logo-Unibep.svg",
  "vistula.pl": "https://www.vrg.pl/_cache/brands/360-64/fit/VISTULA_LOGO.png",
  "voice-net.pl": "https://www.voice-net.pl/index_page/logo-vn-tv_fixed.svg",
  "wfm-kuchnie.pl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv7Q5wY105VWOYEMsORK_VKp23EJW0UEYNOg&s",
  "wajnert.pl": "https://www.wajnert.pl/img/logo-1769071027.svg",
  "wilk-elektronik.pl": "https://www.goodram.com/wp-content/themes/goodram/img/logos/goodram.svg",
  "zortrax.com": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Zortrax_logo.svg",
  "x-kom.pl": "https://assets.x-kom.pl/public/xkom/4e13681a72bfe552.svg",
  "zabkagroup.com": "https://upload.wikimedia.org/wikipedia/commons/3/36/Zabka_logo_2020.svg",
  "loreal.com": "https://files.brandlogos.net/svg/JsRIbNiiis/loreal-group-logo-brandlogos.net_wszgekmaz.svg",
  "mazda.pl": "https://media-assets.mazda.eu/image/upload/q_auto,f_auto,w_360/mazdapl/globalassets/01-global/logos/new_mazda_brand_logo-_2025.png?rnd=49f99e",
  "massimodutti.com": "https://upload.wikimedia.org/wikipedia/commons/1/13/Massimo_Dutti_logo.svg",
  "lewiatan.pl": "https://cdn.worldvectorlogo.com/logos/lewiatan.svg",
  "ford.pl": "https://www.vectorlogo.zone/logos/ford/ford-ar21.svg",
  "haleon.com": "https://www.haleon.com/content/experience-fragments/haleon/corporate/en/header/master/_jcr_content/root/container/container_481579621/image.coreimg.svg/1777453545590/haleon-logo-white.svg"
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
  console.log('🚀 Rozpoczynam FINALNE pobieranie logotypów (27 firm)...');
  
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
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`❌ Błąd przy ${domain}: ${err.message}`);
    }
  }
  
  console.log('\n✨ Wszystkie logotypy pobrane! Generuję audyt końcowy...');
  
  exec('node tools/generate-logo-audit.mjs', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Błąd podczas generowania audytu:', err);
      return;
    }
    console.log('✅ Audyt wygenerowany pomyślnie!');
    console.log('\n👉 Otwórz plik: tools/audyt-logo.html, aby sprawdzić efekty.');
  });
}

main();
