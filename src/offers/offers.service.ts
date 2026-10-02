import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantOffer } from '../entities/restaurant-offer.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';

type OfferInput = {
  title: string;
  description?: string | null;
  discountPercent?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  minimumGuests?: number | null;
  maximumGuests?: number | null;
  isActive?: boolean;
};

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(RestaurantOffer) private offerRepo: Repository<RestaurantOffer>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
  ) {}

  async listActive(restaurantId?: string, date?: string, time?: string, guests = 1) {
    const qb = this.offerRepo.createQueryBuilder('offer')
      .innerJoin('offer.restaurant', 'restaurant')
      .where('offer.isActive = :active', { active: true })
      .andWhere('restaurant.status = :status', { status: 'approved' });

    if (restaurantId) qb.andWhere('offer.restaurantId = :restaurantId', { restaurantId });
    if (date) qb.andWhere('(offer.startDate IS NULL OR offer.startDate <= :date)', { date })
      .andWhere('(offer.endDate IS NULL OR offer.endDate >= :date)', { date });
    if (time) qb.andWhere('(offer.startTime IS NULL OR offer.startTime <= :time)', { time })
      .andWhere('(offer.endTime IS NULL OR offer.endTime >= :time)', { time });
    if (guests > 0) qb.andWhere('(offer.minimumGuests IS NULL OR offer.minimumGuests <= :guests)', { guests })
      .andWhere('(offer.maximumGuests IS NULL OR offer.maximumGuests >= :guests)', { guests });

    return qb
      .orderBy('offer.discountPercent', 'DESC')
      .addOrderBy('offer.createdAt', 'DESC')
      .getMany();
  }

  async listMine(user: User) {
    const restaurants = await this.restaurantRepo.find({ where: { ownerId: user.id }, select: ['id'] });
    if (!restaurants.length) throw new NotFoundException('No restaurant linked to this account');
    return this.offerRepo.find({
      where: { restaurantId: restaurants[0].id },
      order: { createdAt: 'DESC' },
    });
  }

  async create(restaurantId: string, input: OfferInput, user: User) {
    await this.assertOwner(restaurantId, user);
    const title = String(input.title || '').trim();
    if (!title || title.length > 120) throw new BadRequestException('Offer title is required');
    const discount = input.discountPercent === null || input.discountPercent === undefined ? null : Number(input.discountPercent);
    if (discount !== null && (!Number.isInteger(discount) || discount < 0 || discount > 90)) {
      throw new BadRequestException('Offer discount must be between 0 and 90 percent');
    }
    const offer = this.offerRepo.create({
      restaurantId,
      title,
      description: input.description ? String(input.description).trim().slice(0, 500) : null,
      discountPercent: discount,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      minimumGuests: input.minimumGuests == null ? null : Number(input.minimumGuests),
      maximumGuests: input.maximumGuests == null ? null : Number(input.maximumGuests),
      isActive: input.isActive !== false,
    });
    return this.offerRepo.save(offer);
  }

  async update(id: string, input: Partial<OfferInput>, user: User) {
    const offer = await this.offerRepo.findOne({ where: { id }, relations: ['restaurant'] });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.restaurant.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    if (input.title !== undefined) {
      const title = String(input.title).trim();
      if (!title || title.length > 120) throw new BadRequestException('Offer title is required');
      offer.title = title;
    }
    if (input.description !== undefined) offer.description = input.description ? String(input.description).trim().slice(0, 500) : null;
    if (input.discountPercent !== undefined) {
      const discount = input.discountPercent === null ? null : Number(input.discountPercent);
      if (discount !== null && (!Number.isInteger(discount) || discount < 0 || discount > 90)) {
        throw new BadRequestException('Offer discount must be between 0 and 90 percent');
      }
      offer.discountPercent = discount;
    }
    if (input.startDate !== undefined) offer.startDate = input.startDate || null;
    if (input.endDate !== undefined) offer.endDate = input.endDate || null;
    if (input.startTime !== undefined) offer.startTime = input.startTime || null;
    if (input.endTime !== undefined) offer.endTime = input.endTime || null;
    if (input.minimumGuests !== undefined) offer.minimumGuests = input.minimumGuests == null ? null : Number(input.minimumGuests);
    if (input.maximumGuests !== undefined) offer.maximumGuests = input.maximumGuests == null ? null : Number(input.maximumGuests);
    if (input.isActive !== undefined) offer.isActive = Boolean(input.isActive);
    return this.offerRepo.save(offer);
  }

  async remove(id: string, user: User) {
    const offer = await this.offerRepo.findOne({ where: { id }, relations: ['restaurant'] });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.restaurant.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
    await this.offerRepo.remove(offer);
    return { ok: true };
  }

  private async assertOwner(restaurantId: string, user: User) {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (restaurant.ownerId !== user.id && user.role !== 'admin') throw new ForbiddenException();
  }
}