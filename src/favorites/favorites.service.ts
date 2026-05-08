import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class FavoritesService {
  constructor(@InjectRepository(Favorite) private repo: Repository<Favorite>) {}

  async findAll(user: User) {
    const favs = await this.repo.find({
      where: { userId: user.id },
      relations: ['restaurant', 'restaurant.photos', 'restaurant.cuisine'],
    });
    return favs.map((f) => f.restaurant);
  }

  async add(restaurantId: string, user: User) {
    const existing = await this.repo.findOne({ where: { userId: user.id, restaurantId } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ userId: user.id, restaurantId }));
  }

  async remove(restaurantId: string, user: User) {
    await this.repo.delete({ userId: user.id, restaurantId });
  }
}
