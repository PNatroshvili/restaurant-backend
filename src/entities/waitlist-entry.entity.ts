import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('waitlist_entries')
export class WaitlistEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'time_from', type: 'time', nullable: true })
  timeFrom: string | null;

  @Column({ name: 'time_to', type: 'time', nullable: true })
  timeTo: string | null;

  @Column({ name: 'guests_count', type: 'int' })
  guestsCount: number;

  @Index()
  @Column({ type: 'enum', enum: ['waiting', 'notified', 'booked', 'cancelled', 'expired'], default: 'waiting' })
  status: 'waiting' | 'notified' | 'booked' | 'cancelled' | 'expired';

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}