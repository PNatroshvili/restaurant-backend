import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { Review } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';
import { Cuisine } from '../entities/cuisine.entity';
import { Collection } from '../entities/collection.entity';
import { HomeSection } from '../entities/home-section.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, User, Review, Booking, Cuisine, Collection, HomeSection])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
