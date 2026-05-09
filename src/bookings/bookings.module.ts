import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Restaurant])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
