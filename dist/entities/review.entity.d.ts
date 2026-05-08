import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
export type ReviewStatus = 'pending' | 'approved' | 'hidden';
export declare class Review {
    id: string;
    userId: string;
    user: User;
    restaurantId: string;
    restaurant: Restaurant;
    rating: number;
    comment: string;
    status: ReviewStatus;
    createdAt: Date;
}
