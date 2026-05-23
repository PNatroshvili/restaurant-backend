import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { HomeSection } from './entities/home-section.entity';
export declare class AppService {
    private collectionsRepo;
    private sectionsRepo;
    constructor(collectionsRepo: Repository<Collection>, sectionsRepo: Repository<HomeSection>);
    getHello(): string;
    getCollections(): Promise<Collection[]>;
    getHomeSections(): Promise<HomeSection[]>;
}
