import { Restaurant } from './restaurant.entity';
export declare class WorkingHour {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    day: number;
    open: string;
    close: string;
    isClosed: boolean;
}
