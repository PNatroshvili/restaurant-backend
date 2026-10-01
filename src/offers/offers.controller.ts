import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private service: OffersService) {}

  @Get()
  listActive(
    @Query('restaurant_id') restaurantId?: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
    @Query('guests') guests = '1',
  ) {
    return this.service.listActive(restaurantId, date, time, Number(guests) || 1);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listMine(@Request() req: any) {
    return this.service.listMine(req.user);
  }

  @Post(':restaurantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Param('restaurantId') restaurantId: string, @Body() body: any, @Request() req: any) {
    return this.service.create(restaurantId, body, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.update(id, body, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}