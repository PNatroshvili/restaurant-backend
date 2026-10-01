import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyTransaction } from '../entities/loyalty-transaction.entity';
import { User } from '../entities/user.entity';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyTransaction, User])],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}