import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Restaurant } from './entities/restaurant.entity';
import { Cuisine } from './entities/cuisine.entity';
import { RestaurantPhoto } from './entities/restaurant-photo.entity';
import { WorkingHour } from './entities/working-hour.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Review } from './entities/review.entity';
export declare class SeedService implements OnApplicationBootstrap {
    private usersRepo;
    private restaurantsRepo;
    private cuisinesRepo;
    private photosRepo;
    private hoursRepo;
    private catRepo;
    private itemRepo;
    private reviewsRepo;
    private readonly logger;
    constructor(usersRepo: Repository<User>, restaurantsRepo: Repository<Restaurant>, cuisinesRepo: Repository<Cuisine>, photosRepo: Repository<RestaurantPhoto>, hoursRepo: Repository<WorkingHour>, catRepo: Repository<MenuCategory>, itemRepo: Repository<MenuItem>, reviewsRepo: Repository<Review>);
    onApplicationBootstrap(): Promise<void>;
    private run;
}
