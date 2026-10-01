import { Controller, Get, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsPublicController {
  constructor(private service: BookingsService) {}

  @Get('availability-summary')
  getAvailabilitySummary(
    @Query('date') date: string,
    @Query('guests') guests = '2',
    @Query('limit') limit = '24',
  ) {
    return this.service.availabilitySummary(date, Number(guests) || 2, Number(limit) || 24);
  }

  @Get('availability')
  getAvailability(
    @Query('restaurant_id') restaurantId: string,
    @Query('date') date: string,
    @Query('guests') guests = '2',
  ) {
    return this.service.getAvailability(restaurantId, date, Number(guests) || 2);
  }
}
