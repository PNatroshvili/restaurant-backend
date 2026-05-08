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
exports.WorkingHour = void 0;
const typeorm_1 = require("typeorm");
const restaurant_entity_1 = require("./restaurant.entity");
let WorkingHour = class WorkingHour {
    id;
    restaurantId;
    restaurant;
    day;
    open;
    close;
    isClosed;
};
exports.WorkingHour = WorkingHour;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkingHour.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restaurant_id' }),
    __metadata("design:type", String)
], WorkingHour.prototype, "restaurantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => restaurant_entity_1.Restaurant, (r) => r.workingHours, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'restaurant_id' }),
    __metadata("design:type", restaurant_entity_1.Restaurant)
], WorkingHour.prototype, "restaurant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], WorkingHour.prototype, "day", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkingHour.prototype, "open", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkingHour.prototype, "close", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_closed', default: false }),
    __metadata("design:type", Boolean)
], WorkingHour.prototype, "isClosed", void 0);
exports.WorkingHour = WorkingHour = __decorate([
    (0, typeorm_1.Entity)('working_hours')
], WorkingHour);
//# sourceMappingURL=working-hour.entity.js.map