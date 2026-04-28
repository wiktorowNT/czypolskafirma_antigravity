import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkChemia() {
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', 'chemia');

  console.log('Category:', category, catError);

  if (category && category.length > 0) {
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .eq('category_id', category[0].id);
      
    console.log(`Companies in chemia (${companies?.length || 0}):`);
    if (compError) console.error(compError);
  }
}

checkChemia();
