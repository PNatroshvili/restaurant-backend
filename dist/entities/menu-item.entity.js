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
exports.MenuItem = void 0;
const typeorm_1 = require("typeorm");
const menu_category_entity_1 = require("./menu-category.entity");
let MenuItem = class MenuItem {
    id;
    categoryId;
    category;
    name;
    description;
    price;
    photoUrl;
    isAvailable;
};
exports.MenuItem = MenuItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MenuItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id' }),
    __metadata("design:type", String)
], MenuItem.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => menu_category_entity_1.MenuCategory, (c) => c.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", menu_category_entity_1.MenuCategory)
], MenuItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MenuItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], MenuItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2 }),
    __metadata("design:type", Number)
], MenuItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'photo_url', nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "photoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_available', default: true }),
    __metadata("design:type", Boolean)
], MenuItem.prototype, "isAvailable", void 0);
exports.MenuItem = MenuItem = __decorate([
    (0, typeorm_1.Entity)('menu_items')
], MenuItem);
//# sourceMappingURL=menu-item.entity.js.map