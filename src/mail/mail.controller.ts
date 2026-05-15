import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('mail')
@Controller('admin/mail')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class MailController {
  constructor(private mailService: MailService) {}

  @Get('recipients')
  getRecipients() { return this.mailService.getUserEmails(); }

  @Get('campaigns')
  getCampaigns() { return this.mailService.getCampaigns(); }

  @Post('send')
  sendBulk(@Body() body: { subject: string; html: string; toAll?: boolean; emails?: string[] }) {
    return this.mailService.sendBulk(body.subject, body.html, body.toAll !== false, body.emails);
  }

  @Post('test')
  sendTest(@Body() body: { subject: string; html: string; email: string }) {
    return this.mailService.sendTest(body.subject, body.html, body.email);
  }
}
