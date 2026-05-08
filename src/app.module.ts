import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BookingsModule } from './bookings/bookings.module';
import { CuisinesModule } from './cuisines/cuisines.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';

import { User } from './entities/user.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantPhoto } from './entities/restaurant-photo.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Review } from './entities/review.entity';
import { Booking } from './entities/booking.entity';
import { Cuisine } from './entities/cuisine.entity';
import { Favorite } from './entities/favorite.entity';
import { WorkingHour } from './entities/working-hour.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +(config.get<string>('DB_PORT') ?? '5432'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        entities: [User, Restaurant, RestaurantPhoto, MenuCategory, MenuItem, Review, Booking, Cuisine, Favorite, WorkingHour],
        synchronize: true,
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuthModule,
    UsersModule,
    RestaurantsModule,
    ReviewsModule,
    BookingsModule,
    CuisinesModule,
    FavoritesModule,
    AdminModule,
    UploadModule,
  ],
})
export class AppModule {}
