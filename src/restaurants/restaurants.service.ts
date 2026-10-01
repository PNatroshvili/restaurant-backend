import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { MenuCategory } from '../entities/menu-category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { RestaurantPhoto } from '../entities/restaurant-photo.entity';
import { WorkingHour } from '../entities/working-hour.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { User } from '../entities/user.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant) private repo: Repository<Restaurant>,
    @InjectRepository(MenuCategory) private menuRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem) private itemRepo: Repository<MenuItem>,
    @InjectRepository(RestaurantPhoto) private photoRepo: Repository<RestaurantPhoto>,
    @InjectRepository(WorkingHour) private hoursRepo: Repository<WorkingHour>,
    private uploadService: UploadService,
  ) {}

  async findAll(filters: {
    q?: string; city?: string; district?: string; cuisine_id?: string;
    min_rating?: number; is_open?: boolean; offers?: boolean; page?: number; limit?: number;
    sort?: 'rating' | 'name' | 'discount' | 'distance';
    lat?: number; lng?: number; radius?: number;
  }) {
    const { q, city, district, cuisine_id, min_rating, is_open, offers, page = 1, limit = 20, sort = 'rating', lat, lng, radius } = filters;
    const qb = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.cuisine', 'cuisine')
      .leftJoinAndSelect('r.photos', 'photos', 'photos.isCover = true')
      .leftJoinAndSelect('r.workingHours', 'workingHours')
      .where('r.status = :status', { status: 'approved' });

    if (q) qb.andWhere(
      'r.name LIKE :q OR r.description LIKE :q OR r.address LIKE :q OR r.district LIKE :q OR cuisine.name LIKE :q',
      { q: `%${q}%` },
    );
    if (city) qb.andWhere('r.city = :city', { city });
    if (district) qb.andWhere('r.district = :district', { district });
    if (cuisine_id) qb.andWhere('r.cuisineId = :cuisine_id', { cuisine_id });
    if (min_rating) qb.andWhere('r.ratingAvg >= :min_rating', { min_rating });
    const numericLat = Number(lat);
    const numericLng = Number(lng);
    const numericRadius = Number(radius);
    const hasGeo = Number.isFinite(numericLat) && Number.isFinite(numericLng) && Number.isFinite(numericRadius) && numericRadius > 0;
    if (hasGeo) {
      qb.addSelect('(6371000 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(r.latitude)))))', 'distance')
        .andWhere('(6371000 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(r.latitude))))) <= :radius', { lat: numericLat, lng: numericLng, radius: numericRadius });
    }
    if (String(offers) === 'true') {
      qb.andWhere(`(
        COALESCE(r.discountPercent, 0) > 0 OR EXISTS (
          SELECT 1 FROM restaurant_offers ro
          WHERE ro.restaurant_id = r.id
            AND ro.is_active = 1
            AND (ro.start_date IS NULL OR ro.start_date <= CURDATE())
            AND (ro.end_date IS NULL OR ro.end_date >= CURDATE())
            AND (ro.start_time IS NULL OR ro.start_time <= CURTIME())
            AND (ro.end_time IS NULL OR ro.end_time >= CURTIME())
        )
      )`);
    }

    if (sort === 'name') qb.orderBy('r.name', 'ASC');
    else if (sort === 'discount') qb.orderBy('r.discountPercent', 'DESC').addOrderBy('r.ratingAvg', 'DESC');
    else if (sort === 'distance' && hasGeo) qb.orderBy('distance', 'ASC');
    else qb.orderBy('r.ratingAvg', 'DESC').addOrderBy('r.reviewsCount', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(Math.min(Math.max(Number(limit) || 20, 1), 100))
      .getManyAndCount();

    const menuPrices = await this.itemRepo
      .createQueryBuilder('mi')
      .innerJoin('menu_categories', 'mc', 'mc.id = mi.categoryId')
      .select('mc.restaurant_id', 'restaurantId')
      .addSelect('AVG(mi.price)', 'avgPrice')
      .where('mi.isAvailable = :available', { available: true })
      .groupBy('mc.restaurant_id')
      .getRawMany<{ restaurantId: string; avgPrice: string | number }>();

    const priceByRestaurant = new Map(
      menuPrices.map(row => [row.restaurantId, Number(row.avgPrice)]),
    );

    const getPriceLevel = (avgPrice: number | undefined): '1' | '2' | '3' | null => {
      if (!Number.isFinite(avgPrice)) return null;
      if ((avgPrice as number) < 15) return '1';
      if ((avgPrice as number) < 30) return '2';
      return '3';
    };

    const mapped = data.map(r => {
      const avgMenuPrice = priceByRestaurant.get(r.id);
      return {
        ...this.mapCoverPhoto(r),
        isOpen: this.calcIsOpen(r.workingHours || []),
        avgMenuPrice: Number.isFinite(avgMenuPrice) ? avgMenuPrice : null,
        priceLevel: getPriceLevel(avgMenuPrice),
      };
    });

    const filtered = is_open ? mapped.filter(r => r.isOpen) : mapped;
    return { data: filtered, total: is_open ? filtered.length : total, page, limit: Math.min(Math.max(Number(limit) || 20, 1), 100) };
  }

  private calcIsOpen(hours: WorkingHour[]): boolean {
    if (!hours.length) return false;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tbilisi',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[map.weekday];
    const hhmm = String(map.hour) + ':' + String(map.minute);
    const today = hours.find(h => h.day === day);
    if (!today || today.isClosed || !today.open || !today.close) return false;
    return hhmm >= today.open && hhmm <= today.close;
  }

  async findNearby(lat: number, lng: number, radius: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0) {
      throw new BadRequestException('Invalid location parameters');
    }
    const results = await this.repo.query(`
      SELECT * FROM (
        SELECT r.*,
          (6371000 * acos(LEAST(1, cos(radians(?)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(?)) + sin(radians(?)) * sin(radians(r.latitude))))) AS distance
        FROM restaurants r
        WHERE r.status = 'approved'
      ) sub
      WHERE sub.distance < ?
      ORDER BY sub.distance
      LIMIT 50
    `, [lat, lng, lat, radius]);
    return results;
  }

  async findById(id: string) {
    const r = await this.repo.findOne({
      where: { id },
      relations: ['cuisine', 'photos', 'workingHours'],
    });
    if (!r) throw new NotFoundException('Restaurant not found');
    return r;
  }

  async findPublicById(id: string) {
    const r = await this.repo.findOne({
      where: { id, status: 'approved' },
      relations: ['cuisine', 'photos', 'workingHours'],
    });
    if (!r) throw new NotFoundException('Restaurant not found');
    const avgMenuPriceRaw = await this.itemRepo
      .createQueryBuilder('mi')
      .innerJoin('menu_categories', 'mc', 'mc.id = mi.categoryId')
      .select('AVG(mi.price)', 'avgPrice')
      .where('mc.restaurant_id = :restaurantId', { restaurantId: id })
      .andWhere('mi.isAvailable = :available', { available: true })
      .getRawOne<{ avgPrice?: string | number }>();
    const avgMenuPrice = Number(avgMenuPriceRaw?.avgPrice);
    const priceLevel = Number.isFinite(avgMenuPrice)
      ? (avgMenuPrice < 15 ? '1' : avgMenuPrice < 30 ? '2' : '3')
      : null;
    return {
      ...this.mapCoverPhoto(r),
      isOpen: this.calcIsOpen(r.workingHours || []),
      avgMenuPrice: Number.isFinite(avgMenuPrice) ? avgMenuPrice : null,
      priceLevel,
    };
  }

  async getMenu(restaurantId: string) {
    return this.menuRepo.find({
      where: { restaurantId },
      relations: ['items'],
      order: { sortOrder: 'ASC' },
    });
  }

  async create(dto: CreateRestaurantDto, user: User) {
    const r = this.repo.create({ ...dto, ownerId: user.id });
    return this.repo.save(r);
  }

  async update(id: string, dto: Partial<CreateRestaurantDto>, user: User) {
    const r = await this.findById(id);
    if (r.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    Object.assign(r, dto);
    return this.repo.save(r);
  }

  async remove(id: string, user: User) {
    const r = await this.findById(id);
    if (r.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    await this.repo.remove(r);
  }

  // ── Manager: own restaurant ──────────────────────────────────────────────

  async getMyRestaurant(userId: string) {
    const r = await this.repo.findOne({
      where: { ownerId: userId },
      relations: ['cuisine', 'photos', 'workingHours', 'menuCategories', 'menuCategories.items'],
    });
    if (!r) throw new NotFoundException('No restaurant linked to this account');
    return this.mapCoverPhoto(r);
  }

  // ── Manager: basic info ──────────────────────────────────────────────────

  async updateInfo(id: string, dto: {
    name?: string; description?: string; address?: string;
    city?: string; district?: string; phone?: string;
  }, user: User) {
    const r = await this.findById(id);
    if (r.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    Object.assign(r, dto);
    return this.repo.save(r);
  }

  // ── Manager: discount ────────────────────────────────────────────────────

  async updateDiscount(id: string, discountPercent: number | null, user: User) {
    const r = await this.findById(id);
    if (discountPercent !== null && (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 90)) {
      throw new BadRequestException('Discount must be between 0 and 90 percent');
    }
    if (r.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    r.discountPercent = discountPercent;
    return this.repo.save(r);
  }

  // ── Manager: working hours ───────────────────────────────────────────────

  async updateWorkingHours(id: string, hours: Array<{
    day: number; open?: string; close?: string; isClosed: boolean;
  }>, user: User) {
    const r = await this.findById(id);
    if (r.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    await this.hoursRepo.delete({ restaurantId: id });
    const rows = hours.map((h) => this.hoursRepo.create({ ...h, restaurantId: id }));
    return this.hoursRepo.save(rows);
  }

  // ── Manager: menu categories ─────────────────────────────────────────────

  async addMenuCategory(restaurantId: string, name: string, user: User) {
    await this.assertOwner(restaurantId, user);
    const count = await this.menuRepo.count({ where: { restaurantId } });
    const cat = this.menuRepo.create({ restaurantId, name, sortOrder: count });
    return this.menuRepo.save(cat);
  }

  async updateMenuCategory(restaurantId: string, catId: string, name: string, user: User) {
    await this.assertOwner(restaurantId, user);
    const cat = await this.menuRepo.findOne({ where: { id: catId, restaurantId } });
    if (!cat) throw new NotFoundException('Category not found');
    cat.name = name;
    return this.menuRepo.save(cat);
  }

  async deleteMenuCategory(restaurantId: string, catId: string, user: User) {
    await this.assertOwner(restaurantId, user);
    const cat = await this.menuRepo.findOne({ where: { id: catId, restaurantId } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.menuRepo.remove(cat);
  }

  // ── Manager: menu items ──────────────────────────────────────────────────

  async addMenuItem(restaurantId: string, catId: string, dto: {
    name: string; description?: string; price: number; isAvailable?: boolean;
  }, user: User, file?: Express.Multer.File) {
    await this.assertOwner(restaurantId, user);
    let photoUrl: string | undefined;
    if (file) photoUrl = await this.uploadService.uploadFile(file, 'menu');
    const item = this.itemRepo.create({ ...dto, categoryId: catId, photoUrl });
    return this.itemRepo.save(item);
  }

  async updateMenuItem(restaurantId: string, itemId: string, dto: {
    name?: string; description?: string; price?: number; isAvailable?: boolean;
  }, user: User, file?: Express.Multer.File) {
    await this.assertOwner(restaurantId, user);
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');
    Object.assign(item, dto);
    if (file) item.photoUrl = await this.uploadService.uploadFile(file, 'menu');
    return this.itemRepo.save(item);
  }

  async deleteMenuItem(restaurantId: string, itemId: string, user: User) {
    await this.assertOwner(restaurantId, user);
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');
    await this.itemRepo.remove(item);
  }

  // ── Manager: photos ──────────────────────────────────────────────────────

  async uploadPhoto(restaurantId: string, file: Express.Multer.File, isCover: boolean, user: User) {
    await this.assertOwner(restaurantId, user);
    const url = await this.uploadService.uploadFile(file, 'restaurants');
    const count = await this.photoRepo.count({ where: { restaurantId } });
    if (isCover) {
      await this.photoRepo.update({ restaurantId }, { isCover: false });
    }
    const photo = this.photoRepo.create({ restaurantId, url, isCover, sortOrder: count });
    return this.photoRepo.save(photo);
  }

  async setCoverPhoto(restaurantId: string, photoId: string, user: User) {
    await this.assertOwner(restaurantId, user);
    await this.photoRepo.update({ restaurantId }, { isCover: false });
    const photo = await this.photoRepo.findOne({ where: { id: photoId, restaurantId } });
    if (!photo) throw new NotFoundException('Photo not found');
    photo.isCover = true;
    return this.photoRepo.save(photo);
  }

  async deletePhoto(restaurantId: string, photoId: string, user: User) {
    await this.assertOwner(restaurantId, user);
    const photo = await this.photoRepo.findOne({ where: { id: photoId, restaurantId } });
    if (!photo) throw new NotFoundException('Photo not found');
    await this.photoRepo.remove(photo);
  }

  // ── Temporary admin helpers ──────────────────────────────────────────────

  async adminListAll() {
    const users = await this.repo.manager.query(
      `SELECT id, name, email, role FROM users WHERE role IN ('restaurant_manager','admin') ORDER BY role, name`
    );
    const restaurants = await this.repo.manager.query(
      `SELECT id, name, owner_id FROM restaurants ORDER BY name`
    );
    return { users, restaurants };
  }

  async adminLinkManager(managerId: string, restaurantId: string) {
    await this.repo.manager.query(
      `UPDATE restaurants SET owner_id = $1 WHERE id = $2`,
      [managerId, restaurantId]
    );
    return { ok: true, managerId, restaurantId };
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async assertOwner(restaurantId: string, user: User) {
    const r = await this.repo.findOne({ where: { id: restaurantId }, select: ['ownerId'] });
    if (!r) throw new NotFoundException('Restaurant not found');
    if (r.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
  }

  private mapCoverPhoto = (r: Restaurant) => {
    const cover = r.photos?.find((p) => p.isCover) || r.photos?.[0];
    return { ...r, cover_photo: cover?.url || null };
  };
}
