import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private usersRepo;
    private jwtService;
    private config;
    private mailService;
    private readonly logger;
    constructor(usersRepo: Repository<User>, jwtService: JwtService, config: ConfigService, mailService: MailService);
    register(dto: RegisterDto): Promise<{
        requiresVerification: boolean;
        email: string;
    }>;
    verifyEmail(email: string, code: string): Promise<{
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
    updatePushToken(userId: string, pushToken: string): Promise<{
        success: boolean;
    }>;
    getLoyalty(userId: string): Promise<{
        points: number;
        tier: string;
        nextTier: string;
        progress: number;
        referralCode: string;
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
    updateProfile(userId: string, dto: {
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
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    private buildTokens;
    private buildResponse;
}
