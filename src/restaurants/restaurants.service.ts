import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    min_rating?: number; is_open?: boolean; page?: number; limit?: number;
  }) {
    const { q, city, district, cuisine_id, min_rating, page = 1, limit = 20 } = filters;
    const qb = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.cuisine', 'cuisine')
      .leftJoinAndSelect('r.photos', 'photos', 'photos.isCover = true')
      .where('r.status = :status', { status: 'approved' });

    if (q) qb.andWhere('r.name ILIKE :q OR r.description ILIKE :q', { q: `%${q}%` });
    if (city) qb.andWhere('r.city = :city', { city });
    if (district) qb.andWhere('r.district = :district', { district });
    if (cuisine_id) qb.andWhere('r.cuisineId = :cuisine_id', { cuisine_id });
    if (min_rating) qb.andWhere('r.ratingAvg >= :min_rating', { min_rating });

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('r.ratingAvg', 'DESC')
      .getManyAndCount();

    return { data: data.map(this.mapCoverPhoto), total, page, limit };
  }

  async findNearby(lat: number, lng: number, radius: number) {
    const results = await this.repo.query(`
      SELECT * FROM (
        SELECT r.*,
          (6371000 * acos(LEAST(1, cos(radians($1)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians($2)) + sin(radians($1)) * sin(radians(r.latitude))))) AS distance
        FROM restaurants r
        WHERE r.status = 'approved'
      ) sub
      WHERE sub.distance < $3
      ORDER BY sub.distance
      LIMIT 50
    `, [lat, lng, radius]);
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

  async updateDiscount(id: string, discountPercent: number, user: User) {
    const r = await this.findById(id);
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
