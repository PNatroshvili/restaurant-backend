import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { Review } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';
import { Cuisine } from '../entities/cuisine.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(Cuisine) private cuisinesRepo: Repository<Cuisine>,
  ) {}

  // ── Stats ────────────────────────────────────────────────────────────────
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRestaurants, pendingRestaurants, totalBookings, todayBookings,
           totalUsers, totalReviews, pendingReviews] = await Promise.all([
      this.restaurantsRepo.count(),
      this.restaurantsRepo.count({ where: { status: 'pending' } }),
      this.bookingsRepo.count(),
      this.bookingsRepo.createQueryBuilder('b').where('b.createdAt >= :today', { today }).getCount(),
      this.usersRepo.count(),
      this.reviewsRepo.count(),
      this.reviewsRepo.count({ where: { status: 'pending' } }),
    ]);

    return { totalRestaurants, pendingRestaurants, totalBookings, todayBookings, totalUsers, totalReviews, pendingReviews };
  }

  // ── Restaurants ───────────────────────────────────────────────────────────
  async getRestaurants(params: { status?: string; q?: string; page?: number; limit?: number }) {
    const { status, q, page = 1, limit = 20 } = params;
    const qb = this.restaurantsRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.cuisine', 'cuisine')
      .leftJoinAndSelect('r.photos', 'photos', 'photos.isCover = true')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('r.status = :status', { status });
    if (q) qb.andWhere('r.name ILIKE :q OR r.address ILIKE :q', { q: `%${q}%` });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateRestaurantStatus(id: string, status: string) {
    await this.restaurantsRepo.update(id, { status: status as any });
    return { ok: true };
  }

  async deleteRestaurant(id: string) {
    const r = await this.restaurantsRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    await this.restaurantsRepo.remove(r);
    return { ok: true };
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  async getBookings(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const qb = this.bookingsRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.restaurant', 'restaurant')
      .leftJoinAndSelect('b.user', 'user')
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('b.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  async getUsers(params: { role?: string; q?: string; page?: number; limit?: number }) {
    const { role, q, page = 1, limit = 20 } = params;
    const qb = this.usersRepo.createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (role) qb.andWhere('u.role = :role', { role });
    if (q) qb.andWhere('u.name ILIKE :q OR u.email ILIKE :q OR u.phone ILIKE :q', { q: `%${q}%` });

    const [data, total] = await qb.getManyAndCount();
    return { data: data.map(({ passwordHash, ...u }) => u), total, page, limit };
  }

  async setUserStatus(id: string, status: 'active' | 'blocked') {
    await this.usersRepo.update(id, { status });
    return { ok: true };
  }

  async setUserRole(id: string, role: string) {
    await this.usersRepo.update(id, { role: role as any });
    return { ok: true };
  }

  async deleteUser(id: string) {
    const u = await this.usersRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException();
    await this.usersRepo.remove(u);
    return { ok: true };
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  async getReviews(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const qb = this.reviewsRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.restaurant', 'restaurant')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('r.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateReviewStatus(id: string, status: 'approved' | 'hidden') {
    await this.reviewsRepo.update(id, { status });
    return { ok: true };
  }

  async deleteReview(id: string) {
    const r = await this.reviewsRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    await this.reviewsRepo.remove(r);
    return { ok: true };
  }

  // ── Cuisines ──────────────────────────────────────────────────────────────
  async createCuisine(data: { name: string; slug: string; icon?: string }) {
    const c = this.cuisinesRepo.create(data);
    return this.cuisinesRepo.save(c);
  }

  async updateCuisine(id: string, data: { name?: string; slug?: string; icon?: string }) {
    await this.cuisinesRepo.update(id, data);
    return this.cuisinesRepo.findOne({ where: { id } });
  }

  async deleteCuisine(id: string) {
    const c = await this.cuisinesRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException();
    await this.cuisinesRepo.remove(c);
    return { ok: true };
  }
}
