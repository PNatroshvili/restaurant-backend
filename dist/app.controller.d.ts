import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getCollections(): Promise<import("./entities/collection.entity").Collection[]>;
    getHomeSections(): Promise<import("./entities/home-section.entity").HomeSection[]>;
}
