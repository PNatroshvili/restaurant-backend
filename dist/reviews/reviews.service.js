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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("../entities/review.entity");
const restaurant_entity_1 = require("../entities/restaurant.entity");
let ReviewsService = class ReviewsService {
    repo;
    restaurantsRepo;
    constructor(repo, restaurantsRepo) {
        this.repo = repo;
        this.restaurantsRepo = restaurantsRepo;
    }
    async findAll(restaurantId, page = 1, limit = 20) {
        const [data, total] = await this.repo.findAndCount({
            where: { restaurantId, status: 'approved' },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return { data, total, page, limit };
    }
    async create(dto, user) {
        const review = this.repo.create({
            restaurantId: dto.restaurant_id,
            rating: dto.rating,
            comment: dto.comment,
            userId: user.id,
        });
        const saved = await this.repo.save(review);
        await this.updateRestaurantRating(dto.restaurant_id);
        return saved;
    }
    async moderate(id, status) {
        const review = await this.repo.findOne({ where: { id } });
        if (!review)
            throw new common_1.NotFoundException();
        review.status = status;
        const saved = await this.repo.save(review);
        await this.updateRestaurantRating(review.restaurantId);
        return saved;
    }
    async updateRestaurantRating(restaurantId) {
        const result = await this.repo
            .createQueryBuilder('r')
            .select('AVG(r.rating)', 'avg')
            .addSelect('COUNT(*)', 'count')
            .where('r.restaurantId = :restaurantId AND r.status = :status', { restaurantId, status: 'approved' })
            .getRawOne();
        await this.restaurantsRepo.update(restaurantId, {
            ratingAvg: parseFloat(result.avg) || 0,
            reviewsCount: parseInt(result.count) || 0,
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectRepository)(restaurant_entity_1.Restaurant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map