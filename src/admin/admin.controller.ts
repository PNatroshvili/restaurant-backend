import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
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

  // ── Stats ────────────────────────────────────────────────────────────────
  @Get('stats')
  getStats() { return this.service.getStats(); }

  // ── Restaurants ───────────────────────────────────────────────────────────
  @Get('restaurants')
  getRestaurants(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.getRestaurants({ status, q, page: +page, limit: +limit });
  }

  @Patch('restaurants/:id/status')
  updateRestaurantStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.updateRestaurantStatus(id, status);
  }

  @Delete('restaurants/:id')
  deleteRestaurant(@Param('id') id: string) {
    return this.service.deleteRestaurant(id);
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  @Get('bookings')
  getBookings(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.getBookings({ status, page: +page, limit: +limit });
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  @Get('users')
  getUsers(
    @Query('role') role?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.getUsers({ role, q, page: +page, limit: +limit });
  }

  @Patch('users/:id/status')
  setUserStatus(@Param('id') id: string, @Body('status') status: 'active' | 'blocked') {
    return this.service.setUserStatus(id, status);
  }

  @Patch('users/:id/role')
  setUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.service.setUserRole(id, role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.service.deleteUser(id);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  @Get('reviews')
  getReviews(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.getReviews({ status, page: +page, limit: +limit });
  }

  @Patch('reviews/:id/status')
  updateReviewStatus(@Param('id') id: string, @Body('status') status: 'approved' | 'hidden') {
    return this.service.updateReviewStatus(id, status);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.service.deleteReview(id);
  }

  // ── Cuisines ──────────────────────────────────────────────────────────────
  @Post('cuisines')
  createCuisine(@Body() body: { name: string; slug: string; icon?: string }) {
    return this.service.createCuisine(body);
  }

  @Patch('cuisines/:id')
  updateCuisine(@Param('id') id: string, @Body() body: { name?: string; slug?: string; icon?: string }) {
    return this.service.updateCuisine(id, body);
  }

  @Delete('cuisines/:id')
  deleteCuisine(@Param('id') id: string) {
    return this.service.deleteCuisine(id);
  }
}
