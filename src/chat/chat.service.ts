import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private repo: Repository<ChatMessage>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
  ) {}

  private async assertAccess(bookingId: string, user: User) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['restaurant'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const allowed = user.role === 'admin'
      || booking.userId === user.id
      || booking.restaurant?.ownerId === user.id;
    if (!allowed) throw new ForbiddenException('You do not have access to this booking');
    return booking;
  }

  async getMessages(bookingId: string, user: User) {
    await this.assertAccess(bookingId, user);
    return this.repo.find({ where: { bookingId }, order: { createdAt: 'ASC' } });
  }

  async save(bookingId: string, user: User, content: string) {
    await this.assertAccess(bookingId, user);
    const normalized = String(content || '').trim();
    if (!normalized) throw new ForbiddenException('Message cannot be empty');
    if (normalized.length > 500) throw new ForbiddenException('Message is too long');
    const msg = this.repo.create({
      bookingId,
      senderId: user.id,
      senderRole: user.role,
      content: normalized,
    });
    return this.repo.save(msg);
  }
}
