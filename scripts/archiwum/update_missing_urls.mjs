import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const URLS_MAP = {
  "loreal": "https://www.loreal.com/pl-pl/poland/",
  "nivea": "https://www.nivea.pl",
  "beiersdorf": "https://www.beiersdorf.pl",
  "eveline-cosmetics": "https://eveline.pl",
  "bielenda": "https://bielenda.pl",
  "dr-irena-eris": "https://drirenaeris.com",
  "inglot": "https://inglot.pl",
  "torf-corporation": "https://tolpa.pl",
  "oceanic": "https://oceanic.com.pl",
  "farmona": "https://farmona.pl",
  "joanna": "https://joanna.pl",
  "sylveco": "https://sylveco.pl",
  "delia-cosmetics": "https://delia.pl",
  "nacomi": "https://nacomi.pl",
  "onlybio": "https://onlybio.life",
  "yope": "https://yope.me",
  "paese": "https://paese.pl",
  "pierre-rene": "https://www.pierrerene.pl",
  "bandi-cosmetics": "https://www.bandi.pl",
  "betley": "https://resibo.pl",
  "la-rive": "https://www.larive-parfums.com",
  "barwa": "https://barwa.com.pl",
  "miraculum": "https://miraculum.pl",
  "hagi": "https://hagi.com.pl",
  "clochee": "https://www.clochee.com",
  "apis-natural-cosmetics": "https://apiscosmetics.pl",
  "kanani-europe": "https://miyacosmetics.com",
  "dax-cosmetics": "https://dax.com.pl",
  "mokosh": "https://mokosh.pl",
  "new-approach": "https://basiclab.shop",
  "unilever": "https://www.unilever.pl",
  "coty": "https://www.coty.com",
  "oriflame": "https://pl.oriflame.com",
  "estee-lauder": "https://www.esteelauder.pl",
  "yves-rocher": "https://www.yves-rocher.pl",
  "colgate-palmolive": "https://www.colgatepalmolive.pl",
  "pierre-fabre": "https://www.pierre-fabre.com/pl-pl",
  "sarantis": "https://sarantisgroup.com/pl/",
  "pollena": "https://pollena.com.pl",
  "make-me-bio": "https://makemebio.com",
  "anwen": "https://sklepanwen.pl",
  "avon": "https://avon.pl"
};

async function supabasePatch(id, websiteUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ website_url: websiteUrl }),
  });
  return res.ok;
}

async function main() {
  console.log("=== Aktualizacja brakujących website_url (Tylko puste) ===\n");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const companies = await res.json();
  
  const toUpdate = companies.filter(c => !c.website_url || c.website_url.trim() === '');
  console.log(`Znaleziono ${toUpdate.length} firm z pustym website_url.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const company of toUpdate) {
    const url = URLS_MAP[company.slug];
    if (url) {
      const ok = await supabasePatch(company.id, url);
      if (ok) {
         console.log(`✅ Zaktualizowano ${company.slug} -> ${url}`);
         updatedCount++;
      } else {
         console.log(`❌ BŁĄD aktualizacji: ${company.slug}`);
      }
    } else {
      console.log(`⏭ Pominięto ${company.slug} (brak w mapie URLi)`);
      skippedCount++;
    }
  }

  console.log("\n=== Podsumowanie ===");
  console.log(`Zaktualizowano: ${updatedCount}`);
  console.log(`Pominięto (brak URL w mapie): ${skippedCount}`);
}

main().catch(console.error);
