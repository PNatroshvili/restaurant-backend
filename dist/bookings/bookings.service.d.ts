import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsGateway } from './bookings.gateway';
export declare class BookingsService {
    private repo;
    private restaurantRepo;
    private userRepo;
    private notificationsService;
    private bookingsGateway;
    constructor(repo: Repository<Booking>, restaurantRepo: Repository<Restaurant>, userRepo: Repository<User>, notificationsService: NotificationsService, bookingsGateway: BookingsGateway);
    create(dto: {
        restaurant_id: string;
        date: string;
        time: string;
        guests_count: number;
        comment?: string;
    }, user: User): Promise<Booking>;
    findMy(user: User): Promise<Booking[]>;
    findMyRestaurantBookings(user: User): Promise<Booking[]>;
    updateStatus(id: string, status: string, user: User): Promise<Booking>;
}
