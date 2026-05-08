import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private service;
    constructor(service: FavoritesService);
    findAll(req: any): Promise<import("../entities/restaurant.entity").Restaurant[]>;
    add(restaurantId: string, req: any): Promise<import("../entities/favorite.entity").Favorite>;
    remove(restaurantId: string, req: any): Promise<void>;
}
