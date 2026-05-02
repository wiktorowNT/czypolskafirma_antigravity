import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos');

const domainsStr = "amica.pl,benix.pl,c-and-a.com,calzedonia.com,carlsbergpolska.pl,cellnex.com,clochee.com,chatapolska.pl,comforty.pl,continental-opony.pl,credit-agricole.pl,com40.pl,dax.com.pl,delia.pl,develia.pl,drirenaeris.com,lilly.com.pl,dunagroup.com,esteelauder.pl,exatel.pl,eveline.pl,ferrari.com,garmin.com,maspex.com,goldbeck.pl,haleon.com,honda.pl,inea.pl,ikea.com,intimissimi.com,janpol.pl,jeep.pl,kajima.pl,kia.com,kgsa.pl,lancerto.com,levi.com,makemebio.com,massimodutti.com,mazda.pl,manta.eu,mdd.pl,mieszko.pl,miquido.com,miraculum.pl,mohito.com,modecom.com,mokate.com.pl,mokosh.pl,mondelezinternational.com,morele.net,ndi.pl,opel.pl,oracle.com,orange.pl,prymat.pl,puccini.pl,pullandbear.com,seat.pl,stokrotka.pl,tarczynski.pl,tatuum.com,tonsil.pl,teva.pl,toya.net.pl,virginmobile.pl,voice-net.pl,whirlpool.pl,wilk-elektronik.pl,x-kom.pl,wittchen.com,wolczanka.pl,zabkagroup.com,zortrax.com,zara.com";
const domains = domainsStr.split(',');

function download(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}

async function scrapeWVL(domain) {
  try {
    const slug = domain.replace(/\.[a-z]+$/, '').split('.')[0]; // e.g. amica.pl -> amica, c-and-a.com -> c-and-a
    const r = await fetch(`https://worldvectorlogo.com/search?q=${slug}`);
    if (!r.ok) return null;
    const t = await r.text();
    const links = [...t.matchAll(/href="([^"]+\/logo\/[^"]+)"/g)].map(m => m[1]);
    
    // find best match
    const exactMatch = links.find(l => l.endsWith(`/logo/${slug}`) || l.endsWith(`/logo/${slug}-1`) || l.endsWith(`/logo/${slug}-logo`));
    const targetLink = exactMatch || links[0];
    if (!targetLink) return null;

    // Fetch the logo page to extract the CDN link
    const r2 = await fetch(targetLink);
    if (!r2.ok) return null;
    const t2 = await r2.text();
    const cdnMatches = t2.match(/https:\/\/cdn\.worldvectorlogo\.com\/logos\/[^\"]+\.svg/g);
    
    if (!cdnMatches || cdnMatches.length === 0) return null;
    
    // Typically the first one is the best one
    const downloadLink = cdnMatches[0];
    
    const buffer = await download(downloadLink);
    if (buffer && buffer.length > 500 && buffer.toString('utf8', 0, 100).includes('<svg')) {
      return buffer;
    }
  } catch(e) {
    return null;
  }
  return null;
}

async function main() {
  console.log('🚀 Rozpoczynam pobieranie z WVL...');
  let wvlCount = 0;
  
  for (const domain of domains) {
    const buffer = await scrapeWVL(domain);
    if (buffer) {
      const dest = path.join(LOGOS_DIR, `${domain}.svg`);
      
      const extensions = ['png', 'svg', 'jpg', 'webp', 'jpeg'];
      for (const oldExt of extensions) {
         const oldFile = path.join(LOGOS_DIR, `${domain}.${oldExt}`);
         if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      fs.writeFileSync(dest, buffer);
      console.log(`✅ [WVL] Pobrano SVG dla: ${domain}`);
      wvlCount++;
    } else {
      console.log(`❌ Brak w WVL: ${domain}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nZakończono. Pomyślnie pobrano z WVL: ${wvlCount}/${domains.length}`);
  
  exec('node tools/generate-logo-audit.mjs', (err, stdout) => {
    if (err) console.error(err);
    console.log('✅ Audyt gotowy!');
  });
}

main();
