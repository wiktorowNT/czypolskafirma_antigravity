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

const domainsStr = "amica.pl,benix.pl,c-and-a.com,calzedonia.com,carlsbergpolska.pl,cellnex.com,clochee.com,chatapolska.pl,comforty.pl,continental-opony.pl,credit-agricole.pl,com40.pl,dax.com.pl,delia.pl,develia.pl,drirenaeris.com,lilly.com.pl,dunagroup.com,esteelauder.pl,exatel.pl,eveline.pl,ferrari.com,garmin.com,maspex.com,goldbeck.pl,haleon.com,honda.pl,inea.pl,ikea.com,intimissimi.com,janpol.pl,jeep.pl,kajima.pl,kia.com,kgsa.pl,lancerto.com,levi.com,makemebio.com,massimodutti.com,mazda.pl,manta.eu,mdd.pl,mieszko.pl,miquido.com,miraculum.pl,mohito.com,modecom.com,mokate.com.pl,mokosh.pl,mondelezinternational.com,morele.net,ndi.pl,opel.pl,oracle.com,orange.pl,prymat.pl,puccini.pl,pullandbear.com,seat.pl,stokrotka.pl,tarczynski.pl,tatuum.com,tonsil.pl,teva.pl,toya.net.pl,virginmobile.pl,voice-net.pl,whirlpool.pl,wilk-elektronik.pl,x-kom.pl,wittchen.com,wolczanka.pl,zabkagroup.com,zortrax.com,zara.com";

const domains = domainsStr.split(',');

const SOURCES = [
  // Skip Clearbit because it's the likely source of the bad ones
  {
    name: 'icon.horse',
    getUrl: (domain) => `https://icon.horse/icon/${domain}`,
  },
  {
    name: 'Google Favicon V2',
    getUrl: (domain) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=512`,
  },
  {
    name: 'Favicone',
    getUrl: (domain) => `https://favicone.com/${domain}?s=512`,
  },
  {
    name: 'DuckDuckGo',
    getUrl: (domain) => `https://external-content.duckduckgo.com/ip3/${domain}.ico`,
  }
];

function fetchBuffer(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuffer(res.headers.location).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        resolve(null);
        return;
      }
      const contentType = res.headers['content-type'] || '';
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, contentType, size: buffer.length });
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function getExtension(contentType) {
  const ct = contentType.toLowerCase();
  if (ct.includes('svg')) return '.svg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('webp')) return '.webp';
  return '.png';
}

async function main() {
  console.log(`🚀 Pobieranie nowych wersji logotypów dla ${domains.length} firm...`);
  
  for (const domain of domains) {
    let success = false;
    for (const source of SOURCES) {
      const url = source.getUrl(domain);
      try {
        const result = await fetchBuffer(url);
        if (result && result.buffer && result.size > 300) {
          // Check if it's not the default google globe (726 bytes)
          if (result.size === 726 && source.name === 'Google Favicon V2') continue;
          
          const ext = getExtension(result.contentType);
          const fileName = `${domain}${ext}`;
          const dest = path.join(LOGOS_DIR, fileName);
          
          // Czyszczenie starych formatów
          const extensions = ['png', 'svg', 'jpg', 'webp', 'jpeg'];
          for (const oldExt of extensions) {
             const oldFile = path.join(LOGOS_DIR, `${domain}.${oldExt}`);
             if (fs.existsSync(oldFile)) {
               fs.unlinkSync(oldFile);
             }
          }

          fs.writeFileSync(dest, result.buffer);
          console.log(`✅ [${source.name}] Pobrano: ${fileName} (${result.size} bytes)`);
          success = true;
          break; // Stop trying sources for this domain
        }
      } catch (err) {
        // ignore
      }
    }
    if (!success) {
      console.log(`❌ Błąd przy ${domain}: Nie znaleziono dobrego logo.`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n✨ Wszystkie nowe logotypy gotowe! Odświeżam audyt...');
  exec('node tools/generate-logo-audit.mjs', (err, stdout, stderr) => {
    if (err) console.error(err);
    if (stderr) console.error(stderr);
    console.log(stdout);
    console.log('✅ Audyt gotowy!');
  });
}

main();
