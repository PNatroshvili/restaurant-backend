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
    const chunks: string[][] = [];
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

  async sendVerificationCode(email: string, code: string) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0A0E1A;color:#F9FAFB;border-radius:12px;overflow:hidden">
  <div style="background:#00B67A;padding:28px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:24px">🍽️ Restaurant App</h1>
  </div>
  <div style="padding:32px;text-align:center">
    <h2 style="color:#F9FAFB;margin-top:0">ელფოსტის დადასტურება</h2>
    <p style="color:#9CA3AF;line-height:1.7">თქვენი სარეგისტრაციო კოდია:</p>
    <div style="background:#1F2937;border-radius:12px;padding:24px;margin:24px 0;display:inline-block;width:100%">
      <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#00B67A">${code}</span>
    </div>
    <p style="color:#6B7280;font-size:13px">კოდი მოქმედია 15 წუთი</p>
  </div>
</div>`;
    try {
      await this.resend.emails.send({
        from: 'Restaurant App <onboarding@resend.dev>',
        to: [email],
        subject: '🔐 თქვენი დადასტურების კოდი',
        html,
      });
    } catch (e) {
      this.logger.error('Failed to send verification code', e);
    }
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
