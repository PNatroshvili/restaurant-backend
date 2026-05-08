import { BookingsService } from './bookings.service';
export declare class BookingsController {
    private service;
    constructor(service: BookingsService);
    create(dto: any, req: any): Promise<import("../entities/booking.entity").Booking>;
    findMy(req: any): Promise<import("../entities/booking.entity").Booking[]>;
    updateStatus(id: string, status: string, req: any): Promise<import("../entities/booking.entity").Booking>;
}
