import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,registry_url,nip`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) {
    console.error("Failed to fetch companies:", await res.text());
    return;
  }
  const companies = await res.json();
  
  const toUpdate = companies.filter(c => !c.registry_url || c.registry_url.trim() === '');
  console.log(`Found ${toUpdate.length} companies with empty registry_url.`);
  
  fs.writeFileSync('missing_registry_urls.json', JSON.stringify(toUpdate, null, 2));
  console.log('Saved to missing_registry_urls.json');
}

main().catch(console.error);
