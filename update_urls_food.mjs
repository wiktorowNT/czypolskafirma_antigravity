import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const URLS_MAP = {
  "Mlekpol": "https://mlekpol.pl/",
  "Animex Foods": "https://animex.pl/",
  "Sokołów": "https://sokolow.pl/",
  "Tarczyński": "https://tarczynski.pl/",
  "Nestlé": "https://www.nestle.pl/",
  "Mondelēz": "https://www.mondelezinternational.com/Poland",
  "Danone": "https://danone.pl/",
  "Grupa Maspex": "https://maspex.com/",
  "Mlekovita": "https://mlekovita.com.pl/",
  "Grupa Żywiec": "https://grupazywiec.pl/",
  "Kompania Piwowarska": "https://www.kp.pl/",
  "Carlsberg": "https://carlsbergpolska.pl/",
  "Ferrero": "https://www.ferrero.pl/",
  "Wawel": "https://www.wawel.com.pl/",
  "Colian": "https://colian.com/",
  "Hortex": "https://www.hortex.pl/",
  "PepsiCo": "https://www.pepsicopoland.com/",
  "Cedrob": "https://grupacedrob.pl/",
  "OSM Piątnica": "https://piatnica.com.pl/",
  "Polmlek": "https://polmlek.com/",
  "Zott": "https://www.zott-dairy.com/pl/",
  "Hochland": "https://hochland.pl/",
  "Mars": "https://pol.mars.com/",
  "Krajowa Grupa Spożywcza": "https://kgsa.pl/",
  "Bakoma": "https://bakoma.pl/",
  "FoodCare": "https://foodcare.pl/",
  "Mokate": "https://mokate.com.pl/",
  "Prymat": "https://prymat.pl/",
  "Dawtona": "https://dawtona.pl/",
  "Indykpol": "https://www.indykpol.pl/",
  "Iglotex": "https://iglotex.pl/",
  "Oshee": "https://oshee.eu/",
  "Pamapol": "https://pamapol.com.pl/",
  "SuperDrob": "https://superdrob.pl/",
  "Mieszko": "https://mieszko.pl/",
  "PPL Koral": "https://koral.com.pl/",
  "OSM Krasnystaw": "https://krasnystaw.eu/",
  "Nutricia": "https://nutricia.pl/"
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
  console.log("=== Aktualizacja brakujących website_url (Żywność) ===\n");

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
