async function test() {
  const payload = {
    petId: '1781943347583',
    petData: {
      db_id: 'f3a3d72c-cada-4634-9a8e-0764ecbb0141',
      downloadedAt: Date.now(),
      inventory: { bread: 0, soap: 0, towel: 0, strawberry: 0 },
      affection: 10,
      level: 2,
      last_pat_date: '2026-06-20'
    },
    isStartup: true
  };

  console.log('--- TEST 1: isStartup: true ---');
  let res = await fetch('http://localhost:3000/api/sync-pet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  let data = await res.json();
  console.log('Test 1 Response:', JSON.stringify(data, null, 2));

  console.log('\n--- TEST 2: isStartup: false ---');
  payload.isStartup = false;
  payload.petData.inventory = { bread: 5, soap: 5, towel: 5, strawberry: 5 };
  res = await fetch('http://localhost:3000/api/sync-pet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  data = await res.json();
  console.log('Test 2 Response:', JSON.stringify(data, null, 2));
}

test().catch(console.error);
