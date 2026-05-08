import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { MenuCategory } from './menu-category.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => MenuCategory, (c) => c.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: MenuCategory;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  price: number;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;
}
