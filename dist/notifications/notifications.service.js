"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    logger = new common_1.Logger(NotificationsService_1.name);
    async sendPushBatch(tokens, title, body, data) {
        const valid = tokens.filter(t => t?.startsWith('ExponentPushToken'));
        if (!valid.length)
            return { sent: 0, failed: tokens.length };
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
                    body: JSON.stringify(chunk.map(to => ({ to, title, body, data, sound: 'default' }))),
                });
                const json = await res.json();
                const results = Array.isArray(json?.data) ? json.data : [json?.data];
                for (const r of results) {
                    if (r?.status === 'ok')
                        sent++;
                    else {
                        failed++;
                        this.logger.warn(`Expo push rejected: ${r?.message} (${r?.details?.error})`);
                    }
                }
            }
            catch (e) {
                this.logger.error('Push batch failed', e);
                failed += chunk.length;
            }
        }
        return { sent, failed };
    }
    async sendPushNotification(pushToken, title, body, data) {
        const { sent } = await this.sendPushBatch([pushToken], title, body, data);
        return sent === 1;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map