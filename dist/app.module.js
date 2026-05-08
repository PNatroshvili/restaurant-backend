"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const restaurants_module_1 = require("./restaurants/restaurants.module");
const reviews_module_1 = require("./reviews/reviews.module");
const bookings_module_1 = require("./bookings/bookings.module");
const cuisines_module_1 = require("./cuisines/cuisines.module");
const favorites_module_1 = require("./favorites/favorites.module");
const admin_module_1 = require("./admin/admin.module");
const upload_module_1 = require("./upload/upload.module");
const user_entity_1 = require("./entities/user.entity");
const restaurant_entity_1 = require("./entities/restaurant.entity");
const restaurant_photo_entity_1 = require("./entities/restaurant-photo.entity");
const menu_category_entity_1 = require("./entities/menu-category.entity");
const menu_item_entity_1 = require("./entities/menu-item.entity");
const review_entity_1 = require("./entities/review.entity");
const booking_entity_1 = require("./entities/booking.entity");
const cuisine_entity_1 = require("./entities/cuisine.entity");
const favorite_entity_1 = require("./entities/favorite.entity");
const working_hour_entity_1 = require("./entities/working-hour.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST'),
                    port: +(config.get('DB_PORT') ?? '5432'),
                    database: config.get('DB_NAME'),
                    username: config.get('DB_USER'),
                    password: config.get('DB_PASS'),
                    entities: [user_entity_1.User, restaurant_entity_1.Restaurant, restaurant_photo_entity_1.RestaurantPhoto, menu_category_entity_1.MenuCategory, menu_item_entity_1.MenuItem, review_entity_1.Review, booking_entity_1.Booking, cuisine_entity_1.Cuisine, favorite_entity_1.Favorite, working_hour_entity_1.WorkingHour],
                    synchronize: true,
                }),
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            restaurants_module_1.RestaurantsModule,
            reviews_module_1.ReviewsModule,
            bookings_module_1.BookingsModule,
            cuisines_module_1.CuisinesModule,
            favorites_module_1.FavoritesModule,
            admin_module_1.AdminModule,
            upload_module_1.UploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map