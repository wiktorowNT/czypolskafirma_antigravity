import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const URLS_MAP = {
  "Cellnex": "https://www.cellnex.com/pl-pl/",
  "NetWorkS!": "https://www.networks.pl/",
  "Telefonia Dialog": "https://netia.pl/",
  "Polkomtel Infrastruktura": "https://www.cellnex.com/pl-pl/",
  "Voice Net": "https://www.voice-net.pl/",
  "Nju mobile": "https://www.njumobile.pl/",
  "Heyah": "https://www.heyah.pl/",
  "Plush": "https://www.plushbezlimitu.pl/",
  "Orange": "https://www.orange.pl/",
  "Virgin Mobile": "https://virginmobile.pl/",
  "T-Mobile": "https://www.t-mobile.pl/",
  "Play": "https://www.play.pl/",
  "Plus": "https://www.plus.pl/",
  "Netia": "https://www.netia.pl/",
  "Vectra": "https://www.vectra.pl/",
  "UPC": "https://www.play.pl/",
  "Multimedia": "https://www.multimedia.pl/",
  "Inea": "https://www.inea.pl/",
  "Toya": "https://toya.net.pl/",
  "Polsat Box": "https://polsatbox.pl/",
  "Canal+": "https://pl.canalplus.com/",
  "Emitel": "https://www.emitel.pl/",
  "Exatel": "https://exatel.pl/",
  "Fiberhost": "https://www.fiberhost.com/",
  "Światłowód Inwestycje": "https://swiatlowodinwestycje.pl/",
  "Nexera": "https://www.nexera.pl/",
  "Lycamobile": "https://www.lycamobile.pl/pl/",
  "Premium Mobile": "https://premiummobile.pl/",
  "Mobile Vikings": "https://mobilevikings.pl/",
  "a2mobile": "https://a2mobile.pl/",
  "Lajt Mobile": "https://lajtmobile.pl/",
  "Otvarta": "https://otvarta.pl/",
  "Aero2": "https://aero2.pl/",
  "wRodzinie": "https://wrodzinie.com.pl/",
  "Promax": "https://www.promax.media.pl/",
  "Sat Film": "https://www.satfilm.pl/",
  "ASTA-NET": "https://asta-net.pl/",
  "Korbank": "https://korbank.pl/"
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
  console.log("=== Aktualizacja brakujących website_url (Telekomunikacja) ===\n");

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
