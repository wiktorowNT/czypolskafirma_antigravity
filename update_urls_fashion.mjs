import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const URLS_MAP = {
  "Reserved": "https://www.reserved.com/pl/pl/",
  "Cropp": "https://www.cropp.com/pl/pl/",
  "House": "https://www.housebrand.com/pl/pl/",
  "Mohito": "https://www.mohito.com/pl/pl/",
  "Sinsay": "https://www.sinsay.com/pl/pl/",
  "Zara": "https://www.zara.com/pl/",
  "Bershka": "https://www.bershka.com/pl/",
  "Pull&Bear": "https://www.pullandbear.com/pl/",
  "Stradivarius": "https://www.stradivarius.com/pl/",
  "Massimo Dutti": "https://www.massimodutti.com/pl",
  "Lavard": "https://lavard.pl/",
  "H&M": "https://www2.hm.com/pl_pl/index.html",
  "C&A": "https://www.c-and-a.com/pl/pl/shop",
  "Mango": "https://shop.mango.com/pl",
  "Primark": "https://www.primark.com/pl-pl",
  "4F": "https://4f.com.pl/",
  "Nike": "https://www.nike.com/pl/",
  "Adidas": "https://www.adidas.pl/",
  "Puma": "https://eu.puma.com/pl/pl/home",
  "New Balance": "https://nbsklep.pl/",
  "Reebok": "https://www.reebok.eu/pl-pl",
  "Levi's": "https://www.levi.com/PL/pl_PL/",
  "Wrangler": "https://www.wrangler.com/pl-pl",
  "Lee": "https://eu.lee.com/pl-pl",
  "Tommy Hilfiger": "https://pl.tommy.com/",
  "Calvin Klein": "https://www.calvinklein.pl/",
  "Guess": "https://www.guess.eu/pl-pl",
  "Hugo Boss": "https://www.hugoboss.com/pl/pl/home",
  "Big Star": "https://bigstar.pl/",
  "Diverse": "https://diversesystem.com/pl",
  "Medicine": "https://wearmedicine.com/",
  "Tatuum": "https://www.tatuum.com/",
  "Vistula": "https://vistula.pl/",
  "Bytom": "https://bytom.com.pl/",
  "Wólczanka": "https://wolczanka.pl/",
  "Lancerto": "https://www.lancerto.com/pl/",
  "Recman": "https://www.recman.pl/",
  "Pako Lorente": "https://www.pakolorente.com/",
  "Wittchen": "https://www.wittchen.com/",
  "Ochnik": "https://ochnik.com/",
  "Ryłko": "https://www.rylko.com/",
  "Wojas": "https://wojas.pl/",
  "Kazar": "https://kazar.com/",
  "Gino Rossi": "https://ccc.eu/pl/",
  "Lasocki": "https://ccc.eu/pl/",
  "Badura": "https://ccc.eu/pl/",
  "Venezia": "https://www.venezia.pl/",
  "Puccini": "https://puccini.pl/",
  "Monnari": "https://emonnari.pl/",
  "Solar": "https://www.solar.com.pl/",
  "Gatta": "https://gatta.pl/",
  "Triumph": "https://pl.triumph.com/",
  "Calzedonia": "https://www.calzedonia.com/pl/",
  "Intimissimi": "https://www.intimissimi.com/pl/",
  "MISBHV": "https://misbhv.com/",
  "Local Heroes": "https://localheroesstore.com/",
  "CCC": "https://ccc.eu/pl/"
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
  console.log("=== Aktualizacja brakujących website_url (Moda) ===\n");

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

  console.log("\n=== Podsumowanie website_url ===");
  console.log(`Zaktualizowano: ${updatedCount}`);
  console.log(`Pominięto (brak URL w mapie): ${skippedCount}`);
}

main().catch(console.error);
