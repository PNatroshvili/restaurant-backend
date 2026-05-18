import { Server, Socket } from 'socket.io';
export declare class BookingsGateway {
    server: Server;
    handleJoin(managerId: string, client: Socket): void;
    emitNewBooking(managerId: string, booking: any): void;
    emitBookingUpdated(userId: string, booking: any): void;
    handleJoinUser(userId: string, client: Socket): void;
}
