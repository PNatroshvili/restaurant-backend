import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private service: ChatService) {}

  @Get(':bookingId')
  @UseGuards(JwtAuthGuard)
  getMessages(@Param('bookingId') bookingId: string, @Request() req: any) {
    return this.service.getMessages(bookingId, req.user);
  }
}
