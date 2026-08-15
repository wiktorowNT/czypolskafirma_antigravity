// Reads a JSON file of brand updates and writes them to Supabase.
// Usage: node tools/apply-brands-json.mjs path/to/updates.json
//
// Input JSON shape:
// [
//   { "id": "uuid", "brands": [ { "name": "Tymbark", "domain": "tymbark.com" }, { "name": "Kubuś" } ] }
// ]
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node tools/apply-brands-json.mjs <updates.json>');
  process.exit(1);
}

const updates = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let ok = 0;
let failed = 0;

for (const item of updates) {
  if (!item.id || !Array.isArray(item.brands) || item.brands.length === 0) {
    console.error('Skipping invalid entry:', JSON.stringify(item));
    failed++;
    continue;
  }
  const brand_aliases = item.brands.map((b) => b.name).join(', ');
  const { error } = await supabase
    .from('companies')
    .update({ brand_aliases, brands: item.brands })
    .eq('id', item.id);
  if (error) {
    console.error(`FAILED ${item.id}:`, error.message);
    failed++;
  } else {
    console.log(`OK ${item.id} -> ${brand_aliases}`);
    ok++;
  }
}

console.log(`\nDone. Updated: ${ok}, Failed: ${failed}`);
