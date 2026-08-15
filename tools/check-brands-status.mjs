import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const { count: total } = await supabase.from('companies').select('*', { count: 'exact', head: true });
const { count: withBrands } = await supabase.from('companies').select('*', { count: 'exact', head: true }).not('brands', 'is', null);
console.log('Total companies:', total);
console.log('With brands already set:', withBrands);

const { data: sample } = await supabase.from('companies').select('id,slug,name,brands').limit(3);
console.log(JSON.stringify(sample, null, 2));
