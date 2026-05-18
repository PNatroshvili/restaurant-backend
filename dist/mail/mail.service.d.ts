import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { MailCampaign } from '../entities/mail-campaign.entity';
export declare class MailService {
    private usersRepo;
    private campaignsRepo;
    private readonly logger;
    private resend;
    constructor(usersRepo: Repository<User>, campaignsRepo: Repository<MailCampaign>);
    sendBulk(subject: string, html: string, toAll?: boolean, emails?: string[]): Promise<{
        ok: boolean;
        totalSent: number;
        totalFailed: number;
        total: number;
    }>;
    sendVerificationCode(email: string, code: string): Promise<void>;
    sendTest(subject: string, html: string, email: string): Promise<{
        ok: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: any;
    }>;
    getCampaigns(): Promise<MailCampaign[]>;
    getUserEmails(): Promise<{
        total: number;
        withEmail: number;
        emails: {
            name: string;
            email: string;
        }[];
    }>;
}
