import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function supabasePatch(id, registryUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ registry_url: registryUrl }),
  });
  return res.ok;
}

async function main() {
  console.log("=== Aktualizacja brakujących registry_url (Tylko puste) ===\n");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,registry_url,nip`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const companies = await res.json();
  
  const toUpdate = companies.filter(c => !c.registry_url || c.registry_url.trim() === '');
  console.log(`Znaleziono ${toUpdate.length} firm z pustym registry_url.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const company of toUpdate) {
    if (company.nip) {
      // Używamy formatu sugerowanego przez użytkownika
      const url = `https://rejestr.io/szukaj?q=${company.nip}`;
      
      const ok = await supabasePatch(company.id, url);
      if (ok) {
         console.log(`✅ Zaktualizowano ${company.slug} -> ${url}`);
         updatedCount++;
      } else {
         console.log(`❌ BŁĄD aktualizacji: ${company.slug}`);
      }
    } else {
      console.log(`⏭ Pominięto ${company.slug} (brak NIP)`);
      skippedCount++;
    }
  }

  console.log("\n=== Podsumowanie ===");
  console.log(`Zaktualizowano: ${updatedCount}`);
  console.log(`Pominięto (brak NIP): ${skippedCount}`);
}

main().catch(console.error);
