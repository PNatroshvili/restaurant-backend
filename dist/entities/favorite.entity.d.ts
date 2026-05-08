import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
export declare class Favorite {
    id: string;
    userId: string;
    user: User;
    restaurantId: string;
    restaurant: Restaurant;
    createdAt: Date;
}
