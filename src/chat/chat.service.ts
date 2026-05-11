import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private repo: Repository<ChatMessage>,
  ) {}

  async getMessages(bookingId: string) {
    return this.repo.find({ where: { bookingId }, order: { createdAt: 'ASC' } });
  }

  async save(bookingId: string, senderId: string, senderRole: string, content: string) {
    const msg = this.repo.create({ bookingId, senderId, senderRole, content });
    return this.repo.save(msg);
  }
}
