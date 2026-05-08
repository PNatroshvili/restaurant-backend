import { Repository } from 'typeorm';
import { Cuisine } from '../entities/cuisine.entity';
export declare class CuisinesService {
    private repo;
    constructor(repo: Repository<Cuisine>);
    findAll(): Promise<Cuisine[]>;
    create(dto: {
        name: string;
        slug: string;
        icon?: string;
    }): Promise<Cuisine>;
}
