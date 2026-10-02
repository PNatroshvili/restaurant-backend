import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Restaurant } from './restaurant.entity';

export type TableShape = 'round' | 'square' | 'rectangle';

@Entity('restaurant_tables')
export class RestaurantTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ length: 40 })
  name: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: ['round', 'square', 'rectangle'], default: 'square' })
  shape: TableShape;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  posX: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  posY: number;

  @Column({ length: 60, nullable: true })
  zone: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}