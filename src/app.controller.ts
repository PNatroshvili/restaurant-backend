import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('collections')
  getCollections() {
    return this.appService.getCollections();
  }

  @Get('home-config')
  getHomeSections() {
    return this.appService.getHomeSections();
  }
}
