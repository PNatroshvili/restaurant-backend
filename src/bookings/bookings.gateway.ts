import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/bookings' })
export class BookingsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinManagerRoom')
  handleJoin(@MessageBody() managerId: string, @ConnectedSocket() client: Socket) {
    client.join(`manager:${managerId}`);
  }

  emitNewBooking(managerId: string, booking: any) {
    this.server.to(`manager:${managerId}`).emit('newBooking', booking);
  }

  emitBookingUpdated(userId: string, booking: any) {
    this.server.to(`user:${userId}`).emit('bookingUpdated', booking);
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    client.join(`user:${userId}`);
  }
}
