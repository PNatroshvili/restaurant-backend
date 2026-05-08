import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private service: FavoritesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Post()
  add(@Body('restaurant_id') restaurantId: string, @Request() req: any) {
    return this.service.add(restaurantId, req.user);
  }

  @Delete(':restaurantId')
  remove(@Param('restaurantId') restaurantId: string, @Request() req: any) {
    return this.service.remove(restaurantId, req.user);
  }
}
