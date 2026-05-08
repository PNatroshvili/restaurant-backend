import { Restaurant } from './restaurant.entity';
export declare class RestaurantPhoto {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    url: string;
    sortOrder: number;
    isCover: boolean;
}
