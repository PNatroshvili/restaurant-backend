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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const restaurant_entity_1 = require("../entities/restaurant.entity");
const user_entity_1 = require("../entities/user.entity");
const review_entity_1 = require("../entities/review.entity");
const booking_entity_1 = require("../entities/booking.entity");
const cuisine_entity_1 = require("../entities/cuisine.entity");
const collection_entity_1 = require("../entities/collection.entity");
const home_section_entity_1 = require("../entities/home-section.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let AdminService = class AdminService {
    restaurantsRepo;
    usersRepo;
    reviewsRepo;
    bookingsRepo;
    cuisinesRepo;
    collectionsRepo;
    sectionsRepo;
    notificationsService;
    constructor(restaurantsRepo, usersRepo, reviewsRepo, bookingsRepo, cuisinesRepo, collectionsRepo, sectionsRepo, notificationsService) {
        this.restaurantsRepo = restaurantsRepo;
        this.usersRepo = usersRepo;
        this.reviewsRepo = reviewsRepo;
        this.bookingsRepo = bookingsRepo;
        this.cuisinesRepo = cuisinesRepo;
        this.collectionsRepo = collectionsRepo;
        this.sectionsRepo = sectionsRepo;
        this.notificationsService = notificationsService;
    }
    async onModuleInit() {
        await this.seedHomeSections();
        await this.seedCollections();
    }
    async seedHomeSections() {
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
            if (!exists)
                await this.sectionsRepo.save(this.sectionsRepo.create(d));
        }
    }
    async seedCollections() {
        const count = await this.collectionsRepo.count();
        if (count > 0)
            return;
        const defaults = [
            { titleKa: 'წყვილებისთვის', subtitle: 'რომანტიული ვახშამი', emoji: '💑', accent: '#8B4FCE', bg: '#1A0D2D', sortOrder: 1 },
            { titleKa: 'ოჯახური', subtitle: 'ბავშვებისთვის', emoji: '👨‍👩‍👧', accent: '#27AE60', bg: '#0D2018', sortOrder: 2 },
            { titleKa: 'პრემიუმ', subtitle: 'ლუქს გამოცდილება', emoji: '✨', accent: '#F59E0B', bg: '#241800', sortOrder: 3 },
            { titleKa: 'სწრაფი', subtitle: '30 წუთამდე', emoji: '⚡', accent: '#3B82F6', bg: '#0A1528', sortOrder: 4 },
            { titleKa: 'ფარული', subtitle: 'ადგილობრივის საიდუმლო', emoji: '🗝️', accent: '#EC4899', bg: '#1F0A1A', sortOrder: 5 },
        ];
        await this.collectionsRepo.save(defaults.map(d => this.collectionsRepo.create(d)));
    }
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalRestaurants, pendingRestaurants, totalBookings, todayBookings, totalUsers, totalReviews, pendingReviews] = await Promise.all([
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
    async getRestaurants(params) {
        const { status, q, page, limit } = params;
        const qb = this.restaurantsRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.cuisine', 'cuisine')
            .leftJoinAndSelect('r.photos', 'photos', 'photos.is_cover = true')
            .orderBy('r.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (status)
            qb.andWhere('r.status = :status', { status });
        if (q)
            qb.andWhere('r.name LIKE :q OR r.address LIKE :q', { q: `%${q}%` });
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }
    async getRestaurantById(id) {
        const r = await this.restaurantsRepo.findOne({
            where: { id },
            relations: ['cuisine', 'photos', 'workingHours', 'owner'],
        });
        if (!r)
            throw new common_1.NotFoundException();
        return r;
    }
    async updateRestaurant(id, data) {
        await this.restaurantsRepo.update(id, data);
        return this.getRestaurantById(id);
    }
    async updateRestaurantStatus(id, status) {
        await this.restaurantsRepo.update(id, { status: status });
        return { ok: true };
    }
    async createRestaurant(data) {
        let ownerId = data.ownerId;
        if (!ownerId) {
            const admin = await this.usersRepo.findOne({ where: { role: 'admin' } });
            ownerId = admin.id;
        }
        const r = this.restaurantsRepo.create({ ...data, ownerId, status: 'approved' });
        return this.restaurantsRepo.save(r);
    }
    async deleteRestaurant(id) {
        const r = await this.restaurantsRepo.findOne({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException();
        await this.restaurantsRepo.remove(r);
        return { ok: true };
    }
    async getBookings(params) {
        const { status, page, limit } = params;
        const qb = this.bookingsRepo.createQueryBuilder('b')
            .leftJoinAndSelect('b.restaurant', 'restaurant')
            .leftJoinAndSelect('b.user', 'user')
            .orderBy('b.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (status)
            qb.andWhere('b.status = :status', { status });
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }
    async getBookingById(id) {
        const b = await this.bookingsRepo.findOne({
            where: { id },
            relations: ['restaurant', 'user'],
        });
        if (!b)
            throw new common_1.NotFoundException();
        return b;
    }
    async getUsers(params) {
        const { role, q, page, limit } = params;
        const qb = this.usersRepo.createQueryBuilder('u')
            .orderBy('u.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (role)
            qb.andWhere('u.role = :role', { role });
        if (q)
            qb.andWhere('u.name LIKE :q OR u.email LIKE :q OR u.phone LIKE :q', { q: `%${q}%` });
        const [data, total] = await qb.getManyAndCount();
        return { data: data.map(({ passwordHash, ...u }) => u), total, page, limit };
    }
    async getUserById(id) {
        const u = await this.usersRepo.findOne({ where: { id } });
        if (!u)
            throw new common_1.NotFoundException();
        const [bookings, reviews] = await Promise.all([
            this.bookingsRepo.find({ where: { userId: id }, relations: ['restaurant'], order: { createdAt: 'DESC' }, take: 10 }),
            this.reviewsRepo.find({ where: { userId: id }, relations: ['restaurant'], order: { createdAt: 'DESC' }, take: 10 }),
        ]);
        const { passwordHash, ...safeUser } = u;
        return { ...safeUser, bookings, reviews };
    }
    async setUserStatus(id, status) {
        await this.usersRepo.update(id, { status });
        return { ok: true };
    }
    async setUserRole(id, role) {
        await this.usersRepo.update(id, { role: role });
        return { ok: true };
    }
    async verifyUserEmail(id) {
        await this.usersRepo.update(id, {
            emailVerified: true,
            emailVerifyCode: null,
            emailVerifyExpires: null,
        });
        return { ok: true };
    }
    async deleteUser(id) {
        const u = await this.usersRepo.findOne({ where: { id } });
        if (!u)
            throw new common_1.NotFoundException();
        await this.usersRepo.remove(u);
        return { ok: true };
    }
    async getReviews(params) {
        const { status, page, limit } = params;
        const qb = this.reviewsRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.user', 'user')
            .leftJoinAndSelect('r.restaurant', 'restaurant')
            .orderBy('r.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (status)
            qb.andWhere('r.status = :status', { status });
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }
    async updateReviewStatus(id, status) {
        await this.reviewsRepo.update(id, { status });
        return { ok: true };
    }
    async deleteReview(id) {
        const r = await this.reviewsRepo.findOne({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException();
        await this.reviewsRepo.remove(r);
        return { ok: true };
    }
    async sendPushToAll(title, body) {
        const users = await this.usersRepo.find({ where: { status: 'active' } });
        const tokens = users.map(u => u.pushToken).filter((t) => !!t);
        const result = await this.notificationsService.sendPushBatch(tokens, title, body);
        return { ok: true, ...result };
    }
    async sendPushToUser(userId, title, body) {
        const u = await this.usersRepo.findOne({ where: { id: userId } });
        if (!u?.pushToken)
            return { ok: false, reason: 'No push token', sent: 0, failed: 0 };
        const result = await this.notificationsService.sendPushBatch([u.pushToken], title, body);
        return { ok: result.sent > 0, ...result };
    }
    async createCuisine(data) {
        return this.cuisinesRepo.save(this.cuisinesRepo.create(data));
    }
    async updateCuisine(id, data) {
        await this.cuisinesRepo.update(id, data);
        return this.cuisinesRepo.findOne({ where: { id } });
    }
    async deleteCuisine(id) {
        const c = await this.cuisinesRepo.findOne({ where: { id } });
        if (!c)
            throw new common_1.NotFoundException();
        await this.cuisinesRepo.remove(c);
        return { ok: true };
    }
    async getAdminCollections() {
        return this.collectionsRepo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    }
    async createCollection(data) {
        return this.collectionsRepo.save(this.collectionsRepo.create(data));
    }
    async updateCollection(id, data) {
        await this.collectionsRepo.update(id, data);
        return this.collectionsRepo.findOne({ where: { id } });
    }
    async deleteCollection(id) {
        const c = await this.collectionsRepo.findOne({ where: { id } });
        if (!c)
            throw new common_1.NotFoundException();
        await this.collectionsRepo.remove(c);
        return { ok: true };
    }
    async reorderCollections(orders) {
        await Promise.all(orders.map(o => this.collectionsRepo.update(o.id, { sortOrder: o.sortOrder })));
        return { ok: true };
    }
    async getAdminHomeSections() {
        return this.sectionsRepo.find({ order: { sortOrder: 'ASC' } });
    }
    async toggleHomeSection(key) {
        const s = await this.sectionsRepo.findOne({ where: { sectionKey: key } });
        if (!s)
            throw new common_1.NotFoundException();
        const isActive = !s.isActive;
        await this.sectionsRepo.update(s.id, { isActive });
        return { ...s, isActive };
    }
    async reorderHomeSections(orders) {
        await Promise.all(orders.map(o => this.sectionsRepo.update({ sectionKey: o.sectionKey }, { sortOrder: o.sortOrder })));
        return { ok: true };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(restaurant_entity_1.Restaurant)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(3, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(4, (0, typeorm_1.InjectRepository)(cuisine_entity_1.Cuisine)),
    __param(5, (0, typeorm_1.InjectRepository)(collection_entity_1.Collection)),
    __param(6, (0, typeorm_1.InjectRepository)(home_section_entity_1.HomeSection)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map