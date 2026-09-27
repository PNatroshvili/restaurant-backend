import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { WorkingHour } from '../entities/working-hour.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsPublicController } from './bookings-public.controller';
import { BookingsGateway } from './bookings.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Restaurant, User, WorkingHour])],
  controllers: [BookingsController, BookingsPublicController],
  providers: [BookingsService, BookingsGateway],
})
export class BookingsModule {}
