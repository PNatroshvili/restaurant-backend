import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  icon: string;

  @OneToMany(() => Restaurant, (r) => r.cuisine)
  restaurants: Restaurant[];
}
