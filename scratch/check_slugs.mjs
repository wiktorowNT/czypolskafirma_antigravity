import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` }
  });
  const categories = await catRes.json();
  console.log(categories.map(c => c.slug));
  const elCat = categories.find(c => c.slug.includes('elektronika'));
  
  if (!elCat) {
    console.log("No elektronika category found in list above");
    return;
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?category_id=eq.${elCat.id}&select=id,name,slug`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) {
    console.log(await res.text());
    return;
  }
  const companies = await res.json();
  fs.writeFileSync('scratch/elektronika_companies.json', JSON.stringify(companies, null, 2));
  console.log("Saved to scratch/elektronika_companies.json");
}

main().catch(console.error);
