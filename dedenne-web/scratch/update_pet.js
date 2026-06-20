const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zquselhxriiltdvojzwv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdXNlbGh4cmlpbHRkdm9qend2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQzMzUwOSwiZXhwIjoyMDk1MDA5NTA5fQ.uNa2qNWZk4dMpFrSuhmM7PvAHTK5zupDaTGl3rOV-zU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const realDbId = 'f3a3d72c-cada-4634-9a8e-0764ecbb0141';
  
  // 1. Fetch current config
  const { data: pet, error: fetchError } = await supabase
    .from('user_pets')
    .select('config')
    .eq('id', realDbId)
    .single();

  if (fetchError) {
    console.error('Error fetching pet:', fetchError);
    return;
  }

  console.log('Current config:', JSON.stringify(pet.config, null, 2));

  // 2. Set inventory
  const newConfig = {
    ...pet.config,
    inventory: {
      bread: 2,
      soap: 3,
      towel: 4,
      strawberry: 9
    },
    updatedAt: Date.now()
  };

  // 3. Update DB
  const { error: updateError } = await supabase
    .from('user_pets')
    .update({ config: newConfig })
    .eq('id', realDbId);

  if (updateError) {
    console.error('Error updating config:', updateError);
  } else {
    console.log('Successfully updated config!');
  }
}

main();
