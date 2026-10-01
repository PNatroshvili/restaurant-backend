import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, Ack, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { User } from '../entities/user.entity';

type AuthedSocket = Socket & { data: { user?: User } };

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  private async authenticate(client: AuthedSocket): Promise<User> {
    if (client.data?.user) return client.data.user;
    const token = String(client.handshake.auth?.token || '');
    if (!token) throw new WsException('Unauthorized');
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.status === 'blocked') throw new Error('Unauthorized');
      client.data.user = user;
      return user;
    } catch {
      throw new WsException('Unauthorized');
    }
  }

  @SubscribeMessage('joinBookingRoom')
  async handleJoin(
    @MessageBody() bookingId: string,
    @ConnectedSocket() rawClient: Socket,
    @Ack() ack?: (result: { ok: boolean; error?: string }) => void,
  ) {
    const client = rawClient as AuthedSocket;
    try {
      const user = await this.authenticate(client);
      await this.chatService.getMessages(bookingId, user);
      client.join(`booking:${bookingId}`);
      ack?.({ ok: true });
    } catch (e) {
      const message = e instanceof WsException ? e.message : 'Could not join booking chat';
      ack?.({ ok: false, error: message });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { bookingId: string; content: string },
    @ConnectedSocket() rawClient: Socket,
    @Ack() ack?: (result: { ok: boolean; message?: unknown; error?: string }) => void,
  ) {
    const client = rawClient as AuthedSocket;
    try {
      const user = await this.authenticate(client);
      const msg = await this.chatService.save(data?.bookingId, user, data?.content);
      this.server.to(`booking:${data.bookingId}`).emit('newMessage', msg);
      ack?.({ ok: true, message: msg });
    } catch (e) {
      const message = e instanceof WsException ? e.message : (e instanceof Error ? e.message : 'Could not send message');
      ack?.({ ok: false, error: message });
    }
  }
}
