const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zquselhxriiltdvojzwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdXNlbGh4cmlpbHRkdm9qend2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzM1MDksImV4cCI6MjA5NTAwOTUwOX0.VYKkelrpXW47Bzd9PiTVSiaCGV00ANp3nS73SSzeM-Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const userId = '389d99c5-c825-4d7e-b735-a3569c3a0ebc';

  console.log('Subscribing to Realtime channel for user_id:', userId);
  
  const channel = supabase
    .channel(`test_user_inventory:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('RECEIVED EVENT:', payload);
        process.exit(0);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed successfully! Now waiting 3 seconds, then updating strawberry quantity to trigger event...');
        setTimeout(async () => {
          console.log('Updating strawberry quantity to 8...');
          const { data, error } = await supabase
            .from('user_inventory')
            .update({ quantity: 8, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('item_id', 'strawberry')
            .select();
            
          if (error) {
            console.error('Update failed:', error);
          } else {
            console.log('Update successful, waiting for Realtime event...');
          }
        }, 3000);
      }
    });
}

main();
