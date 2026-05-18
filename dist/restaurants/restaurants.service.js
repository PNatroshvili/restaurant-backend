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
const menu_item_entity_1 = require("../entities/menu-item.entity");
const restaurant_photo_entity_1 = require("../entities/restaurant-photo.entity");
const working_hour_entity_1 = require("../entities/working-hour.entity");
const upload_service_1 = require("../upload/upload.service");
let RestaurantsService = class RestaurantsService {
    repo;
    menuRepo;
    itemRepo;
    photoRepo;
    hoursRepo;
    uploadService;
    constructor(repo, menuRepo, itemRepo, photoRepo, hoursRepo, uploadService) {
        this.repo = repo;
        this.menuRepo = menuRepo;
        this.itemRepo = itemRepo;
        this.photoRepo = photoRepo;
        this.hoursRepo = hoursRepo;
        this.uploadService = uploadService;
    }
    async findAll(filters) {
        const { q, city, district, cuisine_id, min_rating, is_open, page = 1, limit = 20 } = filters;
        const qb = this.repo.createQueryBuilder('r')
            .leftJoinAndSelect('r.cuisine', 'cuisine')
            .leftJoinAndSelect('r.photos', 'photos', 'photos.isCover = true')
            .leftJoinAndSelect('r.workingHours', 'workingHours')
            .where('r.status = :status', { status: 'approved' });
        if (q)
            qb.andWhere('r.name LIKE :q OR r.description LIKE :q', { q: `%${q}%` });
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
        const mapped = data.map(r => ({
            ...this.mapCoverPhoto(r),
            isOpen: this.calcIsOpen(r.workingHours || []),
        }));
        const filtered = is_open ? mapped.filter(r => r.isOpen) : mapped;
        return { data: filtered, total: is_open ? filtered.length : total, page, limit };
    }
    calcIsOpen(hours) {
        if (!hours.length)
            return false;
        const now = new Date();
        const day = now.getDay();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const today = hours.find(h => h.day === day);
        if (!today || today.isClosed)
            return false;
        return hhmm >= today.open && hhmm <= today.close;
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
    async getMyRestaurant(userId) {
        const r = await this.repo.findOne({
            where: { ownerId: userId },
            relations: ['cuisine', 'photos', 'workingHours', 'menuCategories', 'menuCategories.items'],
        });
        if (!r)
            throw new common_1.NotFoundException('No restaurant linked to this account');
        return this.mapCoverPhoto(r);
    }
    async updateInfo(id, dto, user) {
        const r = await this.findById(id);
        if (r.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
        Object.assign(r, dto);
        return this.repo.save(r);
    }
    async updateDiscount(id, discountPercent, user) {
        const r = await this.findById(id);
        if (r.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
        r.discountPercent = discountPercent;
        return this.repo.save(r);
    }
    async updateWorkingHours(id, hours, user) {
        const r = await this.findById(id);
        if (r.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
        await this.hoursRepo.delete({ restaurantId: id });
        const rows = hours.map((h) => this.hoursRepo.create({ ...h, restaurantId: id }));
        return this.hoursRepo.save(rows);
    }
    async addMenuCategory(restaurantId, name, user) {
        await this.assertOwner(restaurantId, user);
        const count = await this.menuRepo.count({ where: { restaurantId } });
        const cat = this.menuRepo.create({ restaurantId, name, sortOrder: count });
        return this.menuRepo.save(cat);
    }
    async updateMenuCategory(restaurantId, catId, name, user) {
        await this.assertOwner(restaurantId, user);
        const cat = await this.menuRepo.findOne({ where: { id: catId, restaurantId } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        cat.name = name;
        return this.menuRepo.save(cat);
    }
    async deleteMenuCategory(restaurantId, catId, user) {
        await this.assertOwner(restaurantId, user);
        const cat = await this.menuRepo.findOne({ where: { id: catId, restaurantId } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        await this.menuRepo.remove(cat);
    }
    async addMenuItem(restaurantId, catId, dto, user, file) {
        await this.assertOwner(restaurantId, user);
        let photoUrl;
        if (file)
            photoUrl = await this.uploadService.uploadFile(file, 'menu');
        const item = this.itemRepo.create({ ...dto, categoryId: catId, photoUrl });
        return this.itemRepo.save(item);
    }
    async updateMenuItem(restaurantId, itemId, dto, user, file) {
        await this.assertOwner(restaurantId, user);
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        Object.assign(item, dto);
        if (file)
            item.photoUrl = await this.uploadService.uploadFile(file, 'menu');
        return this.itemRepo.save(item);
    }
    async deleteMenuItem(restaurantId, itemId, user) {
        await this.assertOwner(restaurantId, user);
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        await this.itemRepo.remove(item);
    }
    async uploadPhoto(restaurantId, file, isCover, user) {
        await this.assertOwner(restaurantId, user);
        const url = await this.uploadService.uploadFile(file, 'restaurants');
        const count = await this.photoRepo.count({ where: { restaurantId } });
        if (isCover) {
            await this.photoRepo.update({ restaurantId }, { isCover: false });
        }
        const photo = this.photoRepo.create({ restaurantId, url, isCover, sortOrder: count });
        return this.photoRepo.save(photo);
    }
    async setCoverPhoto(restaurantId, photoId, user) {
        await this.assertOwner(restaurantId, user);
        await this.photoRepo.update({ restaurantId }, { isCover: false });
        const photo = await this.photoRepo.findOne({ where: { id: photoId, restaurantId } });
        if (!photo)
            throw new common_1.NotFoundException('Photo not found');
        photo.isCover = true;
        return this.photoRepo.save(photo);
    }
    async deletePhoto(restaurantId, photoId, user) {
        await this.assertOwner(restaurantId, user);
        const photo = await this.photoRepo.findOne({ where: { id: photoId, restaurantId } });
        if (!photo)
            throw new common_1.NotFoundException('Photo not found');
        await this.photoRepo.remove(photo);
    }
    async adminListAll() {
        const users = await this.repo.manager.query(`SELECT id, name, email, role FROM users WHERE role IN ('restaurant_manager','admin') ORDER BY role, name`);
        const restaurants = await this.repo.manager.query(`SELECT id, name, owner_id FROM restaurants ORDER BY name`);
        return { users, restaurants };
    }
    async adminLinkManager(managerId, restaurantId) {
        await this.repo.manager.query(`UPDATE restaurants SET owner_id = $1 WHERE id = $2`, [managerId, restaurantId]);
        return { ok: true, managerId, restaurantId };
    }
    async assertOwner(restaurantId, user) {
        const r = await this.repo.findOne({ where: { id: restaurantId }, select: ['ownerId'] });
        if (!r)
            throw new common_1.NotFoundException('Restaurant not found');
        if (r.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
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
    __param(2, (0, typeorm_1.InjectRepository)(menu_item_entity_1.MenuItem)),
    __param(3, (0, typeorm_1.InjectRepository)(restaurant_photo_entity_1.RestaurantPhoto)),
    __param(4, (0, typeorm_1.InjectRepository)(working_hour_entity_1.WorkingHour)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        upload_service_1.UploadService])
], RestaurantsService);
//# sourceMappingURL=restaurants.service.js.map