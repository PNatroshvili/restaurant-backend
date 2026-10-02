import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyTransaction } from '../entities/loyalty-transaction.entity';
import { User } from '../entities/user.entity';

export type LoyaltyTier = {
  name: string;
  min: number;
  max: number;
};

const TIERS: LoyaltyTier[] = [
  { name: 'Bronze', min: 0, max: 999 },
  { name: 'Silver', min: 1000, max: 4999 },
  { name: 'Gold', min: 5000, max: 9999 },
  { name: 'Platinum', min: 10000, max: Number.MAX_SAFE_INTEGER },
];

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyTransaction) private readonly transactions: Repository<LoyaltyTransaction>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  getTiers() {
    return TIERS;
  }

  private getTier(points: number) {
    return TIERS.find(tier => points >= tier.min && points <= tier.max) || TIERS[TIERS.length - 1];
  }

  async getOverview(userId: string) {
    const user = await this.users.findOne({ where: { id: userId }, select: ['id', 'loyaltyPoints', 'referralCode'] });
    if (!user) throw new NotFoundException('User not found');
    const transactions = await this.transactions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const points = Number(user.loyaltyPoints || 0);
    const tier = this.getTier(points);
    const nextTier = TIERS[TIERS.indexOf(tier) + 1];
    const progress = nextTier
      ? Math.max(0, Math.min(100, Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100)))
      : 100;
    return {
      points,
      tier: tier.name,
      nextTier: nextTier?.name || null,
      progress,
      referralCode: user.referralCode,
      transactions,
      tiers: TIERS,
    };
  }

  async awardUser(userId: string, points: number, type: string, description: string, reference?: string | null) {
    const delta = Math.trunc(Number(points));
    if (!Number.isFinite(delta) || delta <= 0) throw new BadRequestException('Points must be positive');
    return this.dataSource.transaction(async manager => {
      const existing = reference
        ? await manager.findOne(LoyaltyTransaction, { where: { userId, reference, type } })
        : null;
      if (existing) return existing;

      await manager.increment(User, { id: userId }, 'loyaltyPoints', delta);
      const user = await manager.findOne(User, { where: { id: userId }, select: ['id', 'loyaltyPoints'] });
      if (!user) throw new NotFoundException('User not found');
      return manager.save(
        LoyaltyTransaction,
        manager.create(LoyaltyTransaction, {
          userId,
          delta,
          balanceAfter: Number(user.loyaltyPoints || 0),
          type,
          reference: reference || null,
          description: description.slice(0, 500),
        }),
      );
    });
  }

  async spendUser(userId: string, points: number, type: string, description: string, reference?: string | null) {
    const delta = Math.trunc(Number(points));
    if (!Number.isFinite(delta) || delta <= 0) throw new BadRequestException('Points must be positive');
    return this.dataSource.transaction(async manager => {
      if (reference) {
        const existing = await manager.findOne(LoyaltyTransaction, { where: { userId, reference, type } });
        if (existing) return existing;
      }
      const user = await manager.findOne(User, { where: { id: userId }, select: ['id', 'loyaltyPoints'] });
      if (!user) throw new NotFoundException('User not found');
      const balance = Number(user.loyaltyPoints || 0);
      if (balance < delta) throw new BadRequestException('Insufficient loyalty points');
      await manager.decrement(User, { id: userId }, 'loyaltyPoints', delta);
      const updated = await manager.findOne(User, { where: { id: userId }, select: ['id', 'loyaltyPoints'] });
      return manager.save(
        LoyaltyTransaction,
        manager.create(LoyaltyTransaction, {
          userId,
          delta: -delta,
          balanceAfter: Number(updated?.loyaltyPoints || 0),
          type,
          reference: reference || null,
          description: description.slice(0, 500),
        }),
      );
    });
  }
}