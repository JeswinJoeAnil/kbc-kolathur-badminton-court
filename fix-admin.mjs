import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAdmin() {
  console.log('Updating jeswinjoeanil5@gmail.com to admin role...');
  
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', 'jeswinjoeanil5@gmail.com')
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Updated:', data);
  }
}

fixAdmin();
