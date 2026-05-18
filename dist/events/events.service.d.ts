import { Repository } from 'typeorm';
import { RestaurantEvent } from '../entities/restaurant-event.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
export declare class EventsService {
    private repo;
    private restaurantRepo;
    constructor(repo: Repository<RestaurantEvent>, restaurantRepo: Repository<Restaurant>);
    getForRestaurant(restaurantId: string): Promise<RestaurantEvent[]>;
    create(dto: {
        title: string;
        description?: string;
        emoji?: string;
        eventDate?: string;
    }, restaurantId: string, user: User): Promise<RestaurantEvent>;
    remove(id: string, user: User): Promise<{
        success: boolean;
    }>;
    getMyRestaurantEvents(user: User): Promise<RestaurantEvent[]>;
}
