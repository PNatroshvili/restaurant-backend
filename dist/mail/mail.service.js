"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const resend_1 = require("resend");
const user_entity_1 = require("../entities/user.entity");
const mail_campaign_entity_1 = require("../entities/mail-campaign.entity");
let MailService = MailService_1 = class MailService {
    usersRepo;
    campaignsRepo;
    logger = new common_1.Logger(MailService_1.name);
    resend;
    constructor(usersRepo, campaignsRepo) {
        this.usersRepo = usersRepo;
        this.campaignsRepo = campaignsRepo;
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    }
    async sendBulk(subject, html, toAll = true, emails) {
        let recipients = [];
        if (toAll) {
            const users = await this.usersRepo.find({ where: { status: 'active' } });
            recipients = users.map(u => u.email).filter(Boolean);
        }
        else {
            recipients = emails || [];
        }
        let totalSent = 0;
        let totalFailed = 0;
        const chunks = [];
        for (let i = 0; i < recipients.length; i += 50) {
            chunks.push(recipients.slice(i, i + 50));
        }
        for (const chunk of chunks) {
            try {
                const result = await this.resend.emails.send({
                    from: 'Restaurant App <noreply@skup.ge>',
                    to: chunk,
                    subject,
                    html,
                });
                if (result.error) {
                    this.logger.error('Bulk send failed', result.error);
                    totalFailed += chunk.length;
                }
                else {
                    totalSent += chunk.length;
                }
            }
            catch (e) {
                this.logger.error('Bulk send failed for chunk', e);
                totalFailed += chunk.length;
            }
        }
        const campaign = this.campaignsRepo.create({ subject, html, totalSent, totalFailed, status: 'sent' });
        await this.campaignsRepo.save(campaign);
        return { ok: true, totalSent, totalFailed, total: recipients.length };
    }
    async sendVerificationCode(email, code) {
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
        const result = await this.resend.emails.send({
            from: 'Restaurant App <noreply@skup.ge>',
            to: [email],
            subject: '🔐 თქვენი დადასტურების კოდი',
            html,
        });
        if (result.error) {
            this.logger.error('Failed to send verification code', result.error);
            throw new Error(result.error.message);
        }
    }
    async sendTest(subject, html, email) {
        try {
            const result = await this.resend.emails.send({
                from: 'Restaurant App <noreply@skup.ge>',
                to: [email],
                subject: `[TEST] ${subject}`,
                html,
            });
            if (result.error)
                return { ok: false, error: result.error.message };
            return { ok: true };
        }
        catch (e) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(mail_campaign_entity_1.MailCampaign)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MailService);
//# sourceMappingURL=mail.service.js.map