import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    refresh(token: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    me(req: any): any;
    updateMe(req: any, dto: {
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
}
