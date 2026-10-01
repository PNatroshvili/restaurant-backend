import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('waitlist')
@Controller('waitlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WaitlistController {
  constructor(private readonly service: WaitlistService) {}

  @Post()
  join(@Body() body: any, @Request() req: any) {
    return this.service.join(body, req.user);
  }

  @Get('mine')
  mine(@Request() req: any) {
    return this.service.listMine(req.user);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.service.cancel(id, req.user);
  }
}