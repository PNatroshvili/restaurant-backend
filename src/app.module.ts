import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
import { SeedService } from './seed.service';

import { User } from './entities/user.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantPhoto } from './entities/restaurant-photo.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Review } from './entities/review.entity';
import { ReviewPhoto } from './entities/review-photo.entity';
import { Booking } from './entities/booking.entity';
import { Cuisine } from './entities/cuisine.entity';
import { Favorite } from './entities/favorite.entity';
import { WorkingHour } from './entities/working-hour.entity';
import { RestaurantEvent } from './entities/restaurant-event.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { MailCampaign } from './entities/mail-campaign.entity';
import { Collection } from './entities/collection.entity';
import { HomeSection } from './entities/home-section.entity';
import { RestaurantOffer } from './entities/restaurant-offer.entity';
import { UserNotification } from './entities/user-notification.entity';
import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { RestaurantTable } from './entities/restaurant-table.entity';
import { MailModule } from './mail/mail.module';
import { OffersModule } from './offers/offers.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { LoyaltyModule } from './loyalty/loyalty.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: +(config.get<string>('DB_PORT') ?? '3306'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        charset: 'utf8mb4_unicode_ci',
        entities: [User, Restaurant, RestaurantPhoto, MenuCategory, MenuItem, Review, ReviewPhoto, Booking, Cuisine, Favorite, WorkingHour, RestaurantEvent, ChatMessage, MailCampaign, Collection, HomeSection, RestaurantOffer, UserNotification, WaitlistEntry, LoyaltyTransaction, RestaurantTable],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User, Restaurant, RestaurantPhoto, MenuCategory, MenuItem, Review, Cuisine, Favorite, WorkingHour, Collection, HomeSection]),
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
    NotificationsModule,
    EventsModule,
    ChatModule,
    MailModule,
    OffersModule,
    WaitlistModule,
    LoyaltyModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
