import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
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

  @Get('restaurant/:restaurantId')
  listRestaurant(@Param('restaurantId') restaurantId: string, @Request() req: any) {
    return this.service.listForRestaurant(restaurantId, req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.updateStatus(id, String(body.status || ''), req.user);
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