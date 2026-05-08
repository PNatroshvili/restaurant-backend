import { Restaurant } from './restaurant.entity';
export declare class Cuisine {
    id: string;
    name: string;
    slug: string;
    icon: string;
    restaurants: Restaurant[];
}
