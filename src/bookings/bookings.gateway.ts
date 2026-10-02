import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, Ack, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Restaurant } from '../entities/restaurant.entity';

type AuthedSocket = Socket & { data: { user?: User } };

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/bookings' })
export class BookingsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Restaurant) private readonly restaurantsRepo: Repository<Restaurant>,
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

  @SubscribeMessage('joinManagerRoom')
  async handleManagerJoin(
    @MessageBody() managerId: string,
    @ConnectedSocket() rawClient: Socket,
    @Ack() ack?: (result: { ok: boolean; error?: string }) => void,
  ) {
    const client = rawClient as AuthedSocket;
    try {
      const user = await this.authenticate(client);
      const restaurant = await this.restaurantsRepo.findOne({ where: { ownerId: user.id } });
      if (user.role !== 'restaurant_manager' && user.role !== 'admin') throw new WsException('Forbidden');
      if (!restaurant || (restaurant.ownerId !== user.id && user.role !== 'admin') || managerId !== user.id) throw new WsException('Forbidden');
      client.join('manager:' + user.id);
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e instanceof Error ? e.message : 'Could not join manager room' });
    }
  }

  @SubscribeMessage('joinUserRoom')
  async handleUserJoin(
    @MessageBody() userId: string,
    @ConnectedSocket() rawClient: Socket,
    @Ack() ack?: (result: { ok: boolean; error?: string }) => void,
  ) {
    const client = rawClient as AuthedSocket;
    try {
      const user = await this.authenticate(client);
      if (user.id !== userId && user.role !== 'admin') throw new WsException('Forbidden');
      client.join('user:' + user.id);
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e instanceof Error ? e.message : 'Could not join user room' });
    }
  }

  emitNewBooking(managerId: string, booking: any) {
    this.server.to('manager:' + managerId).emit('newBooking', booking);
  }

  emitBookingUpdated(userId: string, booking: any) {
    this.server.to('user:' + userId).emit('bookingUpdated', booking);
  }
}
