import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column({ name: 'sender_role' })
  senderRole: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
