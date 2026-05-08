import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private service: UploadService) {}

  @Post('photo')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Only JPEG, PNG, WEBP allowed'), false);
      }
      cb(null, true);
    },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File required');
    const url = await this.service.uploadFile(file);
    return { url };
  }
}
