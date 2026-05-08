import { AdminService } from './admin.service';
export declare class AdminController {
    private service;
    constructor(service: AdminService);
    getStatistics(): Promise<{
        restaurants: number;
        users: number;
        bookings: number;
        reviews: number;
    }>;
    getPending(): Promise<import("../entities/restaurant.entity").Restaurant[]>;
    approveRestaurant(id: string, status: 'approved' | 'rejected' | 'suspended'): Promise<{
        ok: boolean;
    }>;
    getUsers(q?: string): Promise<import("../entities/user.entity").User[]>;
    setUserStatus(id: string, status: 'active' | 'blocked'): Promise<{
        ok: boolean;
    }>;
    getPendingReviews(): Promise<import("../entities/review.entity").Review[]>;
}
