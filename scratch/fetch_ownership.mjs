import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,ownership_description`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const companies = await res.json();
  
  // Filter for poorly formatted ownership descriptions
  // Looking for things like "Właściciel: CFE SA (Belgia)." or very short ones, or starting with generic tags
  const poorDescriptions = companies.filter(c => {
    if (!c.ownership_description) return false; // Ignore completely empty ones (maybe handled separately)
    
    const desc = c.ownership_description.trim();
    // Too short
    if (desc.length < 50) return true;
    
    // Starts with "Właściciel:" or contains brackets for country without much else
    if (desc.toLowerCase().startsWith('właściciel:')) return true;
    if (desc.toLowerCase().startsWith('kapitał:')) return true;
    
    return false;
  });

  console.log(`Found ${companies.length} total companies.`);
  console.log(`Found ${poorDescriptions.length} companies with poor ownership_description.`);
  
  fs.writeFileSync('scratch/poor_ownership.json', JSON.stringify(poorDescriptions, null, 2));
}

main().catch(console.error);
