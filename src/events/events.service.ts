import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantEvent } from '../entities/restaurant-event.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(RestaurantEvent) private repo: Repository<RestaurantEvent>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
  ) {}

  async getForRestaurant(restaurantId: string) {
    return this.repo.find({ where: { restaurantId, isActive: true }, order: { createdAt: 'DESC' } });
  }

  async create(dto: { title: string; description?: string; emoji?: string; eventDate?: string }, restaurantId: string, user: User) {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException();
    if (restaurant.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    const event = this.repo.create({ ...dto, restaurantId });
    return this.repo.save(event);
  }

  async remove(id: string, user: User) {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException();
    const restaurant = await this.restaurantRepo.findOne({ where: { id: event.restaurantId } });
    if (restaurant?.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    await this.repo.remove(event);
    return { success: true };
  }

  async getMyRestaurantEvents(user: User) {
    const restaurants = await this.restaurantRepo.find({ where: { ownerId: user.id }, select: ['id'] });
    if (!restaurants.length) throw new NotFoundException();
    const ids = restaurants.map(r => r.id);
    const events: RestaurantEvent[] = [];
    for (const id of ids) {
      const res = await this.repo.find({ where: { restaurantId: id }, order: { createdAt: 'DESC' } });
      events.push(...res);
    }
    return events;
  }
}
