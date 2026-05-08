import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (r) => r.bookings)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({ name: 'guests_count' })
  guestsCount: number;

  @Column({ nullable: true, type: 'text' })
  comment: string;

  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'cancelled', 'rejected'], default: 'pending' })
  status: BookingStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
