import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private repo: Repository<Review>,
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
  ) {}

  async findAll(restaurantId: string, page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { restaurantId, status: 'approved' },
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async create(dto: { restaurant_id: string; rating: number; comment?: string }, user: User) {
    const review = this.repo.create({
      restaurantId: dto.restaurant_id,
      rating: dto.rating,
      comment: dto.comment,
      userId: user.id,
      status: 'approved',
    });
    const saved = await this.repo.save(review);
    await this.updateRestaurantRating(dto.restaurant_id);
    return saved;
  }

  async moderate(id: string, status: 'approved' | 'hidden') {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new NotFoundException();
    review.status = status;
    const saved = await this.repo.save(review);
    await this.updateRestaurantRating(review.restaurantId);
    return saved;
  }

  private async updateRestaurantRating(restaurantId: string) {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.restaurantId = :restaurantId AND r.status = :status', { restaurantId, status: 'approved' })
      .getRawOne();

    await this.restaurantsRepo.update(restaurantId, {
      ratingAvg: parseFloat(result.avg) || 0,
      reviewsCount: parseInt(result.count) || 0,
    });
  }
}
