import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const URLS_MAP = {
  "IKEA (Sklepy)": "https://www.ikea.com/pl/pl/",
  "Black Red White": "https://www.brw.pl/",
  "Meblik": "https://www.meblik.pl/",
  "Forte": "https://www.forte.com.pl/",
  "Nowy Styl": "https://pl.nowystyl.com/",
  "Meble Vox": "https://www.vox.pl/",
  "Szynaka Meble": "https://www.szynaka.pl/",
  "Meble Wójcik": "https://www.meblewojcik.com.pl/",
  "Bodzio": "https://www.bodzio.pl/",
  "Kler": "https://www.kler.eu/",
  "Paged Meble": "https://pagedmeble.pl/",
  "Gala Collezione": "https://www.galameble.com/",
  "Com40": "https://com40.pl/",
  "Correct": "https://com40.pl/",
  "KAM Meble": "https://www.meblekam.pl/",
  "Bydgoskie Meble": "https://bydgoskiemeble.pl/",
  "Wajnert": "https://www.wajnert.pl/",
  "Polipol": "https://polipol.pl/",
  "Wersal": "https://wersal.pl/",
  "Halupczok": "https://halupczok.com.pl/",
  "Benix": "https://benix.pl/",
  "Sits": "https://www.sits.eu/pl",
  "Fameg": "https://fameg.pl/",
  "WFM Kuchnie": "https://www.wfm-kuchnie.pl/",
  "Profim": "https://www.profim.pl/",
  "MDD": "https://mdd.pl/",
  "Bejot": "https://bejot.eu/",
  "Balma": "https://balma.pl/",
  "Noti": "https://noti.pl/",
  "Halmar": "https://halmar.pl/",
  "Signal": "https://www.signal.pl/",
  "Taranko": "https://mebletaranko.pl/",
  "Helvetia": "https://www.helvetia-meble.pl/",
  "Hilding Anders": "https://hilding.pl/",
  "Janpol": "https://janpol.pl/",
  "MK Foam Koło": "https://mkfoam.pl/",
  "Dywilan": "https://dywilan.pl/",
  "Agnella": "https://agnella.pl/",
  "Dekoria": "https://www.dekoria.pl/",
  "BoConcept": "https://www.boconcept.com/pl-pl/",
  "Kinnarps": "https://www.kinnarps.pl/",
  "366 Concept": "https://366concept.com/pl",
  "Comforty": "https://comforty.pl/"
};

async function supabasePatch(id, websiteUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ website_url: websiteUrl }),
  });
  return res.ok;
}

async function main() {
  console.log("=== Aktualizacja brakujących website_url (Meble) ===\n");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const companies = await res.json();
  
  const toUpdate = companies.filter(c => !c.website_url || c.website_url.trim() === '');
  console.log(`Znaleziono ${toUpdate.length} firm z pustym website_url.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const company of toUpdate) {
    const url = URLS_MAP[company.slug];
    if (url) {
      const ok = await supabasePatch(company.id, url);
      if (ok) {
         console.log(`✅ Zaktualizowano ${company.slug} -> ${url}`);
         updatedCount++;
      } else {
         console.log(`❌ BŁĄD aktualizacji: ${company.slug}`);
      }
    } else {
      console.log(`⏭ Pominięto ${company.slug} (brak w mapie URLi)`);
      skippedCount++;
    }
  }

  console.log("\n=== Podsumowanie website_url ===");
  console.log(`Zaktualizowano: ${updatedCount}`);
  console.log(`Pominięto (brak URL w mapie): ${skippedCount}`);
}

main().catch(console.error);
