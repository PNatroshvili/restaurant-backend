import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantEvent } from '../entities/restaurant-event.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantEvent, Restaurant])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
