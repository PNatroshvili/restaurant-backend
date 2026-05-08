import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../entities/review.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Restaurant])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
