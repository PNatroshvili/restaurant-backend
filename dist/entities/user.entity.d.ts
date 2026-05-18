import { Review } from './review.entity';
import { Booking } from './booking.entity';
import { Favorite } from './favorite.entity';
export type UserRole = 'user' | 'restaurant_manager' | 'admin';
export type UserStatus = 'active' | 'blocked';
export declare class User {
    id: string;
    name: string;
    lastName: string;
    phone: string;
    email: string;
    passwordHash: string;
    googleId: string;
    role: UserRole;
    avatar: string;
    status: UserStatus;
    loyaltyPoints: number;
    referralCode: string;
    pushToken: string;
    emailVerified: boolean;
    emailVerifyCode: string;
    emailVerifyExpires: Date;
    createdAt: Date;
    reviews: Review[];
    bookings: Booking[];
    favorites: Favorite[];
}
