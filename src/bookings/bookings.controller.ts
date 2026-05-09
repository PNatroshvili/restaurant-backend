import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private service: BookingsService) {}

  @Post()
  create(@Body() dto: any, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get('my')
  findMy(@Request() req: any) {
    return this.service.findMy(req.user);
  }

  @Get('my-restaurant')
  findMyRestaurant(@Request() req: any) {
    return this.service.findMyRestaurantBookings(req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.service.updateStatus(id, status, req.user);
  }
}
