import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { Booking } from '../entities/booking.entity';
import { ReviewPhoto } from '../entities/review-photo.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private repo: Repository<Review>,
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(ReviewPhoto) private reviewPhotosRepo: Repository<ReviewPhoto>,
    private uploadService: UploadService,
  ) {}

  async findAll(restaurantId: string, page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { restaurantId, status: 'approved' },
      relations: ['user', 'photos'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: data.map(review => ({ ...review, verified: Boolean(review.userId) })), total, page, limit };
  }

  async create(dto: { restaurant_id: string; rating: number; comment?: string; food_rating?: number; service_rating?: number; ambience_rating?: number }, user: User) {
    const rating = Number(dto.rating);
    const foodRating = dto.food_rating == null ? null : Number(dto.food_rating);
    const serviceRating = dto.service_rating == null ? null : Number(dto.service_rating);
    const ambienceRating = dto.ambience_rating == null ? null : Number(dto.ambience_rating);
    if (!dto.restaurant_id || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be an integer from 1 to 5');
    }
    for (const value of [foodRating, serviceRating, ambienceRating]) {
      if (value !== null && (!Number.isInteger(value) || value < 1 || value > 5)) {
        throw new BadRequestException('Sub-ratings must be integers from 1 to 5');
      }
    }
    if (dto.comment && dto.comment.trim().length > 1000) {
      throw new BadRequestException('Comment is too long');
    }

    const restaurant = await this.restaurantsRepo.findOne({
      where: { id: dto.restaurant_id, status: 'approved' },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const confirmedBookings = await this.bookingsRepo.find({
      where: {
        restaurantId: dto.restaurant_id,
        userId: user.id,
        status: 'confirmed',
      },
      select: ['id', 'date', 'time'],
      order: { createdAt: 'DESC' },
    });
    const now = Date.now();
    const hasCompletedVisit = confirmedBookings.some((booking) => {
      const visitAt = new Date(`${booking.date}T${String(booking.time).slice(0, 8)}+04:00`).getTime();
      return Number.isFinite(visitAt) && visitAt < now;
    });
    if (!hasCompletedVisit) {
      throw new BadRequestException('A completed confirmed booking is required to review this restaurant');
    }
    const review = this.repo.create({
      restaurantId: dto.restaurant_id,
      rating,
      comment: dto.comment?.trim().slice(0, 1000),
      userId: user.id,
      foodRating,
      serviceRating,
      ambienceRating,
      status: 'approved',
    });
    const saved = await this.repo.save(review);
    await this.updateRestaurantRating(dto.restaurant_id);
    return saved;
  }

  async replyToReview(reviewId: string, reply: string, user: User) {
    const review = await this.repo.findOne({ where: { id: reviewId }, relations: ['restaurant'] });
    if (!review) throw new NotFoundException('Review not found');
    if (review.restaurant.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    const clean = String(reply || '').trim();
    if (!clean || clean.length > 1000) throw new BadRequestException('Reply must be between 1 and 1000 characters');
    review.restaurantReply = clean;
    review.restaurantReplyAt = new Date();
    return this.repo.save(review);
  }

  async addPhoto(reviewId: string, file: Express.Multer.File, user: User) {
    if (!file?.buffer) throw new BadRequestException('Photo is required');
    const review = await this.repo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== user.id && user.role !== 'admin') throw new BadRequestException('Not allowed');
    const count = await this.reviewPhotosRepo.count({ where: { reviewId } });
    if (count >= 5) throw new BadRequestException('Maximum 5 photos per review');
    if (!file.mimetype?.startsWith('image/')) throw new BadRequestException('Only image files are allowed');
    if (file.size > 8 * 1024 * 1024) throw new BadRequestException('Image is too large');
    const url = await this.uploadService.uploadFile(file, 'reviews');
    return this.reviewPhotosRepo.save(this.reviewPhotosRepo.create({ reviewId, url }));
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
