import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected';
export declare class Booking {
    id: string;
    userId: string;
    user: User;
    restaurantId: string;
    restaurant: Restaurant;
    date: string;
    time: string;
    guestsCount: number;
    comment: string;
    status: BookingStatus;
    createdAt: Date;
}
