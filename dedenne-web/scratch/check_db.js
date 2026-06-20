const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zquselhxriiltdvojzwv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdXNlbGh4cmlpbHRkdm9qend2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQzMzUwOSwiZXhwIjoyMDk1MDA5NTA5fQ.uNa2qNWZk4dMpFrSuhmM7PvAHTK5zupDaTGl3rOV-zU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('--- USER INVENTORY ---');
  const { data: inventory, error: invError } = await supabase
    .from('user_inventory')
    .select('*');

  if (invError) {
    console.error('Error fetching inventory:', invError);
  } else {
    console.log(JSON.stringify(inventory, null, 2));
  }

  console.log('--- USER PETS ---');
  const { data: pets, error } = await supabase
    .from('user_pets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pets:', error);
    return;
  }

  console.log('Fetched pets count:', pets.length);
  for (const pet of pets) {
    console.log(`Pet ID: ${pet.id}, User ID: ${pet.user_id}`);
    console.log('Config:', JSON.stringify(pet.config, null, 2));
    console.log('------------------------------------');
  }
}

main();
