import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('statistics')
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get('restaurants/pending')
  getPending() {
    return this.service.getPendingRestaurants();
  }

  @Patch('restaurants/:id/status')
  approveRestaurant(@Param('id') id: string, @Body('status') status: 'approved' | 'rejected' | 'suspended') {
    return this.service.approveRestaurant(id, status);
  }

  @Get('users')
  getUsers(@Query('q') q?: string) {
    return this.service.getUsers(q);
  }

  @Patch('users/:id/status')
  setUserStatus(@Param('id') id: string, @Body('status') status: 'active' | 'blocked') {
    return this.service.setUserStatus(id, status);
  }

  @Get('reviews/pending')
  getPendingReviews() {
    return this.service.getPendingReviews();
  }
}
