import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
export declare class ReviewsService {
    private repo;
    private restaurantsRepo;
    constructor(repo: Repository<Review>, restaurantsRepo: Repository<Restaurant>);
    findAll(restaurantId: string, page?: number, limit?: number): Promise<{
        data: Review[];
        total: number;
        page: number;
        limit: number;
    }>;
    create(dto: {
        restaurant_id: string;
        rating: number;
        comment?: string;
    }, user: User): Promise<Review>;
    moderate(id: string, status: 'approved' | 'hidden'): Promise<Review>;
    private updateRestaurantRating;
}
