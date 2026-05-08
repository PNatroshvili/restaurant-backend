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
exports.MenuCategory = void 0;
const typeorm_1 = require("typeorm");
const restaurant_entity_1 = require("./restaurant.entity");
const menu_item_entity_1 = require("./menu-item.entity");
let MenuCategory = class MenuCategory {
    id;
    restaurantId;
    restaurant;
    name;
    sortOrder;
    items;
};
exports.MenuCategory = MenuCategory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MenuCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restaurant_id' }),
    __metadata("design:type", String)
], MenuCategory.prototype, "restaurantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => restaurant_entity_1.Restaurant, (r) => r.menuCategories, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'restaurant_id' }),
    __metadata("design:type", restaurant_entity_1.Restaurant)
], MenuCategory.prototype, "restaurant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MenuCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', default: 0 }),
    __metadata("design:type", Number)
], MenuCategory.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => menu_item_entity_1.MenuItem, (i) => i.category, { cascade: true }),
    __metadata("design:type", Array)
], MenuCategory.prototype, "items", void 0);
exports.MenuCategory = MenuCategory = __decorate([
    (0, typeorm_1.Entity)('menu_categories')
], MenuCategory);
//# sourceMappingURL=menu-category.entity.js.map