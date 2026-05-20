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

      let sent = 0, failed = 0;
      // Expo allows up to 100 per request
      for (let i = 0; i < valid.length; i += 100) {
        const chunk = valid.slice(i, i + 100);
        try {
          const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(chunk.map(to => ({ to, title, body, data, sound: 'default' }))),
          });
          const json: any = await res.json();
          const results: any[] = Array.isArray(json?.data) ? json.data : [json?.data];
          for (const r of results) {
            if (r?.status === 'ok') sent++;
            else { failed++; this.logger.warn(`Push rejected: ${r?.message}`); }
          }
        } catch (e) {
          this.logger.error('Batch push failed', e);
          failed += chunk.length;
        }
      }
      return { sent, failed };
    }

    // Kept for single-user sends (booking confirmations, etc.)
    async sendPushNotification(token: string, title: string, body: string, data?: object) {
      const { sent } = await this.sendPushBatch([token], title, body, data);
      return sent === 1;
    }
  }
