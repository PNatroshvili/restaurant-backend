import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('working_hours')
export class WorkingHour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (r) => r.workingHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'int' })
  day: number; // 0=Sun ... 6=Sat

  @Column({ nullable: true })
  open: string;

  @Column({ nullable: true })
  close: string;

  @Column({ name: 'is_closed', default: false })
  isClosed: boolean;
}
