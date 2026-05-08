import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersRepo;
    private jwtService;
    private config;
    constructor(usersRepo: Repository<User>, jwtService: JwtService, config: ConfigService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            name: string;
            phone: string;
            email: string;
            role: import("../entities/user.entity").UserRole;
            avatar: string;
            status: import("../entities/user.entity").UserStatus;
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
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            name: string;
            phone: string;
            email: string;
            role: import("../entities/user.entity").UserRole;
            avatar: string;
            status: import("../entities/user.entity").UserStatus;
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
        phone?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: import("../entities/user.entity").UserRole;
        avatar: string;
        status: import("../entities/user.entity").UserStatus;
        createdAt: Date;
        reviews: import("../entities/review.entity").Review[];
        bookings: import("../entities/booking.entity").Booking[];
        favorites: import("../entities/favorite.entity").Favorite[];
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    private buildTokens;
    private buildResponse;
}
