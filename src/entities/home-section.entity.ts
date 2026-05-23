import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('home_sections')
export class HomeSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sectionKey: string;

  @Column()
  titleKa: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
