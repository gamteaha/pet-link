const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: logs, error: errLogs } = await supabase.from('orders').select('*', { count: 'exact' });
  const { data: oi, error: errOi } = await supabase.from('order_items').select('*');
  console.log('Orders count:', logs?.length, errLogs);
  console.log('Order Items:', oi, errOi);
  
  // Test the inner join
  const { data: joinData, error: joinErr } = await supabase
    .from("order_items")
    .select(`
      item_id,
      item_name,
      price,
      orders!inner(status),
      items(category)
    `)
    .eq("orders.status", "completed");
  console.log('Join Data:', joinData?.length, joinErr);
}
main();
