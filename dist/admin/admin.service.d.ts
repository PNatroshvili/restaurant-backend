import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { Review } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';
export declare class AdminService {
    private restaurantsRepo;
    private usersRepo;
    private reviewsRepo;
    private bookingsRepo;
    constructor(restaurantsRepo: Repository<Restaurant>, usersRepo: Repository<User>, reviewsRepo: Repository<Review>, bookingsRepo: Repository<Booking>);
    getStatistics(): Promise<{
        restaurants: number;
        users: number;
        bookings: number;
        reviews: number;
    }>;
    getPendingRestaurants(): Promise<Restaurant[]>;
    approveRestaurant(id: string, status: 'approved' | 'rejected' | 'suspended'): Promise<{
        ok: boolean;
    }>;
    getUsers(q?: string): Promise<User[]>;
    setUserStatus(id: string, status: 'active' | 'blocked'): Promise<{
        ok: boolean;
    }>;
    getPendingReviews(): Promise<Review[]>;
}
