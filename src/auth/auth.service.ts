import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const googleClient = new OAuth2Client();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.phone && !dto.email) {
      throw new BadRequestException('Phone or email is required');
    }
    const existing = await this.usersRepo.findOne({
      where: dto.phone ? { phone: dto.phone } : { email: dto.email },
    });
    if (existing) throw new BadRequestException('User already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const referralCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const user = this.usersRepo.create({ ...dto, passwordHash, referralCode });

    if (dto.referralCode) {
      const referrer = await this.usersRepo.findOne({ where: { referralCode: dto.referralCode } });
      if (referrer) {
        await this.usersRepo.save(user);
        user.loyaltyPoints = 500;
        await this.usersRepo.save(user);
        await this.usersRepo.increment({ id: referrer.id }, 'loyaltyPoints', 500);
      } else {
        await this.usersRepo.save(user);
      }
    } else {
      await this.usersRepo.save(user);
    }

    return this.buildResponse(user);
  }

  async updatePushToken(userId: string, pushToken: string) {
    await this.usersRepo.update(userId, { pushToken });
    return { success: true };
  }

  async getLoyalty(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId }, select: ['loyaltyPoints', 'referralCode'] });
    if (!user) throw new UnauthorizedException();
    const points = user.loyaltyPoints ?? 0;
    const tiers = [
      { name: 'Bronze', min: 0, max: 999 },
      { name: 'Silver', min: 1000, max: 4999 },
      { name: 'Gold', min: 5000, max: 9999 },
      { name: 'Platinum', min: 10000, max: Infinity },
    ];
    const tier = tiers.find(t => points >= t.min && points <= t.max)!;
    const nextTier = tiers[tiers.indexOf(tier) + 1];
    const progress = nextTier ? Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100) : 100;
    return { points, tier: tier.name, nextTier: nextTier?.name ?? null, progress, referralCode: user.referralCode };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: [{ phone: dto.identifier }, { email: dto.identifier }],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'blocked') throw new UnauthorizedException('Account blocked');
    return this.buildResponse(user);
  }

  async googleLogin(idToken: string) {
    let payload: any;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: [
          '673067127577-ad5quav4fr7dkpc05enrf2muvo6mppsd.apps.googleusercontent.com',
          '673067127577-elfsfbe73ee2nm86i520bfmdquu0rgr5.apps.googleusercontent.com',
        ],
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find by googleId first, then by email
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
        passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
      });
      await this.usersRepo.save(user);
    } else if (!user.googleId) {
      // Link Google account to existing email user
      await this.usersRepo.update(user.id, { googleId, avatar: user.avatar || picture });
      user.googleId = googleId;
    }

    if (user.status === 'blocked') throw new UnauthorizedException('Account blocked');
    return this.buildResponse(user);
  }

  async updateProfile(userId: string, dto: { name?: string; phone?: string }) {
    await this.usersRepo.update(userId, dto);
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.buildTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private buildTokens(user: User) {
    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    };
  }

  private buildResponse(user: User) {
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, tokens: this.buildTokens(user) };
  }
}
