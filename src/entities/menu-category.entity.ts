import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menu_categories')
export class MenuCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (r) => r.menuCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  name: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => MenuItem, (i) => i.category, { cascade: true })
  items: MenuItem[];
}
