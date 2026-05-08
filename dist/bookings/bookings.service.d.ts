import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
export declare class BookingsService {
    private repo;
    constructor(repo: Repository<Booking>);
    create(dto: {
        restaurant_id: string;
        date: string;
        time: string;
        guests_count: number;
        comment?: string;
    }, user: User): Promise<Booking>;
    findMy(user: User): Promise<Booking[]>;
    findByRestaurant(restaurantId: string, user: User): Promise<Booking[]>;
    updateStatus(id: string, status: string, user: User): Promise<Booking>;
}
