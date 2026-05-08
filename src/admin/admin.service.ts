import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { Review } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
  ) {}

  async getStatistics() {
    const [restaurants, users, bookings, reviews] = await Promise.all([
      this.restaurantsRepo.count({ where: { status: 'approved' } }),
      this.usersRepo.count(),
      this.bookingsRepo.count(),
      this.reviewsRepo.count({ where: { status: 'approved' } }),
    ]);
    return { restaurants, users, bookings, reviews };
  }

  async getPendingRestaurants() {
    return this.restaurantsRepo.find({ where: { status: 'pending' }, relations: ['owner'] });
  }

  async approveRestaurant(id: string, status: 'approved' | 'rejected' | 'suspended') {
    await this.restaurantsRepo.update(id, { status });
    return { ok: true };
  }

  async getUsers(q?: string) {
    const qb = this.usersRepo.createQueryBuilder('u');
    if (q) qb.where('u.name ILIKE :q OR u.email ILIKE :q OR u.phone ILIKE :q', { q: `%${q}%` });
    return qb.orderBy('u.createdAt', 'DESC').getMany();
  }

  async setUserStatus(id: string, status: 'active' | 'blocked') {
    await this.usersRepo.update(id, { status });
    return { ok: true };
  }

  async getPendingReviews() {
    return this.reviewsRepo.find({ where: { status: 'pending' }, relations: ['user', 'restaurant'] });
  }
}
