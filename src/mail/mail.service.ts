import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { User } from '../entities/user.entity';
import { MailCampaign } from '../entities/mail-campaign.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(MailCampaign) private campaignsRepo: Repository<MailCampaign>,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendBulk(subject: string, html: string, toAll = true, emails?: string[]) {
    let recipients: string[] = [];

    if (toAll) {
      const users = await this.usersRepo.find({ where: { status: 'active' } });
      recipients = users.map(u => u.email).filter(Boolean) as string[];
    } else {
      recipients = emails || [];
    }

    let totalSent = 0;
    let totalFailed = 0;

    // Resend allows max 50 per batch — chunk it
    const chunks = [];
    for (let i = 0; i < recipients.length; i += 50) {
      chunks.push(recipients.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      try {
        await this.resend.emails.send({
          from: 'Restaurant App <onboarding@resend.dev>',
          to: chunk,
          subject,
          html,
        });
        totalSent += chunk.length;
      } catch (e) {
        this.logger.error('Bulk send failed for chunk', e);
        totalFailed += chunk.length;
      }
    }

    const campaign = this.campaignsRepo.create({ subject, html, totalSent, totalFailed, status: 'sent' });
    await this.campaignsRepo.save(campaign);

    return { ok: true, totalSent, totalFailed, total: recipients.length };
  }

  async sendTest(subject: string, html: string, email: string) {
    try {
      await this.resend.emails.send({
        from: 'Restaurant App <onboarding@resend.dev>',
        to: [email],
        subject: `[TEST] ${subject}`,
        html,
      });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  }

  async getCampaigns() {
    return this.campaignsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getUserEmails() {
    const users = await this.usersRepo.find({ where: { status: 'active' } });
    return {
      total: users.length,
      withEmail: users.filter(u => u.email).length,
      emails: users.map(u => ({ name: u.name, email: u.email })).filter(u => u.email),
    };
  }
}
