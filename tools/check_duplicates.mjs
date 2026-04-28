import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug`,
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
  
  const namesCount = {};
  const slugsCount = {};
  
  for (const company of companies) {
    const nameLower = company.name.toLowerCase().trim();
    if (!namesCount[nameLower]) namesCount[nameLower] = [];
    namesCount[nameLower].push(company);
    
    const slug = company.slug;
    if (!slugsCount[slug]) slugsCount[slug] = [];
    slugsCount[slug].push(company);
  }
  
  const duplicateNames = Object.entries(namesCount)
    .filter(([name, arr]) => name !== "" && arr.length > 1)
    .map(([, arr]) => arr);
    
  const duplicateSlugs = Object.entries(slugsCount)
    .filter(([slug, arr]) => slug !== "" && arr.length > 1)
    .map(([, arr]) => arr);
  
  console.log(`Found ${duplicateNames.length} duplicate names.`);
  if (duplicateNames.length > 0) {
    console.log("Duplicate names:");
    console.log(JSON.stringify(duplicateNames.map(arr => arr.map(c => c.name)), null, 2));
  }
  
  console.log(`Found ${duplicateSlugs.length} duplicate slugs.`);
  if (duplicateSlugs.length > 0) {
    console.log("Duplicate slugs:");
    console.log(JSON.stringify(duplicateSlugs.map(arr => arr.map(c => c.slug)), null, 2));
  }
}

main().catch(console.error);
