import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Review } from './review.entity';
import { Booking } from './booking.entity';
import { Favorite } from './favorite.entity';

export type UserRole = 'user' | 'restaurant_manager' | 'admin';
export type UserStatus = 'active' | 'blocked';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ name: 'google_id', nullable: true, unique: true })
  googleId: string;

  @Column({ type: 'enum', enum: ['user', 'restaurant_manager', 'admin'], default: 'user' })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: ['active', 'blocked'], default: 'active' })
  status: UserStatus;

  @Column({ name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'referral_code', nullable: true, unique: true })
  referralCode: string;

  @Column({ name: 'push_token', nullable: true })
  pushToken: string;

  @Column({ name: 'email_verified', default: true })
  emailVerified: boolean;

  @Column({ name: 'email_verify_code', nullable: true })
  emailVerifyCode: string;

  @Column({ name: 'email_verify_expires', nullable: true })
  emailVerifyExpires: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Review, (r) => r.user)
  reviews: Review[];

  @OneToMany(() => Booking, (b) => b.user)
  bookings: Booking[];

  @OneToMany(() => Favorite, (f) => f.user)
  favorites: Favorite[];
}
