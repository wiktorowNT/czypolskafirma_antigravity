async function main() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
    };

    const companiesUrl = `${SUPABASE_URL}/rest/v1/companies?select=id,name,country_code,siedziba_pl,vat_czynny,website_url&order=name.asc`;
    const companiesRes = await fetch(companiesUrl, { headers });

    if (!companiesRes.ok) {
        const text = await companiesRes.text();
        console.error("Fetch error:", companiesRes.status, text);
    } else {
        const data = await companiesRes.json();
        console.log("Success! Found:", data.length);
        console.log("First item:", data[0]);
    }
}

main();
