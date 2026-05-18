import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { Review } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';
import { Cuisine } from '../entities/cuisine.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AdminService {
    private restaurantsRepo;
    private usersRepo;
    private reviewsRepo;
    private bookingsRepo;
    private cuisinesRepo;
    private notificationsService;
    constructor(restaurantsRepo: Repository<Restaurant>, usersRepo: Repository<User>, reviewsRepo: Repository<Review>, bookingsRepo: Repository<Booking>, cuisinesRepo: Repository<Cuisine>, notificationsService: NotificationsService);
    getStats(): Promise<{
        totalRestaurants: number;
        pendingRestaurants: number;
        totalBookings: number;
        todayBookings: number;
        totalUsers: number;
        totalReviews: number;
        pendingReviews: number;
    }>;
    getBookingsChart(): Promise<{
        date: any;
        count: number;
    }[]>;
    getTopRestaurants(): Promise<{
        name: any;
        bookings: number;
    }[]>;
    getRestaurants(params: {
        status?: string;
        q?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: Restaurant[];
        total: number;
        page: number;
        limit: number;
    }>;
    getRestaurantById(id: string): Promise<Restaurant>;
    updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant>;
    updateRestaurantStatus(id: string, status: string): Promise<{
        ok: boolean;
    }>;
    createRestaurant(data: {
        name: string;
        address: string;
        city: string;
        district?: string;
        phone?: string;
        description?: string;
        latitude: number;
        longitude: number;
        cuisineId?: string;
        ownerId?: string;
    }): Promise<Restaurant>;
    deleteRestaurant(id: string): Promise<{
        ok: boolean;
    }>;
    getBookings(params: {
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: Booking[];
        total: number;
        page: number;
        limit: number;
    }>;
    getBookingById(id: string): Promise<Booking>;
    getUsers(params: {
        role?: string;
        q?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            name: string;
            lastName: string;
            phone: string;
            email: string;
            googleId: string;
            role: import("../entities/user.entity").UserRole;
            avatar: string;
            status: import("../entities/user.entity").UserStatus;
            loyaltyPoints: number;
            referralCode: string;
            pushToken: string;
            emailVerified: boolean;
            emailVerifyCode: string;
            emailVerifyExpires: Date;
            createdAt: Date;
            reviews: Review[];
            bookings: Booking[];
            favorites: import("../entities/favorite.entity").Favorite[];
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUserById(id: string): Promise<{
        bookings: Booking[];
        reviews: Review[];
        id: string;
        name: string;
        lastName: string;
        phone: string;
        email: string;
        googleId: string;
        role: import("../entities/user.entity").UserRole;
        avatar: string;
        status: import("../entities/user.entity").UserStatus;
        loyaltyPoints: number;
        referralCode: string;
        pushToken: string;
        emailVerified: boolean;
        emailVerifyCode: string;
        emailVerifyExpires: Date;
        createdAt: Date;
        favorites: import("../entities/favorite.entity").Favorite[];
    }>;
    setUserStatus(id: string, status: 'active' | 'blocked'): Promise<{
        ok: boolean;
    }>;
    setUserRole(id: string, role: string): Promise<{
        ok: boolean;
    }>;
    verifyUserEmail(id: string): Promise<{
        ok: boolean;
    }>;
    deleteUser(id: string): Promise<{
        ok: boolean;
    }>;
    getReviews(params: {
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: Review[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateReviewStatus(id: string, status: 'approved' | 'hidden'): Promise<{
        ok: boolean;
    }>;
    deleteReview(id: string): Promise<{
        ok: boolean;
    }>;
    sendPushToAll(title: string, body: string): Promise<{
        ok: boolean;
        sent: number;
    }>;
    sendPushToUser(userId: string, title: string, body: string): Promise<{
        ok: boolean;
        reason: string;
        sent?: undefined;
    } | {
        ok: boolean;
        sent: number;
        reason?: undefined;
    }>;
    createCuisine(data: {
        name: string;
        slug: string;
        icon?: string;
    }): Promise<Cuisine>;
    updateCuisine(id: string, data: {
        name?: string;
        slug?: string;
        icon?: string;
    }): Promise<Cuisine | null>;
    deleteCuisine(id: string): Promise<{
        ok: boolean;
    }>;
}
