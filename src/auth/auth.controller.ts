import { Controller, Post, Patch, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') token: string) {
    return this.authService.refresh(token);
  }

  @Post('google')
  googleLogin(@Body('idToken') idToken: string) {
    return this.authService.googleLogin(idToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Request() req: any) {
    const { passwordHash, ...user } = req.user;
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateMe(@Request() req: any, @Body() dto: { name?: string; phone?: string }) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Patch('me/push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updatePushToken(@Request() req: any, @Body('pushToken') pushToken: string) {
    return this.authService.updatePushToken(req.user.id, pushToken);
  }

  @Get('me/loyalty')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getLoyalty(@Request() req: any) {
    return this.authService.getLoyalty(req.user.id);
  }
}
