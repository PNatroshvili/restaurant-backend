import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { MenuCategory } from '../entities/menu-category.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant) private repo: Repository<Restaurant>,
    @InjectRepository(MenuCategory) private menuRepo: Repository<MenuCategory>,
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

  private mapCoverPhoto = (r: Restaurant) => {
    const cover = r.photos?.find((p) => p.isCover) || r.photos?.[0];
    return { ...r, cover_photo: cover?.url || null };
  };
}
