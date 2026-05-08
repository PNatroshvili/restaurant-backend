"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
const restaurant_entity_1 = require("./entities/restaurant.entity");
const cuisine_entity_1 = require("./entities/cuisine.entity");
const restaurant_photo_entity_1 = require("./entities/restaurant-photo.entity");
const working_hour_entity_1 = require("./entities/working-hour.entity");
const menu_category_entity_1 = require("./entities/menu-category.entity");
const menu_item_entity_1 = require("./entities/menu-item.entity");
const review_entity_1 = require("./entities/review.entity");
const booking_entity_1 = require("./entities/booking.entity");
const favorite_entity_1 = require("./entities/favorite.entity");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const ds = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT ?? '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    entities: [user_entity_1.User, restaurant_entity_1.Restaurant, cuisine_entity_1.Cuisine, restaurant_photo_entity_1.RestaurantPhoto, working_hour_entity_1.WorkingHour, menu_category_entity_1.MenuCategory, menu_item_entity_1.MenuItem, review_entity_1.Review, booking_entity_1.Booking, favorite_entity_1.Favorite],
    synchronize: true,
});
const WORKING_HOURS = Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '10:00',
    close: '23:00',
    isClosed: day === 0,
}));
async function seed() {
    await ds.initialize();
    console.log('Connected to DB');
    const usersRepo = ds.getRepository(user_entity_1.User);
    const existing = await usersRepo.findOne({ where: { email: 'admin@restaurant.ge' } });
    if (!existing) {
        await usersRepo.save(usersRepo.create({
            name: 'Admin',
            email: 'admin@restaurant.ge',
            passwordHash: await bcrypt.hash('admin123', 10),
            role: 'admin',
        }));
        console.log('Admin created: admin@restaurant.ge / admin123');
    }
    let owner = await usersRepo.findOne({ where: { email: 'owner@restaurant.ge' } });
    if (!owner) {
        owner = await usersRepo.save(usersRepo.create({
            name: 'Restaurant Owner',
            email: 'owner@restaurant.ge',
            passwordHash: await bcrypt.hash('owner123', 10),
            role: 'restaurant_manager',
        }));
        console.log('Owner created: owner@restaurant.ge / owner123');
    }
    const cuisinesRepo = ds.getRepository(cuisine_entity_1.Cuisine);
    const cuisineData = [
        { name: 'ქართული', slug: 'georgian', icon: '🇬🇪' },
        { name: 'სწრაფი კვება', slug: 'fastfood', icon: '🍟' },
        { name: 'პაბი', slug: 'pub', icon: '🍺' },
        { name: 'კაფე', slug: 'cafe', icon: '☕' },
        { name: 'სტეიქ-ჰაუსი', slug: 'steakhouse', icon: '🥩' },
        { name: 'ბარბექიუ', slug: 'bbq', icon: '🔥' },
        { name: 'სუში', slug: 'sushi', icon: '🍣' },
        { name: 'იტალიური', slug: 'italian', icon: '🍕' },
        { name: 'ამერიკული', slug: 'american', icon: '🍔' },
        { name: 'ვეგეტარიანული', slug: 'vegetarian', icon: '🥗' },
        { name: 'ზღვის პროდ.', slug: 'seafood', icon: '🦞' },
        { name: 'ხმელთაშუაზ.', slug: 'mediterranean', icon: '🫒' },
        { name: 'ლებანური', slug: 'lebanese', icon: '🧆' },
        { name: 'თურქული', slug: 'turkish', icon: '🥙' },
        { name: 'ინდური', slug: 'indian', icon: '🍛' },
        { name: 'ჩინური', slug: 'chinese', icon: '🥢' },
        { name: 'ბრანჩი', slug: 'brunch', icon: '🥞' },
        { name: 'დესერტი', slug: 'dessert', icon: '🍰' },
        { name: 'ღვინის ბარი', slug: 'winebar', icon: '🍷' },
        { name: 'კრაფტ ლუდი', slug: 'craftbeer', icon: '🍻' },
        { name: 'ევროპული', slug: 'european', icon: '🍽️' },
        { name: 'ფრანგული', slug: 'french', icon: '🥐' },
        { name: 'მექსიკური', slug: 'mexican', icon: '🌮' },
        { name: 'იაპონური', slug: 'japanese', icon: '🍱' },
    ];
    const cuisines = {};
    for (const c of cuisineData) {
        let cuisine = await cuisinesRepo.findOne({ where: { slug: c.slug } });
        if (!cuisine)
            cuisine = await cuisinesRepo.save(cuisinesRepo.create(c));
        cuisines[c.slug] = cuisine;
    }
    console.log('Cuisines seeded');
    const restaurantsRepo = ds.getRepository(restaurant_entity_1.Restaurant);
    const count = await restaurantsRepo.count();
    if (count > 0) {
        console.log('Restaurants already exist, skipping');
        await ds.destroy();
        return;
    }
    const restaurantData = [
        {
            name: 'ფურცელი',
            description: 'ტრადიციული ქართული სამზარეულო თბილისის გულში. სახლის გემო და სტუმართმოყვარეობა.',
            address: 'შარდენის ქ. 12, თბილისი',
            city: 'თბილისი', district: 'მტაწმინდა',
            latitude: 41.6938, longitude: 44.8015,
            phone: '+995 32 222 3344',
            cuisine: 'georgian',
            cover_photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        },
        {
            name: 'Mama Mia',
            description: 'ავთენტური იტალიური პიცა და პასტა. ნეაპოლიტანური ტრადიციები თბილისში.',
            address: 'რუსთაველის გამზ. 22, თბილისი',
            city: 'თბილისი', district: 'მტაწმინდა',
            latitude: 41.6950, longitude: 44.8030,
            phone: '+995 32 299 1122',
            cuisine: 'italian',
            cover_photo: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800',
        },
        {
            name: 'Sakura',
            description: 'იაპონური სუში და სეგამი. ახალი ინგრედიენტები, ოსტატის ხელი.',
            address: 'ილია ჭავჭავაძის გამზ. 14, თბილისი',
            city: 'თბილისი', district: 'ვაკე',
            latitude: 41.7000, longitude: 44.7900,
            phone: '+995 32 211 5566',
            cuisine: 'japanese',
            cover_photo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
        },
        {
            name: 'The Burger Lab',
            description: 'პრემიუმ ბურგერები და კრაფტ ლუდი. საუკეთესო beef პატი ქალაქში.',
            address: 'მარჯანიშვილის ქ. 8, თბილისი',
            city: 'თბილისი', district: 'ქვემო ქალაქი',
            latitude: 41.6880, longitude: 44.8050,
            phone: '+995 32 244 7788',
            cuisine: 'american',
            cover_photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        },
        {
            name: 'სუფრა',
            description: 'ქართული სუფრის ტრადიციები. ხინკალი, ხაჭაპური და სახლის ღვინო.',
            address: 'ლესელიძის ქ. 4, თბილისი',
            city: 'თბილისი', district: 'ძველი თბილისი',
            latitude: 41.6910, longitude: 44.8080,
            phone: '+995 32 277 9900',
            cuisine: 'georgian',
            cover_photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        },
        {
            name: 'Dragon Palace',
            description: 'ჩინური სამზარეულო. დიმ სამი, ვოკი და ტრადიციული ჩინური კერძები.',
            address: 'თამარ მეფის გამზ. 3, თბილისი',
            city: 'თბილისი', district: 'საბურთალო',
            latitude: 41.7050, longitude: 44.7980,
            phone: '+995 32 233 4455',
            cuisine: 'chinese',
            cover_photo: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
        },
        {
            name: 'Spice Garden',
            description: 'ინდური კერძები ტრადიციული სანელებლებით. ვეგეტარიანული მენიუ.',
            address: 'ვაჟა-ფშაველას გამზ. 45, თბილისი',
            city: 'თბილისი', district: 'საბურთალო',
            latitude: 41.7100, longitude: 44.7850,
            phone: '+995 32 255 6677',
            cuisine: 'indian',
            cover_photo: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        },
        {
            name: 'Olive Garden',
            description: 'ხმელთაშუაზღვიური სამზარეულო. ბერძნული სალათები, ჰუმუსი და გრილი.',
            address: 'ნუცუბიძის ქ. 1, თბილისი',
            city: 'თბილისი', district: 'ვაკე',
            latitude: 41.7020, longitude: 44.7820,
            phone: '+995 32 266 8899',
            cuisine: 'mediterranean',
            cover_photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        },
    ];
    const photosRepo = ds.getRepository(restaurant_photo_entity_1.RestaurantPhoto);
    const hoursRepo = ds.getRepository(working_hour_entity_1.WorkingHour);
    const catRepo = ds.getRepository(menu_category_entity_1.MenuCategory);
    const itemRepo = ds.getRepository(menu_item_entity_1.MenuItem);
    const reviewsRepo = ds.getRepository(review_entity_1.Review);
    for (const rd of restaurantData) {
        const r = await restaurantsRepo.save(restaurantsRepo.create({
            name: rd.name,
            description: rd.description,
            address: rd.address,
            city: rd.city,
            district: rd.district,
            latitude: rd.latitude,
            longitude: rd.longitude,
            phone: rd.phone,
            cuisineId: cuisines[rd.cuisine].id,
            ownerId: owner.id,
            status: 'approved',
            ratingAvg: +(3.5 + Math.random() * 1.5).toFixed(1),
            reviewsCount: Math.floor(Math.random() * 50) + 5,
        }));
        await photosRepo.save(photosRepo.create({
            restaurantId: r.id,
            url: rd.cover_photo,
            sortOrder: 0,
            isCover: true,
        }));
        for (const wh of WORKING_HOURS) {
            await hoursRepo.save(hoursRepo.create({ ...wh, restaurantId: r.id }));
        }
        const cat = await catRepo.save(catRepo.create({ restaurantId: r.id, name: 'მთავარი კერძები', sortOrder: 0 }));
        await itemRepo.save([
            itemRepo.create({ categoryId: cat.id, name: 'კერძი 1', price: 15, isAvailable: true }),
            itemRepo.create({ categoryId: cat.id, name: 'კერძი 2', price: 22, isAvailable: true }),
            itemRepo.create({ categoryId: cat.id, name: 'კერძი 3', price: 18, isAvailable: true }),
        ]);
        const testUser = await usersRepo.findOne({ where: { email: 'owner@restaurant.ge' } });
        if (testUser) {
            await reviewsRepo.save(reviewsRepo.create({
                restaurantId: r.id,
                userId: testUser.id,
                rating: 5,
                comment: 'შესანიშნავი რესტორანი!',
                status: 'approved',
            }));
        }
        console.log(`✓ ${r.name}`);
    }
    console.log('\nSeed complete! 8 restaurants added.');
    await ds.destroy();
}
seed().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed.js.map