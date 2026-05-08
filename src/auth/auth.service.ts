import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
    const user = this.usersRepo.create({ ...dto, passwordHash });
    await this.usersRepo.save(user);
    return this.buildResponse(user);
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
