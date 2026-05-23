import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titleKa: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column()
  emoji: string;

  @Column({ default: '#8B4FCE' })
  accent: string;

  @Column({ default: '#1A0D2D' })
  bg: string;

  @Column({ default: 'none' })
  filterType: string;

  @Column({ nullable: true })
  filterValue: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
