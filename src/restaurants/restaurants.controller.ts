import {
  Controller, Get, Post, Patch, Put, Delete,
  Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile, Headers, UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private service: RestaurantsService) {}

  @Get()
  findAll(@Query() filters: any) {
    return this.service.findAll(filters);
  }

  @Get('nearby')
  findNearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius = '2000') {
    return this.service.findNearby(+lat, +lng, +radius);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyRestaurant(@Request() req: any) {
    return this.service.getMyRestaurant(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/menu')
  getMenu(@Param('id') id: string) {
    return this.service.getMenu(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateRestaurantDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: Partial<CreateRestaurantDto>, @Request() req: any) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }

  // ── Manager: info ──────────────────────────────────────────────────────

  @Patch(':id/info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateInfo(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.service.updateInfo(id, dto, req.user);
  }

  // ── Manager: discount ──────────────────────────────────────────────────

  @Patch(':id/discount')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateDiscount(@Param('id') id: string, @Body('discountPercent') pct: number, @Request() req: any) {
    return this.service.updateDiscount(id, +pct, req.user);
  }

  // ── Manager: working hours ─────────────────────────────────────────────

  @Put(':id/working-hours')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateWorkingHours(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.updateWorkingHours(id, body.hours, req.user);
  }

  // ── Manager: menu categories ───────────────────────────────────────────

  @Post(':id/menu-categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addCategory(@Param('id') id: string, @Body('name') name: string, @Request() req: any) {
    return this.service.addMenuCategory(id, name, req.user);
  }

  @Patch(':id/menu-categories/:catId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateCategory(@Param('id') id: string, @Param('catId') catId: string, @Body('name') name: string, @Request() req: any) {
    return this.service.updateMenuCategory(id, catId, name, req.user);
  }

  @Delete(':id/menu-categories/:catId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteCategory(@Param('id') id: string, @Param('catId') catId: string, @Request() req: any) {
    return this.service.deleteMenuCategory(id, catId, req.user);
  }

  // ── Manager: menu items ────────────────────────────────────────────────

  @Post(':id/menu-categories/:catId/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('photo'))
  addItem(
    @Param('id') id: string,
    @Param('catId') catId: string,
    @Body() dto: any,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.addMenuItem(id, catId, { ...dto, price: +dto.price }, req.user, file);
  }

  @Patch(':id/menu-items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('photo'))
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: any,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const parsed = { ...dto };
    if (parsed.price) parsed.price = +parsed.price;
    if (parsed.isAvailable !== undefined) parsed.isAvailable = parsed.isAvailable === 'true';
    return this.service.updateMenuItem(id, itemId, parsed, req.user, file);
  }

  @Delete(':id/menu-items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteItem(@Param('id') id: string, @Param('itemId') itemId: string, @Request() req: any) {
    return this.service.deleteMenuItem(id, itemId, req.user);
  }

  // ── Manager: photos ────────────────────────────────────────────────────

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('photo'))
  uploadPhoto(
    @Param('id') id: string,
    @Body('isCover') isCover: string,
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadPhoto(id, file, isCover === 'true', req.user);
  }

  @Patch(':id/photos/:photoId/cover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  setCover(@Param('id') id: string, @Param('photoId') photoId: string, @Request() req: any) {
    return this.service.setCoverPhoto(id, photoId, req.user);
  }

  @Delete(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deletePhoto(@Param('id') id: string, @Param('photoId') photoId: string, @Request() req: any) {
    return this.service.deletePhoto(id, photoId, req.user);
  }

  // ── Temporary admin linking endpoint (remove after use) ────────────────
  @Get('admin/list-all')
  async adminList(@Headers('x-admin-key') key: string) {
    if (key !== 'skup-admin-2026') throw new UnauthorizedException();
    return this.service.adminListAll();
  }

  @Post('admin/link-manager')
  async adminLink(
    @Headers('x-admin-key') key: string,
    @Body() body: { managerId: string; restaurantId: string },
  ) {
    if (key !== 'skup-admin-2026') throw new UnauthorizedException();
    return this.service.adminLinkManager(body.managerId, body.restaurantId);
  }
}
