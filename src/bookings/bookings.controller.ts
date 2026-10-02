import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('bookings')
@Controller('bookings')
@ApiBearerAuth()
export class BookingsController {
  constructor(private service: BookingsService) {}

  // Availability is public so guests can discover live slots before signing in.
  @Get('availability')
  availability(
    @Query('restaurant_id') restaurantId: string,
    @Query('date') date: string,
    @Query('guests') guests?: string,
  ) {
    return this.service.getAvailability(restaurantId, date, Number(guests || 2));
  }

  // Used by discovery/home surfaces to show restaurants with upcoming free slots.
  @Get('availability-summary')
  availabilitySummary(
    @Query('date') date: string,
    @Query('guests') guests?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.availabilitySummary(date, Number(guests || 2), Number(limit || 24));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: any, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Request() req: any) {
    return this.service.findMy(req.user);
  }

  @Get('my-restaurant')
  @UseGuards(JwtAuthGuard)
  findMyRestaurant(@Request() req: any) {
    return this.service.findMyRestaurantBookings(req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: { date?: string; time?: string; guests_count?: number; comment?: string }, @Request() req: any) {
    return this.service.updateBooking(id, dto, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.service.updateStatus(id, status, req.user);
  }
}
