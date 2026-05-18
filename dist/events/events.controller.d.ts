import { EventsService } from './events.service';
export declare class EventsController {
    private service;
    constructor(service: EventsService);
    getForRestaurant(restaurantId: string): Promise<import("../entities/restaurant-event.entity").RestaurantEvent[]>;
    getMy(req: any): Promise<import("../entities/restaurant-event.entity").RestaurantEvent[]>;
    create(restaurantId: string, dto: {
        title: string;
        description?: string;
        emoji?: string;
        eventDate?: string;
    }, req: any): Promise<import("../entities/restaurant-event.entity").RestaurantEvent>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
