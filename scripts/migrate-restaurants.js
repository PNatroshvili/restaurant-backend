/**
 * Migrate restaurants from old Render backend → new cPanel backend
 *
 * Run AFTER the cPanel deployment completes:
 *   node scripts/migrate-restaurants.js
 */

const OLD_API = 'https://restaurant-backend-bm4s.onrender.com/v1';
const NEW_API = 'https://api.skup.ge/v1';
const ADMIN_EMAIL = 'admin@restaurant.ge';
const ADMIN_PASS = 'admin123';

async function run() {
  // 1. Login to new backend
  console.log('Logging in to new backend...');
  const loginRes = await fetch(`${NEW_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  if (!loginRes.ok) {
    const text = await loginRes.text();
    console.error('Login failed:', loginRes.status, text);
    process.exit(1);
  }
  const { access_token } = await loginRes.json();
  console.log('Logged in OK');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${access_token}`,
  };

  // 2. Fetch existing restaurants from new backend (to avoid duplicates)
  const existingRes = await fetch(`${NEW_API}/admin/restaurants?limit=200`, { headers });
  const existingData = await existingRes.json();
  const existingNames = new Set((existingData.data || []).map(r => r.name.trim().toLowerCase()));
  console.log(`New DB already has ${existingNames.size} restaurants`);

  // 3. Fetch all restaurants from old backend (public endpoint, no auth needed)
  console.log('Fetching restaurants from old backend...');
  let page = 1;
  const allOld = [];
  while (true) {
    const res = await fetch(`${OLD_API}/restaurants?limit=50&page=${page}`);
    if (!res.ok) break;
    const data = await res.json();
    const items = data.data || [];
    if (!items.length) break;
    allOld.push(...items);
    if (allOld.length >= (data.total || 0)) break;
    page++;
  }
  console.log(`Found ${allOld.length} restaurants on old backend`);

  // 4. Also fetch restaurants in other statuses via admin on old backend (if accessible)
  // Note: old backend admin may not respond, so we skip and rely on public endpoint

  // 5. Create each restaurant in new backend
  let created = 0, skipped = 0, failed = 0;
  for (const r of allOld) {
    const nameKey = r.name.trim().toLowerCase();
    if (existingNames.has(nameKey)) {
      console.log(`  SKIP (already exists): ${r.name}`);
      skipped++;
      continue;
    }

    const payload = {
      name: r.name,
      address: r.address,
      city: r.city || 'თბილისი',
      district: r.district || undefined,
      phone: r.phone || undefined,
      description: r.description || undefined,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      cuisineId: r.cuisine?.id || undefined,
    };

    // Validate coordinates
    if (!payload.latitude || !payload.longitude) {
      console.log(`  SKIP (no coordinates): ${r.name}`);
      skipped++;
      continue;
    }

    const createRes = await fetch(`${NEW_API}/admin/restaurants`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (createRes.ok) {
      console.log(`  CREATED: ${r.name}`);
      created++;
    } else {
      const err = await createRes.text();
      console.log(`  FAILED: ${r.name} — ${createRes.status} ${err}`);
      failed++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`);
}

run().catch(err => { console.error(err); process.exit(1); });
