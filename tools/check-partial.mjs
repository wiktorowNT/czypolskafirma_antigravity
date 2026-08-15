import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const base = 'C:\\Users\\wikto\\AppData\\Local\\Temp\\claude\\C--Users-wikto-Desktop-czypolskafirma-11-11\\557e4094-cde0-4b27-8019-a1625e95ed94\\scratchpad\\brands-batch1';
for (const n of [3, 4]) {
  const items = JSON.parse(fs.readFileSync(`${base}\\wave3-result${n}.json`, 'utf8'));
  console.log(`--- wave3-result${n}.json (${items.length} items) ---`);
  for (const item of items) {
    const { data } = await supabase.from('companies').select('id,brands').eq('id', item.id).single();
    console.log(item.id, JSON.stringify(data?.brands));
  }
}
