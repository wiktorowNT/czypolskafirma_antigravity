/**
 * Skrypt do uzupełnienia website_url dla firm w kategorii Banki.
 * Uruchom: node update_bank_urls.js
 */

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

// Mapowanie slug -> website_url
const BANK_URLS = {
  "Alior Bank": "https://www.aliorbank.pl",
  "Inbank": "https://www.inbank.pl",
  "Citi Handlowy": "https://www.citibank.pl",
  "Millennium": "https://www.bankmillennium.pl",
  "BOŚ": "https://www.bosbank.pl",
  "Bank Pocztowy": "https://www.pocztowy.pl",
  "Pekao": "https://www.pekao.com.pl",
  "BPS": "https://www.bankbps.pl",
  "BFF": "https://www.bfrpolska.pl",
  "BNP Paribas": "https://www.bnpparibas.pl",
  "Credit Agricole": "https://www.credit-agricole.pl",
  "ING": "https://www.ing.pl",
  "mBank": "https://www.mbank.pl",
  "Nest Bank": "https://www.nestbank.pl",
  "Plus Bank": "https://www.plusbank.pl",
  "PKO BP": "https://www.pkobp.pl",
  "Raiffeisen": "https://www.raiffeisen.pl",
  "Revolut": "https://www.revolut.com",
  "Santander": "https://www.santander.pl",
  "SGB": "https://www.sgbbank.com.pl",
  "Toyota Bank": "https://www.toyotabank.pl",
  "UniCredit": "https://www.unicreditgroup.eu",
  "VeloBank": "https://www.velobank.pl",
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
  console.log("=== Aktualizacja website_url dla kategorii Banki ===\n");

  // 1. Pobierz wszystkie firmy z kategorii Banki
  const CATEGORY_ID = "14bdc072-77bb-48ad-aa99-79478dab3cf1";
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url&category_id=eq.${CATEGORY_ID}&order=name`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const companies = await res.json();
  console.log(`Znaleziono ${companies.length} firm w kategorii Banki.\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const company of companies) {
    const url = BANK_URLS[company.slug];

    if (!url) {
      console.log(`  ⚠  ${company.slug} — brak URL w mapowaniu!`);
      notFound++;
      continue;
    }

    if (company.website_url) {
      console.log(`  ⏭  ${company.slug} — już ma URL: ${company.website_url}`);
      skipped++;
      continue;
    }

    const ok = await supabasePatch(company.id, url);
    if (ok) {
      console.log(`  ✅ ${company.slug} -> ${url}`);
      updated++;
    } else {
      console.log(`  ❌ ${company.slug} — BŁĄD aktualizacji!`);
    }
  }

  console.log(`\n=== Podsumowanie ===`);
  console.log(`  Zaktualizowano: ${updated}`);
  console.log(`  Pominięto (już miały URL): ${skipped}`);
  console.log(`  Brak w mapowaniu: ${notFound}`);
}

main().catch(console.error);
