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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const restaurant_event_entity_1 = require("../entities/restaurant-event.entity");
const restaurant_entity_1 = require("../entities/restaurant.entity");
let EventsService = class EventsService {
    repo;
    restaurantRepo;
    constructor(repo, restaurantRepo) {
        this.repo = repo;
        this.restaurantRepo = restaurantRepo;
    }
    async getForRestaurant(restaurantId) {
        return this.repo.find({ where: { restaurantId, isActive: true }, order: { createdAt: 'DESC' } });
    }
    async create(dto, restaurantId, user) {
        const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId } });
        if (!restaurant)
            throw new common_1.NotFoundException();
        if (restaurant.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
        const event = this.repo.create({ ...dto, restaurantId });
        return this.repo.save(event);
    }
    async remove(id, user) {
        const event = await this.repo.findOne({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException();
        const restaurant = await this.restaurantRepo.findOne({ where: { id: event.restaurantId } });
        if (restaurant?.ownerId !== user.id && user.role !== 'admin')
            throw new common_1.ForbiddenException();
        await this.repo.remove(event);
        return { success: true };
    }
    async getMyRestaurantEvents(user) {
        const restaurants = await this.restaurantRepo.find({ where: { ownerId: user.id }, select: ['id'] });
        if (!restaurants.length)
            throw new common_1.NotFoundException();
        const ids = restaurants.map(r => r.id);
        const events = [];
        for (const id of ids) {
            const res = await this.repo.find({ where: { restaurantId: id }, order: { createdAt: 'DESC' } });
            events.push(...res);
        }
        return events;
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(restaurant_event_entity_1.RestaurantEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(restaurant_entity_1.Restaurant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EventsService);
//# sourceMappingURL=events.service.js.map