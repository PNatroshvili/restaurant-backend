// fix-review-authors.js
// Deletes all admin-authored reviews, re-fetches real reviews from Google,
// creates a user record per unique reviewer, re-inserts with real authors.
// Run: /home/skupge/nodevenv/api.skup.ge/22/bin/node scripts/fix-review-authors.js

const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

const KEY = 'AIzaSyDG_JMpTL4Toeb5lSeDXXwaFMyAxg239xE';
const MAPS = 'https://maps.googleapis.com/maps/api/place';

const DB = {
  host: 'localhost',
  user: 'skupge_restaurantapp',
  password: 'Shibla77!',
  database: 'skupge_restaurantapp',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchPlaceId(name, address) {
  const query = `${name} ${address || 'Tbilisi'}`;
  const url = `${MAPS}/textsearch/json?query=${encodeURIComponent(query)}&language=en&region=ge&key=${KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;
  return data.results[0].place_id;
}

async function getReviews(placeId) {
  const url = `${MAPS}/details/json?place_id=${placeId}&fields=reviews&language=en&key=${KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK') return [];
  return data.result?.reviews || [];
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 30);
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 8);
}

async function getOrCreateUser(db, review, adminId) {
  const authorUrl = review.author_url || '';
  const authorName = review.author_name || 'Anonymous';
  const avatar = review.profile_photo_url || null;

  // Use hash of author_url as unique key; fall back to name hash
  const uniqueKey = hashStr(authorUrl || authorName);
  const email = `reviewer_${uniqueKey}@google.reviews`;

  const [[existing]] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing) return existing.id;

  // Parse first/last name
  const parts = authorName.trim().split(/\s+/);
  const firstName = parts[0] || authorName;
  const lastName = parts.slice(1).join(' ') || null;

  const userId = randomUUID();
  await db.query(
    `INSERT INTO users (id, name, last_name, email, password_hash, role, status, email_verified, avatar)
     VALUES (?, ?, ?, ?, ?, 'user', 'active', 1, ?)`,
    [userId, firstName, lastName, email, '$2b$10$placeholder_imported_user_hash', avatar]
  );
  return userId;
}

async function main() {
  const db = await mysql.createConnection(DB);
  console.log('Connected to MySQL');

  // Get admin user id
  const [[adminRow]] = await db.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  const adminId = adminRow.id;

  // Delete all admin-authored reviews
  const [delResult] = await db.query('DELETE FROM reviews WHERE user_id = ?', [adminId]);
  console.log(`Deleted ${delResult.affectedRows} admin-authored reviews`);

  // Get all restaurants
  const [restaurants] = await db.query('SELECT id, name, address FROM restaurants ORDER BY created_at');
  console.log(`Processing ${restaurants.length} restaurants...\n`);

  let totalReviews = 0;
  let processed = 0;

  for (const rest of restaurants) {
    processed++;
    process.stdout.write(`\r[${processed}/${restaurants.length}] ${rest.name.substring(0, 45)}`);

    let placeId;
    try {
      placeId = await searchPlaceId(rest.name, rest.address);
      await sleep(120);
    } catch (e) {
      continue;
    }

    if (!placeId) continue;

    let reviews;
    try {
      reviews = await getReviews(placeId);
      await sleep(120);
    } catch (e) {
      continue;
    }

    for (const rev of reviews.slice(0, 5)) {
      if (!rev.rating) continue;
      try {
        const userId = await getOrCreateUser(db, rev, adminId);
        await db.query(
          `INSERT INTO reviews (id, user_id, restaurant_id, rating, comment, status, created_at)
           VALUES (?, ?, ?, ?, ?, 'approved', NOW())`,
          [randomUUID(), userId, rest.id, Math.round(rev.rating), rev.text || null]
        );
        totalReviews++;
      } catch (e) {
        // skip duplicate email conflicts silently
      }
    }
  }

  console.log(`\n\nDone! Inserted ${totalReviews} reviews with real authors.`);
  await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
