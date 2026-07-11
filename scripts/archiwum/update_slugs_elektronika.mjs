import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const slugMap = {
  "APPLE POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "apple",
  "\"ASUS POLSKA\" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "asus",
  "FIBAR GROUP SPÓŁKA AKCYJNA": "fibaro",
  "HUAWEI POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "huawei",
  "LECHPOL ELECTRONICS LESZEK SPÓŁKA KOMANDYTOWA": "lechpol",
  "\"LG ELECTRONICS POLSKA\" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "lg",
  "PANASONIC MARKETING EUROPE GMBH (SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ) ODDZIAŁ W POLSCE": "panasonic",
  "\"SATEL\" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "satel",
  "SONEL SPÓŁKA AKCYJNA": "sonel",
  "Brak w MF (NIP: 1080022836)": "sony",
  "TCL OPERATIONS POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "tcl",
  "Brak w MF (NIP: 8960000492)": "whirlpool",
  "WILK ELEKTRONIK SPÓŁKA AKCYJNA": "wilk-elektronik",
  "XIAOMI TECHNOLOGY (POLSKA) SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "xiaomi",
  "ZAMEL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "zamel",
  "ABB SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "abb",
  "\"AMICA SPÓŁKA AKCYJNA\"": "amica",
  "'APATOR' SPÓŁKA AKCYJNA": "apator",
  "BEKO SPÓŁKA AKCYJNA": "beko",
  "BSH SPRZĘT GOSPODARSTWA DOMOWEGO SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "bsh",
  "DELL SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "dell",
  "'ELECTROLUX POLAND' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "electrolux",
  "GARMIN POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "garmin",
  "HISENSE POLAND SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "hisense",
  "HP INC POLSKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "hp",
  "KONTAKT - SIMON SPÓŁKA AKCYJNA": "kontakt-simon",
  "LENOVO TECHNOLOGY B.V. SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ ODDZIAŁ W POLSCE": "lenovo",
  "MANTA SPÓŁKA AKCYJNA": "manta",
  "ADAM DUDEK": "adam-dudek",
  "'SAMSUNG ELECTRONICS POLSKA' SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "samsung",
  "\"SCHNEIDER ELECTRIC POLSKA\" SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "schneider-electric",
  "KOMPUTRONIK SPÓŁKA AKCYJNA": "komputronik",
  "MORELE.NET SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ": "morele"
};

async function main() {
  const data = JSON.parse(fs.readFileSync('scratch/elektronika_companies.json', 'utf8'));

  let updatedCount = 0;
  for (const company of data) {
    if (company.name && slugMap[company.name]) {
      const properSlug = slugMap[company.name];
      if (company.slug !== properSlug) {
        // Zaktualizuj
        const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${company.id}`, {
          method: "PATCH",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({ slug: properSlug })
        });
        if (res.ok) {
          console.log(`✅ Zaktualizowano ${company.slug} -> ${properSlug}`);
          updatedCount++;
        } else {
          console.log(`❌ BŁĄD przy aktualizacji ${company.slug}: `, await res.text());
        }
      }
    }
  }
  
  console.log(`Zakończono. Zaktualizowano ${updatedCount} rekordów.`);
}

main().catch(console.error);
