import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private service: RestaurantsService) {}

  @Get()
  findAll(@Query() filters: any) {
    return this.service.findAll(filters);
  }

  @Get('nearby')
  findNearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius = '2000') {
    return this.service.findNearby(+lat, +lng, +radius);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/menu')
  getMenu(@Param('id') id: string) {
    return this.service.getMenu(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateRestaurantDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: Partial<CreateRestaurantDto>, @Request() req: any) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
