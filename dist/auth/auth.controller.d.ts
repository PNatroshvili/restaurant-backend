import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        requiresVerification: boolean;
        email: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
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
        };
        tokens: {
            access_token: string;
            refresh_token: string;
        };
    }>;
    refresh(token: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    verifyEmail(body: {
        email: string;
        code: string;
    }): Promise<{
        user: {
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
        };
        tokens: {
            access_token: string;
            refresh_token: string;
        };
    }>;
    resendCode(email: string): Promise<{
        ok: boolean;
    }>;
    googleLogin(idToken: string): Promise<{
        user: {
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
        };
        tokens: {
            access_token: string;
            refresh_token: string;
        };
    }>;
    me(req: any): any;
    updateMe(req: any, dto: {
        name?: string;
        lastName?: string;
        phone?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
    }): Promise<{
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
    } | {
        requiresVerification: boolean;
        email: string;
    }>;
    updatePushToken(req: any, pushToken: string): Promise<{
        success: boolean;
    }>;
    getLoyalty(req: any): Promise<{
        points: number;
        tier: string;
        nextTier: string;
        progress: number;
        referralCode: string;
    }>;
}
