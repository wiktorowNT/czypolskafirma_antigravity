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

  if (categories.length > 0) {
    const categoryId = categories[0].id;

    // Delete companies in this category
    const deleteCompaniesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?category_id=eq.${categoryId}`,
      {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Prefer: "return=representation",
        },
      }
    );
    
    if (deleteCompaniesRes.ok) {
        const deletedCompanies = await deleteCompaniesRes.json();
        console.log(`Deleted ${deletedCompanies.length} companies.`);
    } else {
        console.error("Failed to delete companies:", await deleteCompaniesRes.text());
        return;
    }

    // Delete the category itself
    const deleteCategoryRes = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?id=eq.${categoryId}`,
      {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Prefer: "return=representation",
        },
      }
    );

    if (deleteCategoryRes.ok) {
        const deletedCategory = await deleteCategoryRes.json();
        console.log(`Deleted category: ${deletedCategory[0].name}`);
    } else {
        console.error("Failed to delete category:", await deleteCategoryRes.text());
    }

  } else {
    console.log("Category 'chemia' not found.");
  }
}

main().catch(console.error);
