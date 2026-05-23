import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { HomeSection } from './entities/home-section.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Collection) private collectionsRepo: Repository<Collection>,
    @InjectRepository(HomeSection) private sectionsRepo: Repository<HomeSection>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getCollections() {
    return this.collectionsRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  getHomeSections() {
    return this.sectionsRepo.find({ order: { sortOrder: 'ASC' } });
  }
}
