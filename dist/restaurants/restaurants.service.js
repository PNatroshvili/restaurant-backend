"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const restaurant_entity_1 = require("../entities/restaurant.entity");
const menu_category_entity_1 = require("../entities/menu-category.entity");
let RestaurantsService = class RestaurantsService {
    repo;
    menuRepo;
    constructor(repo, menuRepo) {
        this.repo = repo;
        this.menuRepo = menuRepo;
    }
    async findAll(filters) {
        const { q, city, district, cuisine_id, min_rating, page = 1, limit = 20 } = filters;
        const qb = this.repo.createQueryBuilder('r')
            .leftJoinAndSelect('r.cuisine', 'cuisine')
            .leftJoinAndSelect('r.photos', 'photos', 'photos.isCover = true')
            .where('r.status = :status', { status: 'approved' });
        if (q)
            qb.andWhere('r.name ILIKE :q OR r.description ILIKE :q', { q: `%${q}%` });
        if (city)
            qb.andWhere('r.city = :city', { city });
        if (district)
            qb.andWhere('r.district = :district', { district });
        if (cuisine_id)
            qb.andWhere('r.cuisineId = :cuisine_id', { cuisine_id });
        if (min_rating)
            qb.andWhere('r.ratingAvg >= :min_rating', { min_rating });
        const [data, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('r.ratingAvg', 'DESC')
            .getManyAndCount();
        return { data: data.map(this.mapCoverPhoto), total, page, limit };
    }
    async findNearby(lat, lng, radius) {
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
    async findById(id) {
        const r = await this.repo.findOne({
            where: { id },
            relations: ['cuisine', 'photos', 'workingHours'],
        });
        if (!r)
            throw new common_1.NotFoundException('Restaurant not found');
        return r;
    }
    async getMenu(restaurantId) {
        return this.menuRepo.find({
            where: { restaurantId },
            relations: ['items'],
            order: { sortOrder: 'ASC' },
        });
    }
    async create(dto, user) {
        const r = this.repo.create({ ...dto, ownerId: user.id });
        return this.repo.save(r);
    }
    async update(id, dto, user) {
        const r = await this.findById(id);
        if (r.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
        Object.assign(r, dto);
        return this.repo.save(r);
    }
    async remove(id, user) {
        const r = await this.findById(id);
        if (r.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
        await this.repo.remove(r);
    }
    mapCoverPhoto = (r) => {
        const cover = r.photos?.find((p) => p.isCover) || r.photos?.[0];
        return { ...r, cover_photo: cover?.url || null };
    };
};
exports.RestaurantsService = RestaurantsService;
exports.RestaurantsService = RestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(restaurant_entity_1.Restaurant)),
    __param(1, (0, typeorm_1.InjectRepository)(menu_category_entity_1.MenuCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RestaurantsService);
//# sourceMappingURL=restaurants.service.js.map