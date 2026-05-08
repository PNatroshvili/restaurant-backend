import https from 'https';
import fs from 'fs';

const CUISINE_PHOTOS = {
  georgian: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800',
  ],
  italian: [
    'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  ],
  japanese: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800',
    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800',
  ],
  chinese: [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
    'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800',
  ],
  american: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800',
  ],
  fastfood: [
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800',
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800',
  ],
  pub: [
    'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800',
    'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800',
  ],
  steakhouse: [
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
  ],
  mediterranean: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800',
  ],
  indian: [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
  ],
  sushi: [
    'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800',
    'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800',
  ],
  bbq: [
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
  ],
  vegetarian: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
  ],
  seafood: [
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800',
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800',
  ],
  turkish: [
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
    'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800',
  ],
  french: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800',
  ],
  default: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800',
  ],
};

const CUISINE_SLUG_MAP = {
  georgian: 'georgian', pizza: 'italian', italian: 'italian',
  sushi: 'japanese', japanese: 'japanese', chinese: 'chinese',
  burger: 'american', american: 'american', fast_food: 'fastfood',
  coffee_shop: 'cafe', cafe: 'cafe', pub: 'pub', bar: 'pub',
  steak_house: 'steakhouse', bbq: 'bbq', mediterranean: 'mediterranean',
  indian: 'indian', seafood: 'seafood', fish: 'seafood',
  turkish: 'turkish', french: 'french', vegetarian: 'vegetarian',
  vegan: 'vegetarian',
};

const photoCounters = {};
function getPhoto(cuisineSlug) {
  const list = CUISINE_PHOTOS[cuisineSlug] || CUISINE_PHOTOS.default;
  const i = photoCounters[cuisineSlug] || 0;
  photoCounters[cuisineSlug] = (i + 1) % list.length;
  return list[i];
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'RestaurantApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Tbilisi restaurants from Overpass API...');

  const query = `
[out:json][timeout:60];
area["name"="თბილისი"]["admin_level"="4"]->.tbilisi;
(
  node["amenity"="restaurant"](area.tbilisi);
  node["amenity"="cafe"](area.tbilisi);
  node["amenity"="fast_food"](area.tbilisi);
  node["amenity"="pub"](area.tbilisi);
  node["amenity"="bar"](area.tbilisi);
);
out body 200;
`.trim();

  const encoded = encodeURIComponent(query);
  const url = `https://overpass-api.de/api/interpreter?data=${encoded}`;

  const raw = await fetch(url);
  const json = JSON.parse(raw);
  const elements = json.elements || [];
  console.log(`Got ${elements.length} raw results`);

  // Filter: must have name, lat/lon in Tbilisi bounds
  const filtered = elements.filter(e =>
    e.tags?.name &&
    e.lat >= 41.65 && e.lat <= 41.75 &&
    e.lon >= 44.75 && e.lon <= 44.87
  );
  console.log(`After filter: ${filtered.length} restaurants with names`);

  // Pick top 50 with most tags (more complete data)
  const sorted = filtered
    .sort((a, b) => Object.keys(b.tags).length - Object.keys(a.tags).length)
    .slice(0, 50);

  const restaurants = sorted.map((e, i) => {
    const tags = e.tags;
    const amenity = tags.amenity || 'restaurant';
    const cuisineTag = (tags.cuisine || '').split(';')[0].toLowerCase().trim();
    const cuisineSlug = CUISINE_SLUG_MAP[cuisineTag] ||
      CUISINE_SLUG_MAP[amenity] ||
      'default';

    const name = tags.name || tags['name:en'] || `Restaurant ${i + 1}`;
    const address = [
      tags['addr:street'],
      tags['addr:housenumber'],
      'თბილისი'
    ].filter(Boolean).join(', ') || `${name}, თბილისი`;

    return {
      name,
      description: tags.description || tags['description:ka'] || `${name} — თბილისის ერთ-ერთი პოპულარული სასადილო.`,
      address,
      city: 'თბილისი',
      district: tags['addr:suburb'] || tags['addr:district'] || 'თბილისი',
      latitude: e.lat,
      longitude: e.lon,
      phone: tags.phone || tags['contact:phone'] || '',
      website: tags.website || tags['contact:website'] || '',
      cuisine: cuisineSlug === 'default' ? 'georgian' : cuisineSlug,
      cover_photo: getPhoto(cuisineSlug === 'default' ? 'georgian' : cuisineSlug),
      osm_id: e.id,
      opening_hours: tags.opening_hours || '',
    };
  });

  console.log('\n=== RESULTS ===');
  restaurants.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} | ${r.cuisine} | ${r.address}`);
  });

  fs.writeFileSync(
    'scripts/tbilisi-restaurants.json',
    JSON.stringify(restaurants, null, 2)
  );
  console.log(`\nSaved ${restaurants.length} restaurants to scripts/tbilisi-restaurants.json`);
}

main().catch(console.error);
