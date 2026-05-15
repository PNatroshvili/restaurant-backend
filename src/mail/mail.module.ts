import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { MailCampaign } from '../entities/mail-campaign.entity';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, MailCampaign])],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
