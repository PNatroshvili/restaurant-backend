import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('joinBookingRoom')
  handleJoin(@MessageBody() bookingId: string, @ConnectedSocket() client: Socket) {
    client.join(`booking:${bookingId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { bookingId: string; senderId: string; senderRole: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const msg = await this.chatService.save(data.bookingId, data.senderId, data.senderRole, data.content);
    this.server.to(`booking:${data.bookingId}`).emit('newMessage', msg);
  }
}
