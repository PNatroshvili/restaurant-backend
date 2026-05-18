import { AdminService } from './admin.service';
export declare class AdminController {
    private service;
    constructor(service: AdminService);
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
    getRestaurants(status?: string, q?: string, page?: string, limit?: string): Promise<{
        data: import("../entities/restaurant.entity").Restaurant[];
        total: number;
        page: number;
        limit: number;
    }>;
    createRestaurant(body: any): Promise<import("../entities/restaurant.entity").Restaurant>;
    getRestaurantById(id: string): Promise<import("../entities/restaurant.entity").Restaurant>;
    updateRestaurant(id: string, body: any): Promise<import("../entities/restaurant.entity").Restaurant>;
    updateRestaurantStatus(id: string, status: string): Promise<{
        ok: boolean;
    }>;
    deleteRestaurant(id: string): Promise<{
        ok: boolean;
    }>;
    getBookings(status?: string, page?: string, limit?: string): Promise<{
        data: import("../entities/booking.entity").Booking[];
        total: number;
        page: number;
        limit: number;
    }>;
    getBookingById(id: string): Promise<import("../entities/booking.entity").Booking>;
    getUsers(role?: string, q?: string, page?: string, limit?: string): Promise<{
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
            reviews: import("../entities/review.entity").Review[];
            bookings: import("../entities/booking.entity").Booking[];
            favorites: import("../entities/favorite.entity").Favorite[];
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUserById(id: string): Promise<{
        bookings: import("../entities/booking.entity").Booking[];
        reviews: import("../entities/review.entity").Review[];
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
    getReviews(status?: string, page?: string, limit?: string): Promise<{
        data: import("../entities/review.entity").Review[];
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
    sendToAll(body: {
        title: string;
        body: string;
    }): Promise<{
        ok: boolean;
        sent: number;
    }>;
    sendToUser(id: string, body: {
        title: string;
        body: string;
    }): Promise<{
        ok: boolean;
        reason: string;
        sent?: undefined;
    } | {
        ok: boolean;
        sent: number;
        reason?: undefined;
    }>;
    createCuisine(body: {
        name: string;
        slug: string;
        icon?: string;
    }): Promise<import("../entities/cuisine.entity").Cuisine>;
    updateCuisine(id: string, body: {
        name?: string;
        slug?: string;
        icon?: string;
    }): Promise<import("../entities/cuisine.entity").Cuisine | null>;
    deleteCuisine(id: string): Promise<{
        ok: boolean;
    }>;
}
