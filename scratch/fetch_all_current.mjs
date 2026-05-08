// Fetch ALL current company data from Supabase (post-updates)
import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  // Supabase paginates at 1000 by default, but let's be explicit
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,slug,name,business_description,ownership_description,country_code&order=slug.asc&limit=1000`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch:", res.status, await res.text());
    process.exit(1);
  }

  const companies = await res.json();
  console.log(`Fetched ${companies.length} companies from Supabase.`);
  
  fs.writeFileSync('scratch/current_companies.json', JSON.stringify(companies, null, 2), 'utf8');
  console.log("Saved to scratch/current_companies.json");
}

main().catch(console.error);
