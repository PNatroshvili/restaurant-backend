// import-google-restaurants.js
// Uses old Places API (maps.googleapis.com) — confirmed working
// Run: /home/skupge/nodevenv/api.skup.ge/22/bin/node scripts/import-google-restaurants.js

const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

const KEY = 'AIzaSyDG_JMpTL4Toeb5lSeDXXwaFMyAxg239xE';
const TARGET = 500;
const MAPS = 'https://maps.googleapis.com/maps/api/place';

const DB = {
  host: 'localhost',
  user: 'skupge_restaurantapp',
  password: 'Shibla77!',
  database: 'skupge_restaurantapp',
};

const TYPE_MAP = {
  restaurant: 'georgian',
  cafe: 'cafe',
  bar: 'pub',
  bakery: 'cafe',
  meal_takeaway: 'fastfood',
  meal_delivery: 'fastfood',
};

const QUERIES = [
  'restaurant Tbilisi Georgia',
  'cafe Tbilisi Georgia',
  'Georgian restaurant Tbilisi',
  'bar Tbilisi Georgia',
  'restaurant Vake Tbilisi',
  'restaurant Old Tbilisi',
  'restaurant Saburtalo Tbilisi',
  'restaurant Vera Tbilisi',
  'restaurant Avlabari Tbilisi',
  'restaurant Isani Tbilisi',
  'restaurant Gldani Tbilisi',
  'restaurant Didube Tbilisi',
  'khinkali Tbilisi',
  'sushi Tbilisi',
  'pizza Tbilisi',
  'steak house Tbilisi',
  'restaurant Mtatsminda Tbilisi',
  'restaurant Ortachala Tbilisi',
  'restaurant Marjanishvili Tbilisi',
  'restaurant Rustaveli Tbilisi',
  'wine bar Tbilisi',
  'restaurant Nadzaladevi Tbilisi',
  'restaurant Gori Street Tbilisi',
  'restaurant Mushtaidi Tbilisi',
  'restaurant Chughureti Tbilisi',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function textSearch(query, pageToken = null) {
  let url = `${MAPS}/textsearch/json?query=${encodeURIComponent(query)}&language=ka&region=ge&key=${KEY}`;
  if (pageToken) url += `&pagetoken=${pageToken}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`TextSearch failed: ${data.status} — ${data.error_message || ''}`);
  }
  return data;
}

async function placeDetails(placeId) {
  const fields = 'name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,types,photos,opening_hours,editorial_summary,reviews';
  const url = `${MAPS}/details/json?place_id=${placeId}&fields=${fields}&language=ka&key=${KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(`Details failed: ${data.status}`);
  return data.result;
}

async function getPhotoUrl(photoRef) {
  try {
    const url = `${MAPS}/photo?maxwidth=1200&photoreference=${photoRef}&key=${KEY}`;
    const res = await fetch(url, { redirect: 'manual' });
    return res.headers.get('location') || null;
  } catch { return null; }
}

function parseHours(periods) {
  const map = {};
  for (const p of (periods || [])) {
    const day = p.open?.day ?? 0;
    const openTime = p.open?.time ?? '1000';
    const closeTime = p.close?.time ?? '2300';
    map[day] = {
      open: `${openTime.slice(0, 2)}:${openTime.slice(2)}`,
      close: `${closeTime.slice(0, 2)}:${closeTime.slice(2)}`,
    };
  }
  return map;
}

function mapCuisine(types, cuisineMap) {
  const priority = ['cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery', 'restaurant'];
  for (const t of (types || [])) {
    if (TYPE_MAP[t] && cuisineMap[TYPE_MAP[t]]) return cuisineMap[TYPE_MAP[t]];
  }
  return cuisineMap['georgian'];
}

async function main() {
  const db = await mysql.createConnection(DB);
  console.log('Connected to MySQL');

  const [cuisineRows] = await db.query('SELECT id, slug FROM cuisines');
  const cuisineMap = {};
  for (const c of cuisineRows) cuisineMap[c.slug] = c.id;
  console.log(`Loaded ${cuisineRows.length} cuisines`);

  const [[adminRow]] = await db.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  const adminId = adminRow.id;

  const [existing] = await db.query('SELECT name FROM restaurants');
  const existingNames = new Set(existing.map(r => r.name));
  console.log(`${existingNames.size} restaurants already in DB`);

  const seenIds = new Set();
  let total = 0;

  for (const query of QUERIES) {
    if (total >= TARGET) break;

    let pageToken = null;
    let page = 0;

    do {
      console.log(`\nSearching: "${query}" (page ${page + 1})`);
      let searchData;
      try {
        searchData = await textSearch(query, pageToken);
      } catch (e) {
        console.error(`Search failed: ${e.message}`);
        break;
      }

      const results = searchData.results || [];
      console.log(`Got ${results.length} results`);

      for (const r of results) {
        if (total >= TARGET) break;
        if (seenIds.has(r.place_id)) continue;
        seenIds.add(r.place_id);
        if (existingNames.has(r.name)) continue;

        // Get full details
        let place;
        try {
          place = await placeDetails(r.place_id);
          await sleep(100);
        } catch (e) {
          console.error(`Details failed for ${r.name}: ${e.message}`);
          continue;
        }

        const name = place.name;
        if (!name || existingNames.has(name)) continue;
        existingNames.add(name);

        const restaurantId = randomUUID();
        const lat = place.geometry?.location?.lat ?? 41.7151;
        const lng = place.geometry?.location?.lng ?? 44.8271;
        const address = place.formatted_address ?? 'თბილისი';
        const phone = place.formatted_phone_number ?? null;
        const description = place.editorial_summary?.overview ?? null;
        const ratingAvg = place.rating ?? 0;
        const reviewsCount = place.user_ratings_total ?? 0;
        const cuisineId = mapCuisine(place.types, cuisineMap);

        await db.query(
          `INSERT INTO restaurants (id, owner_id, name, description, address, city, district, latitude, longitude, phone, rating_avg, reviews_count, status, cuisine_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'თბილისი', 'თბილისი', ?, ?, ?, ?, ?, 'approved', ?, NOW(), NOW())`,
          [restaurantId, adminId, name, description, address, lat, lng, phone, ratingAvg, reviewsCount, cuisineId]
        );

        // Photos (up to 5)
        const photos = (place.photos || []).slice(0, 5);
        for (let i = 0; i < photos.length; i++) {
          const url = await getPhotoUrl(photos[i].photo_reference);
          if (url) {
            await db.query(
              `INSERT INTO restaurant_photos (id, restaurant_id, url, sort_order, is_cover) VALUES (?, ?, ?, ?, ?)`,
              [randomUUID(), restaurantId, url, i, i === 0 ? 1 : 0]
            );
          }
          await sleep(80);
        }

        // Working hours
        const hoursMap = parseHours(place.opening_hours?.periods);
        for (let day = 0; day < 7; day++) {
          if (hoursMap[day]) {
            await db.query(
              `INSERT INTO working_hours (id, restaurant_id, day, open, close, is_closed) VALUES (?, ?, ?, ?, ?, 0)`,
              [randomUUID(), restaurantId, day, hoursMap[day].open, hoursMap[day].close]
            );
          } else {
            await db.query(
              `INSERT INTO working_hours (id, restaurant_id, day, open, close, is_closed) VALUES (?, ?, ?, '10:00', '23:00', 0)`,
              [randomUUID(), restaurantId, day]
            );
          }
        }

        // Reviews (up to 5) — create real user per reviewer
        for (const rev of (place.reviews || []).slice(0, 5)) {
          if (!rev.rating) continue;
          const authorUrl = rev.author_url || '';
          const authorName = rev.author_name || 'Anonymous';
          const uniqueKey = Math.abs(authorUrl.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0)).toString(36).slice(0, 8);
          const email = `reviewer_${uniqueKey}@google.reviews`;
          let userId = adminId;
          try {
            const [[existing]] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
            if (existing) {
              userId = existing.id;
            } else {
              const parts = authorName.trim().split(/\s+/);
              const newId = randomUUID();
              await db.query(
                `INSERT INTO users (id, name, last_name, email, password_hash, role, status, email_verified, avatar)
                 VALUES (?, ?, ?, ?, '$2b$10$placeholder_imported_user_hash', 'user', 'active', 1, ?)`,
                [newId, parts[0], parts.slice(1).join(' ') || null, email, rev.profile_photo_url || null]
              );
              userId = newId;
            }
          } catch { userId = adminId; }
          await db.query(
            `INSERT INTO reviews (id, user_id, restaurant_id, rating, comment, status, created_at) VALUES (?, ?, ?, ?, ?, 'approved', NOW())`,
            [randomUUID(), userId, restaurantId, Math.round(rev.rating), rev.text ?? null]
          );
        }

        total++;
        process.stdout.write(`\r[${total}/${TARGET}] ${name.substring(0, 55)}`);
      }

      pageToken = searchData.next_page_token;
      page++;
      if (pageToken) await sleep(2500); // required delay for next_page_token
    } while (pageToken && page < 3 && total < TARGET);

    await sleep(300);
  }

  console.log(`\n\nDone! Inserted ${total} restaurants.`);
  await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
