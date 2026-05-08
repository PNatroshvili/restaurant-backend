import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { MenuCategory } from '../entities/menu-category.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { User } from '../entities/user.entity';
export declare class RestaurantsService {
    private repo;
    private menuRepo;
    constructor(repo: Repository<Restaurant>, menuRepo: Repository<MenuCategory>);
    findAll(filters: {
        q?: string;
        city?: string;
        district?: string;
        cuisine_id?: string;
        min_rating?: number;
        is_open?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            cover_photo: string | null;
            id: string;
            ownerId: string;
            owner: User;
            name: string;
            description: string;
            address: string;
            city: string;
            district: string;
            latitude: number;
            longitude: number;
            phone: string;
            ratingAvg: number;
            reviewsCount: number;
            status: import("../entities/restaurant.entity").RestaurantStatus;
            cuisineId: string;
            cuisine: import("../entities/cuisine.entity").Cuisine;
            photos: import("../entities/restaurant-photo.entity").RestaurantPhoto[];
            menuCategories: MenuCategory[];
            reviews: import("../entities/review.entity").Review[];
            bookings: import("../entities/booking.entity").Booking[];
            workingHours: import("../entities/working-hour.entity").WorkingHour[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findNearby(lat: number, lng: number, radius: number): Promise<any>;
    findById(id: string): Promise<Restaurant>;
    getMenu(restaurantId: string): Promise<MenuCategory[]>;
    create(dto: CreateRestaurantDto, user: User): Promise<Restaurant>;
    update(id: string, dto: Partial<CreateRestaurantDto>, user: User): Promise<Restaurant>;
    remove(id: string, user: User): Promise<void>;
    private mapCoverPhoto;
}
