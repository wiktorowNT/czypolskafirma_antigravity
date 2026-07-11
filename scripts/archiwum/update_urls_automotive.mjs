import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const URLS_MAP = {
  "Volkswagen": "https://www.volkswagen.pl/",
  "Toyota": "https://www.toyota.pl/",
  "Skoda": "https://www.skoda-auto.pl/",
  "BMW": "https://www.bmw.pl/",
  "Audi": "https://www.audi.pl/",
  "Mercedes-Benz": "https://www.mercedes-benz.pl/",
  "Ford": "https://www.ford.pl/",
  "Opel": "https://www.opel.pl/",
  "Kia": "https://www.kia.com/pl/",
  "Hyundai": "https://www.hyundai.pl/",
  "Renault": "https://www.renault.pl/",
  "Peugeot": "https://www.peugeot.pl/",
  "Fiat": "https://www.fiat.pl/",
  "Volvo": "https://www.volvocars.com/pl/",
  "Honda": "https://www.honda.pl/",
  "Nissan": "https://www.nissan.pl/",
  "Mazda": "https://www.mazda.pl/",
  "Dacia": "https://www.dacia.pl/",
  "Seat": "https://www.seat.pl/",
  "Porsche": "https://www.porsche.com/poland/",
  "Ferrari": "https://www.ferrari.com/",
  "Lamborghini": "https://www.lamborghini.com/",
  "Suzuki": "https://suzuki.pl/",
  "Citroën": "https://www.citroen.pl/",
  "Lexus": "https://www.lexus-polska.pl/",
  "Jeep": "https://www.jeep.pl/",
  "Alfa Romeo": "https://www.alfaromeo.pl/",
  "Land Rover": "https://www.landrover.pl/",
  "Maserati": "https://www.maserati.com/pl/pl",
  "Subaru": "https://www.subaru.pl/",
  "Yamaha": "https://www.yamaha-motor.eu/pl/pl/",
  "Michelin": "https://www.michelin.pl/",
  "Goodyear": "https://www.goodyear.eu/pl_pl/consumer.html",
  "Continental": "https://www.continental-opony.pl/",
  "Bridgestone": "https://www.bridgestone.pl/",
  "Pirelli": "https://www.pirelli.com/tyres/pl-pl/car/home",
  "Valeo": "https://www.valeo.com/pl/",
  "Brembo": "https://www.brembo.com/pl/"
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
  console.log("=== Aktualizacja brakujących website_url (Motoryzacja) ===\n");

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
