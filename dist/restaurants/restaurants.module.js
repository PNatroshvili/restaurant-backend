"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const restaurant_entity_1 = require("../entities/restaurant.entity");
const menu_category_entity_1 = require("../entities/menu-category.entity");
const menu_item_entity_1 = require("../entities/menu-item.entity");
const restaurants_service_1 = require("./restaurants.service");
const restaurants_controller_1 = require("./restaurants.controller");
let RestaurantsModule = class RestaurantsModule {
};
exports.RestaurantsModule = RestaurantsModule;
exports.RestaurantsModule = RestaurantsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([restaurant_entity_1.Restaurant, menu_category_entity_1.MenuCategory, menu_item_entity_1.MenuItem])],
        controllers: [restaurants_controller_1.RestaurantsController],
        providers: [restaurants_service_1.RestaurantsService],
        exports: [restaurants_service_1.RestaurantsService],
    })
], RestaurantsModule);
//# sourceMappingURL=restaurants.module.js.map