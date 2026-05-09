import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Cuisine } from './cuisine.entity';
import { RestaurantPhoto } from './restaurant-photo.entity';
import { MenuCategory } from './menu-category.entity';
import { Review } from './review.entity';
import { Booking } from './booking.entity';
import { WorkingHour } from './working-hour.entity';

export type RestaurantStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  address: string;

  @Column({ default: 'თბილისი' })
  city: string;

  @Column({ nullable: true })
  district: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'discount_percent', type: 'int', nullable: true })
  discountPercent: number;

  @Column({ name: 'rating_avg', type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAvg: number;

  @Column({ name: 'reviews_count', default: 0 })
  reviewsCount: number;

  @Column({ type: 'enum', enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'], default: 'pending' })
  status: RestaurantStatus;

  @Column({ name: 'cuisine_id', nullable: true })
  cuisineId: string;

  @ManyToOne(() => Cuisine, (c) => c.restaurants, { nullable: true })
  @JoinColumn({ name: 'cuisine_id' })
  cuisine: Cuisine;

  @OneToMany(() => RestaurantPhoto, (p) => p.restaurant, { cascade: true })
  photos: RestaurantPhoto[];

  @OneToMany(() => MenuCategory, (m) => m.restaurant, { cascade: true })
  menuCategories: MenuCategory[];

  @OneToMany(() => Review, (r) => r.restaurant)
  reviews: Review[];

  @OneToMany(() => Booking, (b) => b.restaurant)
  bookings: Booking[];

  @OneToMany(() => WorkingHour, (w) => w.restaurant, { cascade: true })
  workingHours: WorkingHour[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
