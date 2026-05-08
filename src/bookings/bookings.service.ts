import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(@InjectRepository(Booking) private repo: Repository<Booking>) {}

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

  async findByRestaurant(restaurantId: string, user: User) {
    return this.repo.find({
      where: { restaurantId },
      relations: ['user'],
      order: { date: 'ASC', time: 'ASC' },
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
