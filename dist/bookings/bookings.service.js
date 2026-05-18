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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../entities/booking.entity");
const restaurant_entity_1 = require("../entities/restaurant.entity");
const user_entity_1 = require("../entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const bookings_gateway_1 = require("./bookings.gateway");
const POINTS_PER_BOOKING = 100;
let BookingsService = class BookingsService {
    repo;
    restaurantRepo;
    userRepo;
    notificationsService;
    bookingsGateway;
    constructor(repo, restaurantRepo, userRepo, notificationsService, bookingsGateway) {
        this.repo = repo;
        this.restaurantRepo = restaurantRepo;
        this.userRepo = userRepo;
        this.notificationsService = notificationsService;
        this.bookingsGateway = bookingsGateway;
    }
    async create(dto, user) {
        const booking = this.repo.create({
            restaurantId: dto.restaurant_id,
            date: dto.date,
            time: dto.time,
            guestsCount: dto.guests_count,
            comment: dto.comment,
            userId: user.id,
        });
        const saved = await this.repo.save(booking);
        const restaurant = await this.restaurantRepo.findOne({
            where: { id: dto.restaurant_id },
            select: ['ownerId', 'name'],
        });
        if (restaurant?.ownerId) {
            const full = await this.repo.findOne({ where: { id: saved.id }, relations: ['user', 'restaurant'] });
            this.bookingsGateway.emitNewBooking(restaurant.ownerId, full);
            const manager = await this.userRepo.findOne({ where: { id: restaurant.ownerId }, select: ['pushToken'] });
            if (manager?.pushToken) {
                await this.notificationsService.sendPushNotification(manager.pushToken, '🔔 ახალი ჯავშანი', `${user.name} — ${dto.date} ${dto.time}, ${dto.guests_count} სტუმარი`, { bookingId: saved.id });
            }
        }
        return saved;
    }
    async findMy(user) {
        return this.repo.find({
            where: { userId: user.id },
            relations: ['restaurant'],
            order: { createdAt: 'DESC' },
        });
    }
    async findMyRestaurantBookings(user) {
        const restaurants = await this.restaurantRepo.find({ where: { ownerId: user.id }, select: ['id'] });
        if (!restaurants.length)
            throw new common_1.NotFoundException('No restaurant linked to this account');
        const ids = restaurants.map(r => r.id);
        return this.repo.find({
            where: { restaurantId: (0, typeorm_2.In)(ids) },
            relations: ['user', 'restaurant'],
            order: { date: 'DESC', time: 'DESC' },
        });
    }
    async updateStatus(id, status, user) {
        const booking = await this.repo.findOne({
            where: { id },
            relations: ['restaurant', 'user'],
        });
        if (!booking)
            throw new common_1.NotFoundException();
        if (booking.userId !== user.id && booking.restaurant?.ownerId !== user.id && user.role !== 'admin') {
            throw new common_1.ForbiddenException();
        }
        booking.status = status;
        const saved = await this.repo.save(booking);
        if (status === 'confirmed') {
            await this.userRepo.increment({ id: booking.userId }, 'loyaltyPoints', POINTS_PER_BOOKING);
        }
        const customer = await this.userRepo.findOne({ where: { id: booking.userId }, select: ['pushToken'] });
        if (customer?.pushToken) {
            const restaurantName = booking.restaurant?.name || 'რესტორანი';
            const msgs = {
                confirmed: { title: '✅ ჯავშანი დადასტურდა', body: `${restaurantName} — ${booking.date} ${booking.time}` },
                rejected: { title: '❌ ჯავშანი უარყოფილია', body: `სამწუხაროდ ${restaurantName}-მა ვერ მიიღო ჯავშანი` },
                cancelled: { title: 'ℹ️ ჯავშანი გაუქმდა', body: `${restaurantName} — ${booking.date}` },
            };
            const msg = msgs[status];
            if (msg) {
                await this.notificationsService.sendPushNotification(customer.pushToken, msg.title, msg.body, { bookingId: id });
            }
        }
        this.bookingsGateway.emitBookingUpdated(booking.userId, saved);
        return saved;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(restaurant_entity_1.Restaurant)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        bookings_gateway_1.BookingsGateway])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map