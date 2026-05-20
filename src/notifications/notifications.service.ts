import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

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
