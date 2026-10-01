import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { WorkingHour } from '../entities/working-hour.entity';
import { RestaurantOffer } from '../entities/restaurant-offer.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsPublicController } from './bookings-public.controller';
import { BookingsGateway } from './bookings.gateway';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Restaurant, User, WorkingHour, RestaurantOffer]), WaitlistModule, LoyaltyModule],
  controllers: [BookingsController, BookingsPublicController],
  providers: [BookingsService, BookingsGateway],
})
export class BookingsModule {}
