import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
export declare class RestaurantsController {
    private service;
    constructor(service: RestaurantsService);
    findAll(filters: any): Promise<{
        data: {
            cover_photo: string | null;
            id: string;
            ownerId: string;
            owner: import("../entities/user.entity").User;
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
            menuCategories: import("../entities/menu-category.entity").MenuCategory[];
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
    findNearby(lat: string, lng: string, radius?: string): Promise<any>;
    findOne(id: string): Promise<import("../entities/restaurant.entity").Restaurant>;
    getMenu(id: string): Promise<import("../entities/menu-category.entity").MenuCategory[]>;
    create(dto: CreateRestaurantDto, req: any): Promise<import("../entities/restaurant.entity").Restaurant>;
    update(id: string, dto: Partial<CreateRestaurantDto>, req: any): Promise<import("../entities/restaurant.entity").Restaurant>;
    remove(id: string, req: any): Promise<void>;
}
