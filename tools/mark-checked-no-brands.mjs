// Marks companies that were reviewed but have no confident consumer brands,
// so they're excluded from future `.is('brands', null)` fetches.
// Usage: node tools/mark-checked-no-brands.mjs <chunkFile.json> <resultFile.json>
// chunkFile: full list of companies given to an agent (array of {id,...})
// resultFile: subset that got real brand updates (array of {id, brands})
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const chunkPath = process.argv[2];
const resultPath = process.argv[3];
if (!chunkPath || !resultPath) {
  console.error('Usage: node tools/mark-checked-no-brands.mjs <chunkFile.json> <resultFile.json>');
  process.exit(1);
}

const chunk = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
const result = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : [];
const updatedIds = new Set(result.map((r) => r.id));
const skippedIds = chunk.map((c) => c.id).filter((id) => !updatedIds.has(id));

let ok = 0;
let failed = 0;
for (const id of skippedIds) {
  const { error } = await supabase.from('companies').update({ brands: [] }).eq('id', id);
  if (error) {
    console.error(`FAILED ${id}:`, error.message);
    failed++;
  } else {
    ok++;
  }
}
console.log(`Marked ${ok} companies as checked/no-brands (${failed} failed) from ${chunkPath}`);
