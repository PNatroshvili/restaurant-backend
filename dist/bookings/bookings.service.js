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
let BookingsService = class BookingsService {
    repo;
    constructor(repo) {
        this.repo = repo;
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
        return this.repo.save(booking);
    }
    async findMy(user) {
        return this.repo.find({
            where: { userId: user.id },
            relations: ['restaurant'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByRestaurant(restaurantId, user) {
        return this.repo.find({
            where: { restaurantId },
            relations: ['user'],
            order: { date: 'ASC', time: 'ASC' },
        });
    }
    async updateStatus(id, status, user) {
        const booking = await this.repo.findOne({ where: { id }, relations: ['restaurant'] });
        if (!booking)
            throw new common_1.NotFoundException();
        if (booking.userId !== user.id && booking.restaurant?.ownerId !== user.id && user.role !== 'admin') {
            throw new common_1.ForbiddenException();
        }
        booking.status = status;
        return this.repo.save(booking);
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map