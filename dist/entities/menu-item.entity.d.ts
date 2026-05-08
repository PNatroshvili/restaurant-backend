import { MenuCategory } from './menu-category.entity';
export declare class MenuItem {
    id: string;
    categoryId: string;
    category: MenuCategory;
    name: string;
    description: string;
    price: number;
    photoUrl: string;
    isAvailable: boolean;
}
