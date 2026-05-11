import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private service: EventsService) {}

  @Get('restaurant/:restaurantId')
  getForRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.service.getForRestaurant(restaurantId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@Request() req: any) {
    return this.service.getMyRestaurantEvents(req.user);
  }

  @Post('restaurant/:restaurantId')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: { title: string; description?: string; emoji?: string; eventDate?: string },
    @Request() req: any,
  ) {
    return this.service.create(dto, restaurantId, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
