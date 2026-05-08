import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_photos')
export class RestaurantPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (r) => r.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  url: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_cover', default: false })
  isCover: boolean;
}
