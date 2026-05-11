import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsGateway } from './bookings.gateway';

const POINTS_PER_BOOKING = 100;

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
    private bookingsGateway: BookingsGateway,
  ) {}

  async create(dto: {
    restaurant_id: string; date: string; time: string;
    guests_count: number; comment?: string;
  }, user: User) {
    const booking = this.repo.create({
      restaurantId: dto.restaurant_id,
      date: dto.date,
      time: dto.time,
      guestsCount: dto.guests_count,
      comment: dto.comment,
      userId: user.id,
    });
    const saved = await this.repo.save(booking);

    // notify manager via WebSocket
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: dto.restaurant_id },
      select: ['ownerId', 'name'],
    });
    if (restaurant?.ownerId) {
      const full = await this.repo.findOne({ where: { id: saved.id }, relations: ['user', 'restaurant'] });
      this.bookingsGateway.emitNewBooking(restaurant.ownerId, full);

      // push notification to manager
      const manager = await this.userRepo.findOne({ where: { id: restaurant.ownerId }, select: ['pushToken'] });
      if (manager?.pushToken) {
        await this.notificationsService.sendPushNotification(
          manager.pushToken,
          '🔔 ახალი ჯავშანი',
          `${user.name} — ${dto.date} ${dto.time}, ${dto.guests_count} სტუმარი`,
          { bookingId: saved.id },
        );
      }
    }

    return saved;
  }

  async findMy(user: User) {
    return this.repo.find({
      where: { userId: user.id },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyRestaurantBookings(user: User) {
    const restaurants = await this.restaurantRepo.find({ where: { ownerId: user.id }, select: ['id'] });
    if (!restaurants.length) throw new NotFoundException('No restaurant linked to this account');
    const ids = restaurants.map(r => r.id);
    return this.repo.find({
      where: { restaurantId: In(ids) },
      relations: ['user', 'restaurant'],
      order: { date: 'DESC', time: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string, user: User) {
    const booking = await this.repo.findOne({
      where: { id },
      relations: ['restaurant', 'user'],
    });
    if (!booking) throw new NotFoundException();
    if (booking.userId !== user.id && booking.restaurant?.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException();
    }

    booking.status = status as any;
    const saved = await this.repo.save(booking);

    // Award loyalty points when booking confirmed
    if (status === 'confirmed') {
      await this.userRepo.increment({ id: booking.userId }, 'loyaltyPoints', POINTS_PER_BOOKING);
    }

    // Push notification to customer
    const customer = await this.userRepo.findOne({ where: { id: booking.userId }, select: ['pushToken'] });
    if (customer?.pushToken) {
      const restaurantName = booking.restaurant?.name || 'რესტორანი';
      const msgs: Record<string, { title: string; body: string }> = {
        confirmed: { title: '✅ ჯავშანი დადასტურდა', body: `${restaurantName} — ${booking.date} ${booking.time}` },
        rejected:  { title: '❌ ჯავშანი უარყოფილია', body: `სამწუხაროდ ${restaurantName}-მა ვერ მიიღო ჯავშანი` },
        cancelled: { title: 'ℹ️ ჯავშანი გაუქმდა', body: `${restaurantName} — ${booking.date}` },
      };
      const msg = msgs[status];
      if (msg) {
        await this.notificationsService.sendPushNotification(customer.pushToken, msg.title, msg.body, { bookingId: id });
      }
    }

    // WebSocket event to customer
    this.bookingsGateway.emitBookingUpdated(booking.userId, saved);

    return saved;
  }
}
