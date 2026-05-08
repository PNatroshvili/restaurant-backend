import { CuisinesService } from './cuisines.service';
export declare class CuisinesController {
    private service;
    constructor(service: CuisinesService);
    findAll(): Promise<import("../entities/cuisine.entity").Cuisine[]>;
    create(dto: {
        name: string;
        slug: string;
        icon?: string;
    }): Promise<import("../entities/cuisine.entity").Cuisine>;
}
