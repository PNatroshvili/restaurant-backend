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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailCampaign = void 0;
const typeorm_1 = require("typeorm");
let MailCampaign = class MailCampaign {
    id;
    subject;
    html;
    totalSent;
    totalFailed;
    status;
    createdAt;
};
exports.MailCampaign = MailCampaign;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MailCampaign.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MailCampaign.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MailCampaign.prototype, "html", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], MailCampaign.prototype, "totalSent", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], MailCampaign.prototype, "totalFailed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'sent' }),
    __metadata("design:type", String)
], MailCampaign.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MailCampaign.prototype, "createdAt", void 0);
exports.MailCampaign = MailCampaign = __decorate([
    (0, typeorm_1.Entity)('mail_campaigns')
], MailCampaign);
//# sourceMappingURL=mail-campaign.entity.js.map