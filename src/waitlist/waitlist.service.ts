import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitlistEntry } from '../entities/waitlist-entry.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../entities/user.entity';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(WaitlistEntry) private readonly repo: Repository<WaitlistEntry>,
    @InjectRepository(Restaurant) private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  async join(dto: { restaurant_id: string; date: string; time_from?: string; time_to?: string; guests_count: number }, user: User) {
    const guests = Number(dto.guests_count);
    if (!dto.restaurant_id || !/^\d{4}-\d{2}-\d{2}$/.test(dto.date) || !Number.isInteger(guests) || guests < 1 || guests > 12) {
      throw new BadRequestException('არასწორი waitlist მონაცემები');
    }
    const restaurant = await this.restaurantRepo.findOne({ where: { id: dto.restaurant_id, status: 'approved' } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const existing = await this.repo.findOne({
      where: { restaurantId: dto.restaurant_id, userId: user.id, date: dto.date, guestsCount: guests, status: 'waiting' },
    });
    if (existing) return existing;

    const entry = await this.repo.save(this.repo.create({
      restaurantId: dto.restaurant_id,
      userId: user.id,
      date: dto.date,
      timeFrom: dto.time_from || null,
      timeTo: dto.time_to || null,
      guestsCount: guests,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'waiting',
    }));

    await this.notifications.createForUser(
      user.id,
      'მოლოდინის სიაში დაემატე',
      restaurant.name + ' — ' + dto.date + ', ' + guests + ' სტუმარი',
      'waitlist_joined',
      { waitlistId: entry.id, restaurantId: restaurant.id },
    );

    if (restaurant.ownerId) {
      await this.notifications.createForUser(
        restaurant.ownerId,
        'ახალი waitlist მოთხოვნა',
        user.name + ' — ' + dto.date + ', ' + guests + ' სტუმარი',
        'waitlist_new',
        { waitlistId: entry.id },
      );
      const manager = await this.userRepo.findOne({ where: { id: restaurant.ownerId }, select: ['pushToken'] });
      if (manager?.pushToken) {
        await this.notifications.sendPushNotification(
          manager.pushToken,
          'ახალი waitlist მოთხოვნა',
          user.name + ' — ' + dto.date + ', ' + guests + ' სტუმარი',
          { waitlistId: entry.id },
        );
      }
    }
    return entry;
  }

  async listMine(user: User) {
    return this.repo.find({ where: { userId: user.id }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async cancel(id: string, user: User) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');
    if (entry.userId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    if (entry.status !== 'waiting' && entry.status !== 'notified') return entry;
    entry.status = 'cancelled';
    return this.repo.save(entry);
  }
}