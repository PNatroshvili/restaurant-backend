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
exports.Restaurant = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const cuisine_entity_1 = require("./cuisine.entity");
const restaurant_photo_entity_1 = require("./restaurant-photo.entity");
const menu_category_entity_1 = require("./menu-category.entity");
const review_entity_1 = require("./review.entity");
const booking_entity_1 = require("./booking.entity");
const working_hour_entity_1 = require("./working-hour.entity");
let Restaurant = class Restaurant {
    id;
    ownerId;
    owner;
    name;
    description;
    address;
    city;
    district;
    latitude;
    longitude;
    phone;
    ratingAvg;
    reviewsCount;
    status;
    cuisineId;
    cuisine;
    photos;
    menuCategories;
    reviews;
    bookings;
    workingHours;
    createdAt;
    updatedAt;
};
exports.Restaurant = Restaurant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Restaurant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id' }),
    __metadata("design:type", String)
], Restaurant.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], Restaurant.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Restaurant.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Restaurant.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Restaurant.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'თბილისი' }),
    __metadata("design:type", String)
], Restaurant.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rating_avg', type: 'decimal', precision: 3, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "ratingAvg", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviews_count', default: 0 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "reviewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'], default: 'pending' }),
    __metadata("design:type", String)
], Restaurant.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cuisine_id', nullable: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "cuisineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cuisine_entity_1.Cuisine, (c) => c.restaurants, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cuisine_id' }),
    __metadata("design:type", cuisine_entity_1.Cuisine)
], Restaurant.prototype, "cuisine", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => restaurant_photo_entity_1.RestaurantPhoto, (p) => p.restaurant, { cascade: true }),
    __metadata("design:type", Array)
], Restaurant.prototype, "photos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => menu_category_entity_1.MenuCategory, (m) => m.restaurant, { cascade: true }),
    __metadata("design:type", Array)
], Restaurant.prototype, "menuCategories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => review_entity_1.Review, (r) => r.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "reviews", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => booking_entity_1.Booking, (b) => b.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "bookings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => working_hour_entity_1.WorkingHour, (w) => w.restaurant, { cascade: true }),
    __metadata("design:type", Array)
], Restaurant.prototype, "workingHours", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Restaurant.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Restaurant.prototype, "updatedAt", void 0);
exports.Restaurant = Restaurant = __decorate([
    (0, typeorm_1.Entity)('restaurants')
], Restaurant);
//# sourceMappingURL=restaurant.entity.js.map