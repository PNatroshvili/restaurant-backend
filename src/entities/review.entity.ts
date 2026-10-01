import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
import { ReviewPhoto } from './review-photo.entity';

export type ReviewStatus = 'pending' | 'approved' | 'hidden';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (u) => u.reviews, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'reviewer_name', nullable: true, type: 'varchar', length: 255 })
  reviewerName: string | null;

  @Column({ name: 'reviewer_avatar', nullable: true, type: 'text' })
  reviewerAvatar: string | null;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (r) => r.reviews)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'int' })
  rating: number;

  @Column({ nullable: true, type: 'text' })
  comment: string;

  @Column({ name: 'food_rating', type: 'int', nullable: true })
  foodRating: number | null;

  @Column({ name: 'service_rating', type: 'int', nullable: true })
  serviceRating: number | null;

  @Column({ name: 'ambience_rating', type: 'int', nullable: true })
  ambienceRating: number | null;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'hidden'], default: 'pending' })
  status: ReviewStatus;

  @OneToMany(() => ReviewPhoto, (photo) => photo.review, { cascade: true })
  photos: ReviewPhoto[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
