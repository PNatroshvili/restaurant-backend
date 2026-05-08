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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../entities/user.entity");
let AuthService = class AuthService {
    usersRepo;
    jwtService;
    config;
    constructor(usersRepo, jwtService, config) {
        this.usersRepo = usersRepo;
        this.jwtService = jwtService;
        this.config = config;
    }
    async register(dto) {
        if (!dto.phone && !dto.email) {
            throw new common_1.BadRequestException('Phone or email is required');
        }
        const existing = await this.usersRepo.findOne({
            where: dto.phone ? { phone: dto.phone } : { email: dto.email },
        });
        if (existing)
            throw new common_1.BadRequestException('User already exists');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = this.usersRepo.create({ ...dto, passwordHash });
        await this.usersRepo.save(user);
        return this.buildResponse(user);
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
        return this.buildResponse(user);
    }
    async updateProfile(userId, dto) {
        await this.usersRepo.update(userId, dto);
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const { passwordHash, ...safeUser } = user;
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
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map