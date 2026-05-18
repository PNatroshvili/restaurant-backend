import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
export declare class ChatService {
    private repo;
    constructor(repo: Repository<ChatMessage>);
    getMessages(bookingId: string): Promise<ChatMessage[]>;
    save(bookingId: string, senderId: string, senderRole: string, content: string): Promise<ChatMessage>;
}
