import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET') || 'restaurants';
    this.publicUrl = config.get<string>('S3_PUBLIC_URL') || '';
    this.s3 = new S3Client({
      endpoint: config.get('S3_ENDPOINT'),
      region: config.get('S3_REGION') || 'auto',
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY') || '',
        secretAccessKey: config.get('S3_SECRET_KEY') || '',
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder = 'photos'): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    return `${this.publicUrl}/${key}`;
  }
}
