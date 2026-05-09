import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
  ) {}

  async create(dto: { restaurant_id: string; date: string; time: string; guests_count: number; comment?: string }, user: User) {
    const booking = this.repo.create({
      restaurantId: dto.restaurant_id,
      date: dto.date,
      time: dto.time,
      guestsCount: dto.guests_count,
      comment: dto.comment,
      userId: user.id,
    });
    return this.repo.save(booking);
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
    const booking = await this.repo.findOne({ where: { id }, relations: ['restaurant'] });
    if (!booking) throw new NotFoundException();
    if (booking.userId !== user.id && booking.restaurant?.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException();
    }
    booking.status = status as any;
    return this.repo.save(booking);
  }
}
