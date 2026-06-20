const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zquselhxriiltdvojzwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdXNlbGh4cmlpbHRkdm9qend2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzM1MDksImV4cCI6MjA5NTAwOTUwOX0.VYKkelrpXW47Bzd9PiTVSiaCGV00ANp3nS73SSzeM-Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const userId = '389d99c5-c825-4d7e-b735-a3569c3a0ebc'; // active user id

  console.log('--- TESTING ANON SELECT ---');
  const { data: inv, error: selectError } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('user_id', userId);

  if (selectError) {
    console.error('Select error:', selectError);
  } else {
    console.log('Select successful:', inv);
  }

  console.log('\n--- TESTING ANON UPDATE ---');
  const { data: updateData, error: updateError } = await supabase
    .from('user_inventory')
    .update({ quantity: 10 })
    .eq('user_id', userId)
    .eq('item_id', 'strawberry')
    .select();

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Update successful:', updateData);
  }
}

main();
