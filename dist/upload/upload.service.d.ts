import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private config;
    private s3;
    private bucket;
    private publicUrl;
    constructor(config: ConfigService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
}
