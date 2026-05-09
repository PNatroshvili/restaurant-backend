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

const DEFAULT_MENU = [
  { category: 'მთავარი კერძები', items: [
    { name: 'ხინკალი (5 ც.)', desc: 'ხელნაკეთი ხინკალი ხორცით', price: 12 },
    { name: 'ხაჭაპური', desc: 'ქართული ყველის პური', price: 14 },
    { name: 'შაშლიკი', desc: 'გრილზე შემწვარი ღორის ხორცი', price: 22 },
  ]},
];

const RESTAURANT_MENUS: Record<string, { category: string; items: { name: string; desc?: string; price: number }[] }[]> = {
  'მასპინძელო!': [
    { category: 'ხინკალი', items: [
      { name: 'ხინკალი ქართული (5 ც.)', desc: 'ხელნაკეთი, სანელებლებით', price: 10 },
      { name: 'ხინკალი სოკოთი (5 ც.)', desc: 'ტყის სოკოთი, ვეგ', price: 11 },
      { name: 'ხინკალი ყველით (5 ც.)', desc: 'სულუგუნი და ახალი ყველი', price: 10 },
    ]},
    { category: 'მთავარი კერძები', items: [
      { name: 'შაშლიკი', desc: 'გრილზე შემწვარი ღორის ან საქონლის ხორცი', price: 24 },
      { name: 'ქაბაბი', desc: 'ხელნაკეთი ქაბაბი, ბოსტნეულით', price: 20 },
      { name: 'ჩახოხბილი', desc: 'ქათამი ტომატის სოუსში', price: 18 },
      { name: 'ოჯახური', desc: 'შემწვარი ღორის ხორცი კარტოფილით', price: 22 },
    ]},
    { category: 'პირველი კერძები', items: [
      { name: 'ხარჩო', desc: 'სქელი ბრინჯის სუპი საქონლის ხორცით', price: 12 },
      { name: 'ჩიხირთმა', desc: 'ქათმის სუპი კვერცხით', price: 11 },
    ]},
    { category: 'სასმელი', items: [
      { name: 'ლუდი (0.5ლ)', price: 8 },
      { name: 'მინერალური წყალი', price: 4 },
      { name: 'სახლის ღვინო (1ლ)', price: 15 },
    ]},
  ],

  'გაბრიაძე': [
    { category: 'საუზმე', items: [
      { name: 'კრუასანი კარაქით', price: 8 },
      { name: 'ომლეტი ბოსტნეულით', desc: '3 კვერცხი, ახალი ბოსტნეული', price: 14 },
      { name: 'ავოკადო ტოსტი', desc: 'ახალი პური, ავოკადო, კვერცხი', price: 16 },
    ]},
    { category: 'ყავა და ჩაი', items: [
      { name: 'ესპრესო', price: 5 },
      { name: 'კაპუჩინო', price: 8 },
      { name: 'ლატე', price: 9 },
      { name: 'ფილტრის ყავა', price: 7 },
      { name: 'ჩაი (ქოთანი)', price: 8 },
    ]},
    { category: 'დესერტი', items: [
      { name: 'ჩიზქეიქი', desc: 'ახალი კენკრის სოუსით', price: 14 },
      { name: 'შოკოლადის ბრაუნი', price: 12 },
      { name: 'ტირამისუ', price: 15 },
    ]},
    { category: 'სალათები', items: [
      { name: 'კეისრის სალათი', desc: 'სოუსი, კრეკერი, პარმეზანი', price: 18 },
      { name: 'კაპრეზე', desc: 'მოცარელა, პომიდორი, ბაზილიკო', price: 16 },
    ]},
  ],

  'ფუნიკულიორი': [
    { category: 'სტარტერები', items: [
      { name: 'ბადრიჯნის რულეტი', desc: 'ნიგვზით და ნიორით', price: 14 },
      { name: 'ფხალი', desc: 'სამი სახეობა, ნიგვზის სოუსით', price: 16 },
      { name: 'სოკოს ჯულიენი', desc: 'კრემის სოუსში', price: 18 },
    ]},
    { category: 'მთავარი კერძები', items: [
      { name: 'ხინკალი (5 ც.)', desc: 'ქართული სტილი', price: 12 },
      { name: 'ცხვრის ფერხი', desc: 'ტრადიციული მომზადება, ბოსტნეულით', price: 45 },
      { name: 'ქათმის ტაბაკა', desc: 'ნიორის სოუსით', price: 32 },
      { name: 'სტეიქი', desc: 'საქონლის ხორცი, სეზონური ბოსტნეული', price: 55 },
      { name: 'ლობიანი', desc: 'ლობიოთი გავსებული პური', price: 12 },
    ]},
    { category: 'ღვინო', items: [
      { name: 'რქაწითელი (ბოთლი)', desc: 'კახური, მშრალი', price: 35 },
      { name: 'საფერავი (ბოთლი)', desc: 'კახური, მშრალი', price: 38 },
      { name: 'ცინანდალი (ბოთლი)', price: 32 },
    ]},
  ],

  'მაჭახელა სამიკიტნო': [
    { category: 'ხინკალი (24/7)', items: [
      { name: 'ხინკალი ქართული (5 ც.)', price: 9 },
      { name: 'ხინკალი ქალაქური (5 ც.)', price: 9 },
      { name: 'ხინკალი სოკოთი (5 ც.)', price: 10 },
      { name: 'ხინკალი კიბორჩხალით (5 ც.)', price: 14 },
    ]},
    { category: 'ხაჭაპური', items: [
      { name: 'იმერული ხაჭაპური', price: 12 },
      { name: 'აჭარული ხაჭაპური', price: 16 },
      { name: 'მეგრული ხაჭაპური', price: 14 },
    ]},
    { category: 'მთავარი', items: [
      { name: 'შაშლიკი', price: 22 },
      { name: 'ჩახოხბილი', price: 18 },
      { name: 'ლობიო', desc: 'ქოთანში, სახლის პურით', price: 10 },
    ]},
  ],

  'შემოიხედე გენაცვალე': [
    { category: 'სნეკები', items: [
      { name: 'ბადრიჯნის რულეტი', price: 12 },
      { name: 'ფხალი', price: 14 },
      { name: 'სოჯო', price: 8 },
    ]},
    { category: 'ხინკალი და პური', items: [
      { name: 'ხინკალი (5 ც.)', price: 10 },
      { name: 'იმერული ხაჭაპური', price: 12 },
      { name: 'ლობიანი', price: 10 },
    ]},
    { category: 'მთავარი კერძები', items: [
      { name: 'ოჯახური', price: 20 },
      { name: 'სოკო კარაქში', price: 16 },
      { name: 'მწვადი', price: 24 },
      { name: 'ჩახოხბილი', price: 18 },
    ]},
    { category: 'სასმელი', items: [
      { name: 'ლუდი (0.5ლ)', price: 7 },
      { name: 'სახლის ღვინო (0.5ლ)', price: 12 },
    ]},
  ],

  'River Hall': [
    { category: 'სტარტერები', items: [
      { name: 'ბადრიჯნის კილა', desc: 'ნიგვზით, ბროწეულით', price: 16 },
      { name: 'სომხური სუჯუხი', price: 18 },
      { name: 'ყველის დაფა', desc: 'სამი სახეობა, ახალი ხილით', price: 28 },
    ]},
    { category: 'მდინარის კერძები', items: [
      { name: 'კალმახი გრილზე', desc: 'ლიმონის სოუსით, ბოსტნეულით', price: 38 },
      { name: 'ზუთხი ორთქლზე', price: 45 },
    ]},
    { category: 'ხორცი', items: [
      { name: 'საქონლის სტეიქი', desc: '250გ, ბოსტნეულით', price: 52 },
      { name: 'ქათმის ფილე', desc: 'ბოსტნეულის სოუსით', price: 28 },
      { name: 'ბატკნის ნეკნები', price: 48 },
    ]},
    { category: 'ღვინო', items: [
      { name: 'საფერავი', desc: 'ბოთლი, კახური', price: 40 },
      { name: 'კინძმარაული', desc: 'ბოთლი', price: 45 },
    ]},
  ],

  'ვინოთეკა': [
    { category: 'ღვინო ჭიქით', items: [
      { name: 'რქაწითელი', desc: 'კახური, ქვევრის', price: 12 },
      { name: 'საფერავი', desc: 'კახური, მშრალი', price: 13 },
      { name: 'ცინანდალი', price: 11 },
      { name: 'ხვანჭქარა', desc: 'ნახევრად მშრალი', price: 14 },
    ]},
    { category: 'ღვინო ბოთლით', items: [
      { name: 'ჩინებული რქაწითელი', price: 55 },
      { name: 'ფიროსმანი', price: 48 },
      { name: 'ქინძმარაული', price: 60 },
    ]},
    { category: 'სნეკები', items: [
      { name: 'ყველის დაფა', desc: 'სულუგუნი, ბრინძა, ახალი ყველი', price: 22 },
      { name: 'შერეული სნეკი', desc: 'ხილი, კაკალი, მშრალი ხილი', price: 18 },
      { name: 'ბადრიჯნის რულეტი', price: 14 },
    ]},
  ],

  'ვინოგრაუნდი': [
    { category: 'ლუდი', items: [
      { name: 'ქართული კრაფტ ლუდი (0.4ლ)', price: 10 },
      { name: 'იმპორტირებული ლუდი (0.33ლ)', price: 12 },
      { name: 'ლუდი ბოთლით', price: 8 },
    ]},
    { category: 'ღვინო', items: [
      { name: 'სახლის წითელი (0.5ლ)', price: 15 },
      { name: 'სახლის თეთრი (0.5ლ)', price: 15 },
    ]},
    { category: 'სნეკები', items: [
      { name: 'ნაჭდევი', desc: 'ცხარე, ნიორით', price: 12 },
      { name: 'ყველი სულუგუნი', desc: 'გრილზე', price: 14 },
      { name: 'ფრი', price: 8 },
    ]},
  ],

  'მზიური': [
    { category: 'საუზმე', items: [
      { name: 'კვერცხი ბეკონით', price: 14 },
      { name: 'ომლეტი ბოსტნეულით', price: 12 },
      { name: 'ტოსტი', price: 8 },
    ]},
    { category: 'ყავა', items: [
      { name: 'ესპრესო', price: 5 },
      { name: 'კაპუჩინო', price: 8 },
      { name: 'ლატე', price: 9 },
      { name: 'ამერიკანო', price: 6 },
    ]},
    { category: 'მსუბუქი კვება', items: [
      { name: 'კლაბ სენდვიჩი', price: 16 },
      { name: 'კეისრის სალათი', price: 18 },
      { name: 'პანინი', price: 14 },
    ]},
  ],

  'Rainers Pizzeria & Beergarden': [
    { category: 'პიცა', items: [
      { name: 'მარგარიტა', desc: 'ტომატი, მოცარელა, ბაზილიკო', price: 22 },
      { name: 'პეპერონი', desc: 'პეპერონი, ტომატი, ყველი', price: 26 },
      { name: 'ბოსტნეული', desc: 'ახალი ბოსტნეული, ტომატი', price: 24 },
      { name: 'ოთხი ყველი', desc: 'მოცარელა, გორგონზოლა, პარმეზანი, ბრი', price: 28 },
    ]},
    { category: 'ლუდი', items: [
      { name: 'გერმანული ლუდი (0.5ლ)', price: 12 },
      { name: 'კრაფტ ლუდი (0.4ლ)', price: 14 },
    ]},
    { category: 'სალათები', items: [
      { name: 'კეისრის სალათი', price: 18 },
      { name: 'ბერძნული სალათი', price: 16 },
    ]},
  ],

  'საკე სუში ბარი': [
    { category: 'სუში (8 ც.)', items: [
      { name: 'ფილადელფია', desc: 'ორაგული, კრემყველი, განაიხილ', price: 28 },
      { name: 'კალიფორნია', desc: 'კიბორჩხალა, ავოკადო, კიტრი', price: 24 },
      { name: 'სპაიси ტუნა', desc: 'ტუნა, ცხარე სოუსი', price: 26 },
      { name: 'ვეგეტარიანული', desc: 'ავოკადო, კიტრი, სტაფილო', price: 20 },
    ]},
    { category: 'საშიმი (6 ც.)', items: [
      { name: 'ორაგულის საშიმი', price: 24 },
      { name: 'ტუნას საშიმი', price: 26 },
    ]},
    { category: 'სუპი და სხვა', items: [
      { name: 'მისო სუპი', price: 8 },
      { name: 'ედამამე', price: 10 },
      { name: 'გიოზა (6 ც.)', desc: 'ქათმით ან ბოსტნეულით', price: 14 },
    ]},
  ],
};

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
    // Truncate if data is partial OR if old placeholder menu items exist
    const count = await this.restaurantsRepo.count();
    const placeholderCount = await this.itemRepo
      .createQueryBuilder('i')
      .where("i.name LIKE 'კერძი %'")
      .getCount();
    if ((count > 0 && count < 50) || placeholderCount > 0) {
      await this.restaurantsRepo.query('TRUNCATE TABLE menu_item, menu_category, working_hour, restaurant_photo, favorite, booking, review, restaurant RESTART IDENTITY CASCADE');
      this.logger.log('Cleared old restaurant data for fresh seed');
    }

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

    const restaurantData = [
      { name: "ვენდი'ს", description: "ვენდი'ს — ამერიკული სწრაფი კვება. ახალი ბურგერები და სალათები.", address: "თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7114138, longitude: 44.7577522, phone: "", cuisine: "american", cover_photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800" },
      { name: "მაკდონალდსი", description: "მაკდონალდსი — მსოფლიოში ყველაზე ცნობილი სწრაფი კვების ქსელი.", address: "კოტე მარჯანიშვილის ქუჩა, 20, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7096257, longitude: 44.7968885, phone: "+995 32 296 69 67", cuisine: "american", cover_photo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800" },
      { name: "პალერმო", description: "პალერმო — ქართული სამზარეულო თბილისის ცენტრში.", address: "წმინდა ქეთევან დედოფლის გამზირი, 11, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.6911891, longitude: 44.816088, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800" },
      { name: "მაკდონალდსი", description: "მაკდონალდსი — კლასიკური ბურგერები, ფრი და შეიქი.", address: "ძმები კაკაბაძეების ქუჩა, 1, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7034901, longitude: 44.7899107, phone: "", cuisine: "american", cover_photo: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800" },
      { name: "დეგუსტო", description: "დეგუსტო — გემრიელი ქართული სამზარეულო. ხელნაკეთი კერძები.", address: "თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7085586, longitude: 44.7694653, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800" },
      { name: "მაკშაურმა", description: "მაკშაურმა — ახალი შაურმა და სწრაფი კვება ქალაქის ცენტრში.", address: "გიორგი სააკაძის მოედანი, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7240156, longitude: 44.7760987, phone: "", cuisine: "fastfood", cover_photo: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800" },
      { name: "მზიური", description: "მზიური — კომფორტული კაფე ვაკეში. ყავა, დესერტები, სენდვიჩები.", address: "ილია ჭავჭავაძის გამზირი, 23, თბილისი", city: "თბილისი", district: "ვაკე", latitude: 41.7105537, longitude: 44.7691501, phone: "", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800" },
      { name: "ანტრე", description: "ანტრე — თბილისის საყვარელი კაფე. ახალი ყავა და საუზმე.", address: "პეტრიაშვილის ქუჩა, 19, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7059344, longitude: 44.7795158, phone: "", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800" },
      { name: "ფასანაური", description: "ფასანაური — მთის გემო თბილისში. ტრადიციული ქართული კერძები.", address: "თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7024682, longitude: 44.7920905, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800" },
      { name: "საკე სუში ბარი", description: "საკე სუში ბარი — ახალი იაპონური სუში და ოსტატის სეთები.", address: "ბესიკის ქუჩა, 4, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.6986033, longitude: 44.7966206, phone: "", cuisine: "japanese", cover_photo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800" },
      { name: "შემოიხედე გენაცვალე", description: "შემოიხედე გენაცვალე — ქართული სამზარეულო მარჯანიშვილის გულში.", address: "კოტე მარჯანიშვილის ქუჩა, 5, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7078446, longitude: 44.7939569, phone: "+995 32 291 00 05", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800" },
      { name: "მაჭახელა სამიკიტნო", description: "მაჭახელა სამიკიტნო — ხინკლის ოსტატები. ღია 24/7.", address: "ჰოვანეს თუმანიანის ქუჩა, 23, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.6897499, longitude: 44.8088798, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800" },
      { name: "სკ სამზარეულო", description: "სკ სამზარეულო — ინდური სამზარეულო ძველ თბილისში.", address: "იოსებ გრიშაშვილის ქუჩა, 8/1, თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6883664, longitude: 44.8113153, phone: "", cuisine: "indian", cover_photo: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800" },
      { name: "გაბრიაძე", description: "გაბრიაძე — ლეგენდარული კაფე ძველი თბილისის გულში.", address: "თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6957725, longitude: 44.806556, phone: "+995 550 000552", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800" },
      { name: "ველიამინოვი", description: "ველიამინოვი — ისტორიული ატმოსფერო და ქართული კუზინა.", address: "შალვა დადიანის ქუჩა, 8, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.6924223, longitude: 44.8021201, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800" },
      { name: "ტერემOK", description: "ტერემOK — 24/7 ღია რესტორანი ყაზბეგის გამზირზე.", address: "ალექსანდრე ყაზბეგის გამზირი, 9, თბილისი", city: "თბილისი", district: "საბურთალო", latitude: 41.7264212, longitude: 44.7662366, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800" },
      { name: "ჩაის სახლი", description: "ჩაის სახლი — ჩაის კულტურა და სითბო. საუკეთესო ჩაის სახეობები.", address: "ლეო კიაჩელის ქუჩა, 4/1, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7049075, longitude: 44.7909519, phone: "", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800" },
      { name: "კანაპე", description: "კანაპე — კომფორტული კაფე ვაკეში. ყავა და სახლის გემო.", address: "ირაკლი აბაშიძის ქუჩა, 14, თბილისი", city: "თბილისი", district: "ვაკე", latitude: 41.7071377, longitude: 44.7716718, phone: "+995 32 223 19 21", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800" },
      { name: "ხუტოროკი", description: "ხუტოროკი — ქართული სამზარეულო ვაჟა-ფშაველაზე.", address: "ვაჟა-ფშაველას გამზირი, 11, თბილისი", city: "თბილისი", district: "საბურთალო", latitude: 41.7275726, longitude: 44.7647103, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800" },
      { name: "შავი", description: "შავი — სპეციალური ყავა და კომფორტული ატმოსფერო.", address: "თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7041039, longitude: 44.784023, phone: "+995 32 293 36 33", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800" },
      { name: "ალანი", description: "ალანი — ქართული კერძები ძველი თბილისის ხედით.", address: "ვახტანგ გორგასლის ქუჩა, 1, თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6894546, longitude: 44.8098661, phone: "+995 32 272 16 28", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800" },
      { name: "ნალი", description: "ნალი — პაბი ქვემო ქალაქში. კარგი ლუდი და სნეკები.", address: "გიორგი ახვლედიანის ქუჩა, 4/1, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7049635, longitude: 44.7909545, phone: "", cuisine: "pub", cover_photo: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800" },
      { name: "დუბლინი", description: "დუბლინი — ირლანდიური სტილის პაბი. ლაივ მუსიკა შაბათ-კვირას.", address: "გიორგი ახვლედიანის ქუჩა, 8, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7052176, longitude: 44.7903206, phone: "", cuisine: "pub", cover_photo: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800" },
      { name: "მეტეხის ჩრდილში", description: "მეტეხის ჩრდილში — მეტეხის ხიდის ხედით. ქართული სამზარეულო.", address: "წმინდა ქეთევან დედოფლის გამზირი, 33, თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6884713, longitude: 44.8213025, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800" },
      { name: "მასპინძელო!", description: "მასპინძელო! — 24/7 ქართული სამზარეულო. ხინკალი, ქაბაბი.", address: "ვახტანგ გორგასალის ქუჩა, 7, თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6886054, longitude: 44.8127613, phone: "+995 32 230 30 30", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800" },
      { name: "სანჩო", description: "სანჩო — პაბი ქვემო ქალაქში. ლუდი, კოქტეილები, მეგობრური ატმოსფერო.", address: "გიორგი ახვლედიანის ქუჩა, 23, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7069787, longitude: 44.7888995, phone: "", cuisine: "pub", cover_photo: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800" },
      { name: "ბორში", description: "ბორში — ბორშიდან ხინკლამდე. ქართულ-სლავური შეხვედრა.", address: "თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7090057, longitude: 44.7768881, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800" },
      { name: "ქრეპის კუთხე", description: "ქრეპის კუთხე — ფრანგული კრეპები და ტკბილი დესერტები.", address: "ილო მოსაშვილის ქუჩა, 1, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7103633, longitude: 44.7588974, phone: "+995 32 229 06 34", cuisine: "fastfood", cover_photo: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800" },
      { name: "სამიკიტნო", description: "სამიკიტნო — ტრადიციული ქართული სამიკიტნო. ავთენტური გემო.", address: "D. Aghmashenebeli Ave, 106, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7106294, longitude: 44.7963989, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800" },
      { name: "პურის სახლი", description: "პურის სახლი — ახალი პური, ხაჭაპური და ტრადიციული ქართული საცხობი.", address: "ვახტანგ გორგასლის ქუჩა, 7, თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6885893, longitude: 44.8125145, phone: "+995 32 230 30 30", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800" },
      { name: "ქართული სახლი", description: "ქართული სახლი — სტუმართმოყვარეობა და ქართული სუფრის ტრადიციები.", address: "თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7205496, longitude: 44.7859775, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800" },
      { name: "შტელცეს სახლი", description: "შტელცეს სახლი — გერმანული სახლი ქართული სამზარეულოთი.", address: "თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.6920204, longitude: 44.8069007, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800" },
      { name: "Spectra", description: "Spectra — 24/7 კაფე საბურთალოში. ყავა, სასმელი, საჭმელი.", address: "ვაჟა-ფშაველას გამზირი, 27, თბილისი", city: "თბილისი", district: "საბურთალო", latitude: 41.7272044, longitude: 44.7592725, phone: "", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800" },
      { name: "Ankara", description: "Ankara — თურქული სამზარეულო. კებაბი, მეზე და ბაქლავა.", address: "აღმაშენებლის გამზირი, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7128692, longitude: 44.7946806, phone: "", cuisine: "turkish", cover_photo: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800" },
      { name: "River Hall", description: "River Hall — მდინარე მტკვრის პანორამა. ქართული სამზარეულო.", address: "რიჩარდ ჰოლბრუკის ქუჩა, 3, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.6793386, longitude: 44.8374419, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800" },
      { name: "ფუნიკულიორი", description: "ფუნიკულიორი — მთაწმინდის მწვერვალზე. თბილისის საუკეთესო ხედი.", address: "მთაწმინდა, თბილისი", city: "თბილისი", district: "მთაწმინდა", latitude: 41.6946645, longitude: 44.7866737, phone: "+995 32 298 00 00", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800" },
      { name: "ვინოგრაუნდი", description: "ვინოგრაუნდი — ღვინის ბარი ძველ თბილისში. ქართული ღვინო და სნეკები.", address: "ერეკლე მეორის ქუჩა, თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6920708, longitude: 44.8066295, phone: "", cuisine: "pub", cover_photo: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800" },
      { name: "ბუ' ნება 700", description: "ბუ' ნება 700 — კაფე ბარი ნუცუბიძეზე. გემრიელი ყავა და სნეკები.", address: "მერაბ ბერძენიშვილის ქუჩა, თბილისი", city: "თბილისი", district: "ნუცუბიძე", latitude: 41.7013279, longitude: 44.7540845, phone: "", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800" },
      { name: "Rainers Pizzeria & Beergarden", description: "Rainers Pizzeria & Beergarden — პიცა, ლუდი და ბაღი.", address: "V. Barnov Str., 32, თბილისი", city: "თბილისი", district: "ვაკე", latitude: 41.7036383, longitude: 44.7840965, phone: "+995 32 298 54 39", cuisine: "italian", cover_photo: "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800" },
      { name: "სუფრა", description: "სუფრა — ქართული სუფრის ტრადიციები. ხინკალი, ხაჭაპური და სახლის ღვინო.", address: "აღმაშენებლის გამზირი, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7129419, longitude: 44.7946532, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800" },
      { name: "2 ტონა", description: "2 ტონა — თბილისის პოპულარული ბარ-რესტორანი. კარგი ლუდი და საჭმელი.", address: "თბილისი", city: "თბილისი", district: "საბურთალო", latitude: 41.7272668, longitude: 44.7674389, phone: "+995 32 218 52 53", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800" },
      { name: "სულთანის სუფრა", description: "სულთანის სუფრა — თურქული სამზარეულო. კებაბი, შაურმა, ფალაფელი.", address: "ლ. პასტერის ქუჩა, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7141561, longitude: 44.7934033, phone: "", cuisine: "turkish", cover_photo: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800" },
      { name: "სალობიე ვაკეში", description: "სალობიე ვაკეში — ქართული სამზარეულო ვაკეში. სალობიო, ლობიანი.", address: "თბილისი", city: "თბილისი", district: "ვაკე", latitude: 41.7094871, longitude: 44.7678944, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800" },
      { name: "ანტრე", description: "ანტრე — კაფე ძველ თბილისში. საუზმე, ყავა, ხელნაკეთი დესერტები.", address: "თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6902813, longitude: 44.8075029, phone: "", cuisine: "cafe", cover_photo: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800" },
      { name: "რონის", description: "რონის — ნეაპოლიტანური პიცა თბილისში. ხელნაკეთი ცომი.", address: "ვაჟა-ფშაველას გამზირი, 3, თბილისი", city: "თბილისი", district: "საბურთალო", latitude: 41.7277293, longitude: 44.7663645, phone: "", cuisine: "italian", cover_photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800" },
      { name: "პრესტიჟი", description: "პრესტიჟი — ქართული სამზარეულო ძველი თბილისის ატმოსფეროში.", address: "კოტე აფხაზის ქუჩა, 14, თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6935167, longitude: 44.8045159, phone: "", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800" },
      { name: "Taste of India", description: "Taste of India — ავთენტური ინდური სამზარეულო. ქარი, მასალა, ნანი.", address: "თბილისი", city: "თბილისი", district: "საბურთალო", latitude: 41.7309448, longitude: 44.765008, phone: "", cuisine: "indian", cover_photo: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800" },
      { name: "სენაკური გემო", description: "სენაკური გემო — სამეგრელოს სამზარეულო. ეგრისული კულინარია.", address: "D. Aghmashenebeli Ave., 62, თბილისი", city: "თბილისი", district: "თბილისი", latitude: 41.7070219, longitude: 44.7989711, phone: "+995 32 295 24 42", cuisine: "georgian", cover_photo: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800" },
      { name: "ვინოთეკა", description: "ვინოთეკა — ღვინის ბარი ძველ თბილისში. 200+ ქართული ღვინო.", address: "თბილისი", city: "თბილისი", district: "ძველი თბილისი", latitude: 41.6920791, longitude: 44.8062936, phone: "", cuisine: "pub", cover_photo: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800" },
    ];

    const WORKING_HOURS = Array.from({ length: 7 }, (_, day) => ({
      day,
      open: '10:00',
      close: '23:00',
      isClosed: day === 0,
    }));

    for (const rd of restaurantData) {
      const exists = await this.restaurantsRepo.findOne({ where: { name: rd.name, address: rd.address } });
      if (exists) continue;

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

      const menuData = RESTAURANT_MENUS[rd.name] || DEFAULT_MENU;
      for (let ci = 0; ci < menuData.length; ci++) {
        const catDef = menuData[ci];
        const cat = await this.catRepo.save(this.catRepo.create({ restaurantId: r.id, name: catDef.category, sortOrder: ci }));
        await this.itemRepo.save(catDef.items.map(item =>
          this.itemRepo.create({ categoryId: cat.id, name: item.name, description: item.desc, price: item.price, isAvailable: true })
        ));
      }

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
