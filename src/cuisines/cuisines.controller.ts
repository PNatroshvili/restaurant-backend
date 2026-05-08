import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CuisinesService } from './cuisines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('cuisines')
@Controller('cuisines')
export class CuisinesController {
  constructor(private service: CuisinesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@Body() dto: { name: string; slug: string; icon?: string }) {
    return this.service.create(dto);
  }
}
