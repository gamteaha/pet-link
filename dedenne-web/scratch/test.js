const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zquselhxriiltdvojzwv.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdXNlbGh4cmlpbHRkdm9qend2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQzMzUwOSwiZXhwIjoyMDk1MDA5NTA5fQ.uNa2qNWZk4dMpFrSuhmM7PvAHTK5zupDaTGl3rOV-zU";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdXNlbGh4cmlpbHRkdm9qend2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzM1MDksImV4cCI6MjA5NTAwOTUwOX0.VYKkelrpXW47Bzd9PiTVSiaCGV00ANp3nS73SSzeM-Q";

const adminClient = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function check() {
  const { data: adminOrders, error: adminError } = await adminClient.from('orders').select('id');
  console.log("Admin can see orders:", adminOrders?.length, "Error:", adminError);

  const { data: anonOrders, error: anonError } = await anonClient.from('orders').select('id');
  console.log("Anon can see orders:", anonOrders?.length, "Error:", anonError);
  
  const { data: anonProfiles, error: anonError2 } = await anonClient.from('profiles').select('id');
  console.log("Anon can see profiles:", anonProfiles?.length, "Error:", anonError2);
}

check();
