import { ChatService } from './chat.service';
export declare class ChatController {
    private service;
    constructor(service: ChatService);
    getMessages(bookingId: string): Promise<import("../entities/chat-message.entity").ChatMessage[]>;
}
