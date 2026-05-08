import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  console.log("Fetching all companies from Supabase...");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,business_description,ownership_description,country_code&order=name.asc`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  if (!res.ok) {
    throw new Error(`Failed to fetch companies: ${res.statusText}`);
  }

  const companies = await res.json();
  console.log(`Successfully fetched ${companies.length} companies.`);
  
  fs.writeFileSync('scratch/all_companies_audit.json', JSON.stringify(companies, null, 2));
  console.log("Data saved to scratch/all_companies_audit.json");
}

main().catch(console.error);
