import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { User } from '../entities/user.entity';
export declare class FavoritesService {
    private repo;
    constructor(repo: Repository<Favorite>);
    findAll(user: User): Promise<import("../entities/restaurant.entity").Restaurant[]>;
    add(restaurantId: string, user: User): Promise<Favorite>;
    remove(restaurantId: string, user: User): Promise<void>;
}
