import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotification } from '../entities/user-notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectRepository(UserNotification) private readonly repo: Repository<UserNotification>) {}

  async createForUser(userId: string, title: string, body: string, type = 'system', data?: Record<string, unknown>) {
    const item = this.repo.create({
      userId,
      title: String(title).slice(0, 120),
      body: String(body).slice(0, 1000),
      type,
      data: data || null,
      readAt: null,
    });
    return this.repo.save(item);
  }

  async listForUser(userId: string) {
    const data = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 100 });
    return { data, unreadCount: data.filter(item => !item.readAt).length };
  }

  async markRead(id: string, userId: string) {
    const item = await this.repo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Notification not found');
    if (!item.readAt) item.readAt = new Date();
    return this.repo.save(item);
  }

  async markAllRead(userId: string) {
    await this.repo.createQueryBuilder().update(UserNotification).set({ readAt: new Date() }).where('user_id = :userId AND read_at IS NULL', { userId }).execute();
    return { ok: true };
  }

  async sendPushBatch(
    tokens: string[],
    title: string,
    body: string,
    data?: object,
  ): Promise<{ sent: number; failed: number }> {
    const valid = tokens.filter(t => t?.startsWith('ExponentPushToken'));
    if (!valid.length) return { sent: 0, failed: tokens.length };

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < valid.length; i += 100) {
      const chunk = valid.slice(i, i + 100);
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(
            chunk.map(to => ({ to, title, body, data, sound: 'default' })),
          ),
        });
        const json: any = await res.json();
        const results: any[] = Array.isArray(json?.data) ? json.data : [json?.data];
        for (const r of results) {
          if (r?.status === 'ok') sent++;
          else {
            failed++;
            this.logger.warn(`Expo push rejected: ${r?.message} (${r?.details?.error})`);
          }
        }
      } catch (e) {
        this.logger.error('Push batch failed', e);
        failed += chunk.length;
      }
    }

    return { sent, failed };
  }

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: object,
  ): Promise<boolean> {
    const { sent } = await this.sendPushBatch([pushToken], title, body, data);
    return sent === 1;
  }
}
