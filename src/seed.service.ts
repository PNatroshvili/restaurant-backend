import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Restaurant } from './entities/restaurant.entity';
import { Cuisine } from './entities/cuisine.entity';
import { RestaurantPhoto } from './entities/restaurant-photo.entity';
import { WorkingHour } from './entities/working-hour.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Review } from './entities/review.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(Cuisine) private cuisinesRepo: Repository<Cuisine>,
    @InjectRepository(RestaurantPhoto) private photosRepo: Repository<RestaurantPhoto>,
    @InjectRepository(WorkingHour) private hoursRepo: Repository<WorkingHour>,
    @InjectRepository(MenuCategory) private catRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem) private itemRepo: Repository<MenuItem>,
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.run();
    } catch (e) {
      this.logger.error('Seed failed', e);
    }
  }

  private async run() {
    // Admin
    const existing = await this.usersRepo.findOne({ where: { email: 'admin@restaurant.ge' } });
    if (!existing) {
      await this.usersRepo.save(this.usersRepo.create({
        name: 'Admin',
        email: 'admin@restaurant.ge',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
      }));
      this.logger.log('Admin created');
    }

    // Owner
    let owner = await this.usersRepo.findOne({ where: { email: 'owner@restaurant.ge' } });
    if (!owner) {
      owner = await this.usersRepo.save(this.usersRepo.create({
        name: 'Restaurant Owner',
        email: 'owner@restaurant.ge',
        passwordHash: await bcrypt.hash('owner123', 10),
        role: 'restaurant_manager',
      }));
      this.logger.log('Owner created');
    }

    // Cuisines
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
    const cuisines: Record<string, Cuisine> = {};
    for (const c of cuisineData) {
      let cuisine = await this.cuisinesRepo.findOne({ where: { slug: c.slug } });
      if (!cuisine) cuisine = await this.cuisinesRepo.save(this.cuisinesRepo.create(c));
      cuisines[c.slug] = cuisine;
    }
    this.logger.log('Cuisines seeded');

    // Restaurants — skip if already exist
    const count = await this.restaurantsRepo.count();
    if (count > 0) {
      this.logger.log('Restaurants already exist, skipping');
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
      {
        name: 'Craft & Brew',
        description: 'კრაფტ ლუდის ბარი საუკეთესო სნეკებით. 20+ სახეობის ლუდი.',
        address: 'გრიბოედოვის ქ. 7, თბილისი',
        city: 'თბილისი', district: 'მტაწმინდა',
        latitude: 41.6925, longitude: 44.8010,
        phone: '+995 32 299 3344',
        cuisine: 'craftbeer',
        cover_photo: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800',
      },
      {
        name: 'Le Café',
        description: 'ფრანგული სტილის კაფე. ახალი კრუასანი, ესპრესო და დესერტები.',
        address: 'ელბაქიძის ქ. 3, თბილისი',
        city: 'თბილისი', district: 'მტაწმინდა',
        latitude: 41.6945, longitude: 44.7995,
        phone: '+995 32 211 2233',
        cuisine: 'cafe',
        cover_photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      },
      {
        name: 'Steak House Prime',
        description: 'პრემიუმ სტეიქი და ღვინო. Dry-aged beef და საუკეთესო სელექცია.',
        address: 'ილია ჭავჭავაძის გამზ. 54, თბილისი',
        city: 'თბილისი', district: 'ვაკე',
        latitude: 41.7015, longitude: 44.7870,
        phone: '+995 32 244 5566',
        cuisine: 'steakhouse',
        cover_photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
      },
      {
        name: 'KFC Tbilisi',
        description: 'KFC — სწრაფი კვება. ქრუსტიანტი ქათამი და ბურგერები.',
        address: 'რუსთაველის გამზ. 5, თბილისი',
        city: 'თბილისი', district: 'მტაწმინდა',
        latitude: 41.6960, longitude: 44.8020,
        phone: '+995 32 200 0000',
        cuisine: 'fastfood',
        cover_photo: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800',
      },
    ];

    const WORKING_HOURS = Array.from({ length: 7 }, (_, day) => ({
      day,
      open: '10:00',
      close: '23:00',
      isClosed: day === 0,
    }));

    for (const rd of restaurantData) {
      const r = await this.restaurantsRepo.save(this.restaurantsRepo.create({
        name: rd.name,
        description: rd.description,
        address: rd.address,
        city: rd.city,
        district: rd.district,
        latitude: rd.latitude,
        longitude: rd.longitude,
        phone: rd.phone,
        cuisineId: cuisines[rd.cuisine].id,
        ownerId: owner!.id,
        status: 'approved',
        ratingAvg: +(3.5 + Math.random() * 1.5).toFixed(1),
        reviewsCount: Math.floor(Math.random() * 50) + 5,
      }));

      await this.photosRepo.save(this.photosRepo.create({
        restaurantId: r.id,
        url: rd.cover_photo,
        sortOrder: 0,
        isCover: true,
      }));

      for (const wh of WORKING_HOURS) {
        await this.hoursRepo.save(this.hoursRepo.create({ ...wh, restaurantId: r.id }));
      }

      const cat = await this.catRepo.save(this.catRepo.create({ restaurantId: r.id, name: 'მთავარი კერძები', sortOrder: 0 }));
      await this.itemRepo.save([
        this.itemRepo.create({ categoryId: cat.id, name: 'კერძი 1', price: 15, isAvailable: true }),
        this.itemRepo.create({ categoryId: cat.id, name: 'კერძი 2', price: 22, isAvailable: true }),
        this.itemRepo.create({ categoryId: cat.id, name: 'კერძი 3', price: 18, isAvailable: true }),
      ]);

      await this.reviewsRepo.save(this.reviewsRepo.create({
        restaurantId: r.id,
        userId: owner!.id,
        rating: 5,
        comment: 'შესანიშნავი რესტორანი!',
        status: 'approved',
      }));

      this.logger.log(`Seeded: ${r.name}`);
    }

    this.logger.log('Seed complete!');
  }
}
