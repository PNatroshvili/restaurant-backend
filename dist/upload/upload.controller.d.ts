import { UploadService } from './upload.service';
export declare class UploadController {
    private service;
    constructor(service: UploadService);
    upload(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
