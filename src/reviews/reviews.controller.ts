import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Get()
  findAll(@Query('restaurant_id') restaurantId: string, @Query('page') page = '1') {
    return this.service.findAll(restaurantId, +page);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: { restaurant_id: string; rating: number; comment?: string }, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  moderate(@Param('id') id: string, @Body('status') status: 'approved' | 'hidden') {
    return this.service.moderate(id, status);
  }
}
