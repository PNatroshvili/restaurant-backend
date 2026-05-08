import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

export type ReviewStatus = 'pending' | 'approved' | 'hidden';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.reviews)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (r) => r.reviews)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'int' })
  rating: number;

  @Column({ nullable: true, type: 'text' })
  comment: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'hidden'], default: 'pending' })
  status: ReviewStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
