import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=slug,category_slug,ownership_description`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const companies = await res.json();
  
  const empty = companies.filter(c => !c.ownership_description || c.ownership_description.trim() === '');
  
  console.log('| Slug | Category Slug |');
  console.log('|---|---|');
  empty.forEach(c => {
    console.log(`| ${c.slug} | ${c.category_slug} |`);
  });
}

main().catch(console.error);
