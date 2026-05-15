import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('mail_campaigns')
export class MailCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  html: string;

  @Column({ default: 0 })
  totalSent: number;

  @Column({ default: 0 })
  totalFailed: number;

  @Column({ default: 'sent' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
