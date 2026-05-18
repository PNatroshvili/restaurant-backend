"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const user_entity_1 = require("../entities/user.entity");
const mail_service_1 = require("../mail/mail.service");
const googleClient = new google_auth_library_1.OAuth2Client();
let AuthService = AuthService_1 = class AuthService {
    usersRepo;
    jwtService;
    config;
    mailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usersRepo, jwtService, config, mailService) {
        this.usersRepo = usersRepo;
        this.jwtService = jwtService;
        this.config = config;
        this.mailService = mailService;
    }
    async register(dto) {
        const phoneExists = await this.usersRepo.findOne({ where: { phone: dto.phone } });
        if (phoneExists)
            throw new common_1.BadRequestException('Phone already registered');
        const emailExists = await this.usersRepo.findOne({ where: { email: dto.email } });
        if (emailExists)
            throw new common_1.BadRequestException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const referralCode = Math.random().toString(36).slice(2, 8).toUpperCase();
        const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
        const verifyExpires = new Date(Date.now() + 15 * 60 * 1000);
        const user = this.usersRepo.create({
            name: dto.name,
            lastName: dto.lastName,
            phone: dto.phone,
            email: dto.email,
            passwordHash,
            referralCode,
            emailVerified: false,
            emailVerifyCode: verifyCode,
            emailVerifyExpires: verifyExpires,
        });
        if (dto.referralCode) {
            const referrer = await this.usersRepo.findOne({ where: { referralCode: dto.referralCode } });
            if (referrer) {
                await this.usersRepo.save(user);
                user.loyaltyPoints = 500;
                await this.usersRepo.save(user);
                await this.usersRepo.increment({ id: referrer.id }, 'loyaltyPoints', 500);
            }
            else {
                await this.usersRepo.save(user);
            }
        }
        else {
            await this.usersRepo.save(user);
        }
        try {
            await this.mailService.sendVerificationCode(dto.email, verifyCode);
        }
        catch (e) {
            this.logger.warn(`Verification email failed for ${dto.email}: ${e?.message}`);
        }
        return { requiresVerification: true, email: dto.email };
    }
    async verifyEmail(email, code) {
        const user = await this.usersRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.BadRequestException('მომხმარებელი ვერ მოიძებნა');
        if (user.emailVerified)
            throw new common_1.BadRequestException('ელფოსტა უკვე დადასტურებულია');
        if (!user.emailVerifyCode || user.emailVerifyCode !== code) {
            throw new common_1.BadRequestException('არასწორი კოდი');
        }
        if (!user.emailVerifyExpires || new Date() > user.emailVerifyExpires) {
            throw new common_1.BadRequestException('კოდის ვადა გავიდა, გთხოვთ ხელახლა სცადოთ');
        }
        await this.usersRepo.update(user.id, {
            emailVerified: true,
            emailVerifyCode: null,
            emailVerifyExpires: null,
        });
        user.emailVerified = true;
        return this.buildResponse(user);
    }
    async resendCode(email) {
        const user = await this.usersRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.BadRequestException('მომხმარებელი ვერ მოიძებნა');
        if (user.emailVerified)
            throw new common_1.BadRequestException('ელფოსტა უკვე დადასტურებულია');
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await this.usersRepo.update(user.id, { emailVerifyCode: code, emailVerifyExpires: expires });
        await this.mailService.sendVerificationCode(email, code);
        return { ok: true };
    }
    async updatePushToken(userId, pushToken) {
        await this.usersRepo.update(userId, { pushToken });
        return { success: true };
    }
    async getLoyalty(userId) {
        const user = await this.usersRepo.findOne({ where: { id: userId }, select: ['loyaltyPoints', 'referralCode'] });
        if (!user)
            throw new common_1.UnauthorizedException();
        const points = user.loyaltyPoints ?? 0;
        const tiers = [
            { name: 'Bronze', min: 0, max: 999 },
            { name: 'Silver', min: 1000, max: 4999 },
            { name: 'Gold', min: 5000, max: 9999 },
            { name: 'Platinum', min: 10000, max: Infinity },
        ];
        const tier = tiers.find(t => points >= t.min && points <= t.max);
        const nextTier = tiers[tiers.indexOf(tier) + 1];
        const progress = nextTier ? Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100) : 100;
        return { points, tier: tier.name, nextTier: nextTier?.name ?? null, progress, referralCode: user.referralCode };
    }
    async login(dto) {
        const user = await this.usersRepo.findOne({
            where: [{ phone: dto.identifier }, { email: dto.identifier }],
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (user.status === 'blocked')
            throw new common_1.UnauthorizedException('Account blocked');
        if (user.email && !user.emailVerified)
            throw new common_1.UnauthorizedException('EMAIL_NOT_VERIFIED');
        return this.buildResponse(user);
    }
    async googleLogin(idToken) {
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: [
                    '673067127577-ad5quav4fr7dkpc05enrf2muvo6mppsd.apps.googleusercontent.com',
                    '673067127577-elfsfbe73ee2nm86i520bfmdquu0rgr5.apps.googleusercontent.com',
                ],
            });
            payload = ticket.getPayload();
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        const { sub: googleId, email, name, picture } = payload;
        let user = await this.usersRepo.findOne({ where: { googleId } });
        if (!user && email) {
            user = await this.usersRepo.findOne({ where: { email } });
        }
        if (!user) {
            user = this.usersRepo.create({
                name: name || email.split('@')[0],
                email,
                googleId,
                avatar: picture,
                emailVerified: true,
                passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
            });
            await this.usersRepo.save(user);
        }
        else if (!user.googleId) {
            await this.usersRepo.update(user.id, { googleId, avatar: user.avatar || picture });
            user.googleId = googleId;
        }
        if (user.status === 'blocked')
            throw new common_1.UnauthorizedException('Account blocked');
        return this.buildResponse(user);
    }
    async updateProfile(userId, dto) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        if (dto.newPassword) {
            if (!dto.currentPassword)
                throw new common_1.BadRequestException('Current password required');
            const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
            if (!valid)
                throw new common_1.BadRequestException('პაროლი არასწორია');
            await this.usersRepo.update(userId, { passwordHash: await bcrypt.hash(dto.newPassword, 10) });
        }
        if (dto.email && dto.email !== user.email) {
            const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
            if (exists)
                throw new common_1.BadRequestException('ელფოსტა უკვე გამოყენებულია');
            const code = String(Math.floor(100000 + Math.random() * 900000));
            const expires = new Date(Date.now() + 15 * 60 * 1000);
            await this.usersRepo.update(userId, {
                email: dto.email,
                emailVerified: false,
                emailVerifyCode: code,
                emailVerifyExpires: expires,
                ...(dto.name && { name: dto.name }),
                ...(dto.lastName !== undefined && { lastName: dto.lastName }),
                ...(dto.phone !== undefined && { phone: dto.phone || undefined }),
            });
            await this.mailService.sendVerificationCode(dto.email, code);
            return { requiresVerification: true, email: dto.email };
        }
        const updates = {};
        if (dto.name)
            updates.name = dto.name;
        if (dto.lastName !== undefined)
            updates.lastName = dto.lastName;
        if (dto.phone !== undefined)
            updates.phone = dto.phone || undefined;
        if (Object.keys(updates).length > 0)
            await this.usersRepo.update(userId, updates);
        const updated = await this.usersRepo.findOne({ where: { id: userId } });
        const { passwordHash, ...safeUser } = updated;
        return safeUser;
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
            if (!user)
                throw new common_1.UnauthorizedException();
            return this.buildTokens(user);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    buildTokens(user) {
        const payload = { sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: this.jwtService.sign(payload, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
            }),
        };
    }
    buildResponse(user) {
        const { passwordHash, ...safeUser } = user;
        return { user: safeUser, tokens: this.buildTokens(user) };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map