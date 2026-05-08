import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private service;
    constructor(service: ReviewsService);
    findAll(restaurantId: string, page?: string): Promise<{
        data: import("../entities/review.entity").Review[];
        total: number;
        page: number;
        limit: number;
    }>;
    create(dto: {
        restaurant_id: string;
        rating: number;
        comment?: string;
    }, req: any): Promise<import("../entities/review.entity").Review>;
    moderate(id: string, status: 'approved' | 'hidden'): Promise<import("../entities/review.entity").Review>;
}
