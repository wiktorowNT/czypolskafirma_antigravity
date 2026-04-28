const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

async function main() {
  const resCat = await fetch(
    `${SUPABASE_URL}/rest/v1/categories?select=*&slug=eq.chemia`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const categories = await resCat.json();
  console.log("Categories found:", categories);

  if (categories.length > 0) {
    const categoryId = categories[0].id;
    const resComp = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=*&category_id=eq.${categoryId}`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const companies = await resComp.json();
    console.log(`Companies in category (${companies.length}):`, companies.map(c => c.slug));
  }
}

main().catch(console.error);
