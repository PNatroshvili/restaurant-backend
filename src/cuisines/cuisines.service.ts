import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuisine } from '../entities/cuisine.entity';

@Injectable()
export class CuisinesService {
  constructor(@InjectRepository(Cuisine) private repo: Repository<Cuisine>) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  create(dto: { name: string; slug: string; icon?: string }) {
    return this.repo.save(this.repo.create(dto));
  }
}
