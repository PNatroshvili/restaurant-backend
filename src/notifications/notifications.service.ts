import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendPushNotification(pushToken: string, title: string, body: string, data?: object) {
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: pushToken, title, body, data, sound: 'default' }),
      });
    } catch (e) {
      this.logger.error('Push notification failed', e);
    }
  }
}
