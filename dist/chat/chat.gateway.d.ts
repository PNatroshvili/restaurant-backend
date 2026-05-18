import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway {
    private chatService;
    server: Server;
    constructor(chatService: ChatService);
    handleJoin(bookingId: string, client: Socket): void;
    handleMessage(data: {
        bookingId: string;
        senderId: string;
        senderRole: string;
        content: string;
    }, client: Socket): Promise<void>;
}
