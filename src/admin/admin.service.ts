import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { Review } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';
import { Cuisine } from '../entities/cuisine.entity';
import { Collection } from '../entities/collection.entity';
import { HomeSection } from '../entities/home-section.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(Cuisine) private cuisinesRepo: Repository<Cuisine>,
    @InjectRepository(Collection) private collectionsRepo: Repository<Collection>,
    @InjectRepository(HomeSection) private sectionsRepo: Repository<HomeSection>,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.seedHomeSections();
    await this.seedCollections();
  }

  private async seedHomeSections() {
    const defaults = [
      { sectionKey: 'georgian_classics', titleKa: 'ქართული კლასიკა', sortOrder: 1 },
      { sectionKey: 'cuisine_categories', titleKa: 'სამზარეულო', sortOrder: 2 },
      { sectionKey: 'collections', titleKa: 'კოლექციები', sortOrder: 3 },
      { sectionKey: 'nearby', titleKa: 'ახლომახლო', sortOrder: 4 },
      { sectionKey: 'deals', titleKa: 'ახლა დაჯავშნე', sortOrder: 5 },
      { sectionKey: 'top_rated', titleKa: 'ტოპ რესტორნები', sortOrder: 6 },
      { sectionKey: 'trending', titleKa: 'ტრენდი', sortOrder: 7 },
      { sectionKey: 'recently_viewed', titleKa: 'ახლახანს ნანახი', sortOrder: 8 },
      { sectionKey: 'new_restaurants', titleKa: 'ახალი რესტორნები', sortOrder: 9 },
    ];
    for (const d of defaults) {
      const exists = await this.sectionsRepo.findOne({ where: { sectionKey: d.sectionKey } });
      if (!exists) await this.sectionsRepo.save(this.sectionsRepo.create(d));
    }
  }

  private async seedCollections() {
    const count = await this.collectionsRepo.count();
    if (count > 0) return;
    const defaults = [
      { titleKa: 'წყვილებისთვის', subtitle: 'რომანტიული ვახშამი', emoji: '💑', accent: '#8B4FCE', bg: '#1A0D2D', sortOrder: 1 },
      { titleKa: 'ოჯახური', subtitle: 'ბავშვებისთვის', emoji: '👨‍👩‍👧', accent: '#27AE60', bg: '#0D2018', sortOrder: 2 },
      { titleKa: 'პრემიუმ', subtitle: 'ლუქს გამოცდილება', emoji: '✨', accent: '#F59E0B', bg: '#241800', sortOrder: 3 },
      { titleKa: 'სწრაფი', subtitle: '30 წუთამდე', emoji: '⚡', accent: '#3B82F6', bg: '#0A1528', sortOrder: 4 },
      { titleKa: 'ფარული', subtitle: 'ადგილობრივის საიდუმლო', emoji: '🗝️', accent: '#EC4899', bg: '#1F0A1A', sortOrder: 5 },
    ];
    await this.collectionsRepo.save(defaults.map(d => this.collectionsRepo.create(d)));
  }

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

  async getBookingsChart() {
    const days = 30;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const rows = await this.bookingsRepo
      .createQueryBuilder('b')
      .select('DATE(b.created_at)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('b.created_at >= :from', { from })
      .groupBy('DATE(b.created_at)')
      .orderBy('day', 'ASC')
      .getRawMany();

    return rows.map(r => ({ date: r.day, count: +r.count }));
  }

  async getTopRestaurants() {
    const rows = await this.bookingsRepo
      .createQueryBuilder('b')
      .select('b.restaurant_id', 'restaurantId')
      .addSelect('COUNT(*)', 'bookings')
      .leftJoin('b.restaurant', 'r')
      .addSelect('r.name', 'name')
      .groupBy('b.restaurant_id, r.name')
      .orderBy('bookings', 'DESC')
      .limit(5)
      .getRawMany();

    return rows.map(r => ({ name: r.name, bookings: +r.bookings }));
  }

  // ── Restaurants ───────────────────────────────────────────────────────────
  async getRestaurants(params: { status?: string; q?: string; page: number; limit: number }) {
    const { status, q, page, limit } = params;
    const qb = this.restaurantsRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.cuisine', 'cuisine')
      .leftJoinAndSelect('r.photos', 'photos', 'photos.is_cover = true')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('r.status = :status', { status });
    if (q) qb.andWhere('r.name LIKE :q OR r.address LIKE :q', { q: `%${q}%` });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getRestaurantById(id: string) {
    const r = await this.restaurantsRepo.findOne({
      where: { id },
      relations: ['cuisine', 'photos', 'workingHours', 'owner'],
    });
    if (!r) throw new NotFoundException();
    return r;
  }

  async updateRestaurant(id: string, data: Partial<Restaurant>) {
    await this.restaurantsRepo.update(id, data);
    return this.getRestaurantById(id);
  }

  async updateRestaurantStatus(id: string, status: string) {
    await this.restaurantsRepo.update(id, { status: status as any });
    return { ok: true };
  }

  async createRestaurant(data: {
    name: string; address: string; city: string; district?: string;
    phone?: string; description?: string; latitude: number; longitude: number;
    cuisineId?: string; ownerId?: string;
  }) {
    let ownerId = data.ownerId;
    if (!ownerId) {
      const admin = await this.usersRepo.findOne({ where: { role: 'admin' } });
      ownerId = admin!.id;
    }
    const r = this.restaurantsRepo.create({ ...data, ownerId, status: 'approved' });
    return this.restaurantsRepo.save(r);
  }

  async deleteRestaurant(id: string) {
    const r = await this.restaurantsRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    await this.restaurantsRepo.remove(r);
    return { ok: true };
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  async getBookings(params: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = params;
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

  async getBookingById(id: string) {
    const b = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['restaurant', 'user'],
    });
    if (!b) throw new NotFoundException();
    return b;
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  async getUsers(params: { role?: string; q?: string; page: number; limit: number }) {
    const { role, q, page, limit } = params;
    const qb = this.usersRepo.createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (role) qb.andWhere('u.role = :role', { role });
    if (q) qb.andWhere('u.name LIKE :q OR u.email LIKE :q OR u.phone LIKE :q', { q: `%${q}%` });

    const [data, total] = await qb.getManyAndCount();
    return { data: data.map(({ passwordHash, ...u }) => u), total, page, limit };
  }

  async getUserById(id: string) {
    const u = await this.usersRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException();
    const [bookings, reviews] = await Promise.all([
      this.bookingsRepo.find({ where: { userId: id }, relations: ['restaurant'], order: { createdAt: 'DESC' }, take: 10 }),
      this.reviewsRepo.find({ where: { userId: id }, relations: ['restaurant'], order: { createdAt: 'DESC' }, take: 10 }),
    ]);
    const { passwordHash, ...safeUser } = u;
    return { ...safeUser, bookings, reviews };
  }

  async setUserStatus(id: string, status: 'active' | 'blocked') {
    await this.usersRepo.update(id, { status });
    return { ok: true };
  }

  async setUserRole(id: string, role: string) {
    await this.usersRepo.update(id, { role: role as any });
    return { ok: true };
  }

  async verifyUserEmail(id: string) {
    await this.usersRepo.update(id, {
      emailVerified: true,
      emailVerifyCode: null as any,
      emailVerifyExpires: null as any,
    });
    return { ok: true };
  }

  async deleteUser(id: string) {
    const u = await this.usersRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException();
    await this.usersRepo.remove(u);
    return { ok: true };
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  async getReviews(params: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = params;
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

  private async recalculateRestaurantRating(restaurantId: string) {
    const result = await this.reviewsRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.restaurantId = :restaurantId AND r.status = :status', {
        restaurantId,
        status: 'approved',
      })
      .getRawOne<{ avg: string | null; count: string | number }>();

    await this.restaurantsRepo.update(restaurantId, {
      ratingAvg: parseFloat(String(result?.avg ?? '0')) || 0,
      reviewsCount: Number(result?.count ?? 0) || 0,
    });
  }

  async updateReviewStatus(id: string, status: 'approved' | 'hidden') {
    const review = await this.reviewsRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException();
    await this.reviewsRepo.update(id, { status });
    await this.recalculateRestaurantRating(review.restaurantId);
    return { ok: true };
  }

  async deleteReview(id: string) {
    const r = await this.reviewsRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    await this.reviewsRepo.remove(r);
    await this.recalculateRestaurantRating(r.restaurantId);
    return { ok: true };
  }

  // ── Push Notifications ────────────────────────────────────────────────────
  async sendPushToAll(title: string, body: string) {
    const users = await this.usersRepo.find({ where: { status: 'active' } });
    const tokens = users.map(u => u.pushToken).filter((t): t is string => !!t);
    const result = await this.notificationsService.sendPushBatch(tokens, title, body);
    return { ok: true, ...result };
  }

  async sendPushToUser(userId: string, title: string, body: string) {
    const u = await this.usersRepo.findOne({ where: { id: userId } });
    if (!u?.pushToken) return { ok: false, reason: 'No push token', sent: 0, failed: 0 };
    const result = await this.notificationsService.sendPushBatch([u.pushToken], title, body);
    return { ok: result.sent > 0, ...result };
  }

  // ── Cuisines ──────────────────────────────────────────────────────────────
  async createCuisine(data: { name: string; slug: string; icon?: string }) {
    return this.cuisinesRepo.save(this.cuisinesRepo.create(data));
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

  // ── Collections ───────────────────────────────────────────────────────────
  async getAdminCollections() {
    return this.collectionsRepo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async createCollection(data: Partial<Collection>) {
    return this.collectionsRepo.save(this.collectionsRepo.create(data));
  }

  async updateCollection(id: string, data: Partial<Collection>) {
    await this.collectionsRepo.update(id, data);
    return this.collectionsRepo.findOne({ where: { id } });
  }

  async deleteCollection(id: string) {
    const c = await this.collectionsRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException();
    await this.collectionsRepo.remove(c);
    return { ok: true };
  }

  async reorderCollections(orders: { id: string; sortOrder: number }[]) {
    await Promise.all(orders.map(o => this.collectionsRepo.update(o.id, { sortOrder: o.sortOrder })));
    return { ok: true };
  }

  // ── Home Sections ─────────────────────────────────────────────────────────
  async getAdminHomeSections() {
    return this.sectionsRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async toggleHomeSection(key: string) {
    const s = await this.sectionsRepo.findOne({ where: { sectionKey: key } });
    if (!s) throw new NotFoundException();
    const isActive = !s.isActive;
    await this.sectionsRepo.update(s.id, { isActive });
    return { ...s, isActive };
  }

  async reorderHomeSections(orders: { sectionKey: string; sortOrder: number }[]) {
    await Promise.all(orders.map(o =>
      this.sectionsRepo.update({ sectionKey: o.sectionKey }, { sortOrder: o.sortOrder }),
    ));
    return { ok: true };
  }
}
