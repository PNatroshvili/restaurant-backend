import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuisine } from '../entities/cuisine.entity';
import { CuisinesService } from './cuisines.service';
import { CuisinesController } from './cuisines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cuisine])],
  controllers: [CuisinesController],
  providers: [CuisinesService],
})
export class CuisinesModule {}
