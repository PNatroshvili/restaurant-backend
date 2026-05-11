import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsGateway } from './bookings.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Restaurant, User])],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsGateway],
})
export class BookingsModule {}
