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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantPhoto = void 0;
const typeorm_1 = require("typeorm");
const restaurant_entity_1 = require("./restaurant.entity");
let RestaurantPhoto = class RestaurantPhoto {
    id;
    restaurantId;
    restaurant;
    url;
    sortOrder;
    isCover;
};
exports.RestaurantPhoto = RestaurantPhoto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RestaurantPhoto.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restaurant_id' }),
    __metadata("design:type", String)
], RestaurantPhoto.prototype, "restaurantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => restaurant_entity_1.Restaurant, (r) => r.photos, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'restaurant_id' }),
    __metadata("design:type", restaurant_entity_1.Restaurant)
], RestaurantPhoto.prototype, "restaurant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RestaurantPhoto.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', default: 0 }),
    __metadata("design:type", Number)
], RestaurantPhoto.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_cover', default: false }),
    __metadata("design:type", Boolean)
], RestaurantPhoto.prototype, "isCover", void 0);
exports.RestaurantPhoto = RestaurantPhoto = __decorate([
    (0, typeorm_1.Entity)('restaurant_photos')
], RestaurantPhoto);
//# sourceMappingURL=restaurant-photo.entity.js.map