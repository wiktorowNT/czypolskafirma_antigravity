import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const limit = parseInt(process.argv[2] || '100', 10);
const offset = parseInt(process.argv[3] || '0', 10);

const { data, error } = await supabase
  .from('companies')
  .select('id,slug,name')
  .is('brands', null)
  .order('name', { ascending: true })
  .range(offset, offset + limit - 1);

if (error) {
  console.error(error);
  process.exit(1);
}

const outPath = process.argv[4] || 'batch.json';
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`Wrote ${data.length} companies to ${outPath}`);
