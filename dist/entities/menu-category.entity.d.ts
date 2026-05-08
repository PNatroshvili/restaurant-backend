import { Restaurant } from './restaurant.entity';
import { MenuItem } from './menu-item.entity';
export declare class MenuCategory {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    name: string;
    sortOrder: number;
    items: MenuItem[];
}
