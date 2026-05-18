import { MailService } from './mail.service';
export declare class MailController {
    private mailService;
    constructor(mailService: MailService);
    getRecipients(): Promise<{
        total: number;
        withEmail: number;
        emails: {
            name: string;
            email: string;
        }[];
    }>;
    getCampaigns(): Promise<import("../entities/mail-campaign.entity").MailCampaign[]>;
    sendBulk(body: {
        subject: string;
        html: string;
        toAll?: boolean;
        emails?: string[];
    }): Promise<{
        ok: boolean;
        totalSent: number;
        totalFailed: number;
        total: number;
    }>;
    sendTest(body: {
        subject: string;
        html: string;
        email: string;
    }): Promise<{
        ok: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: any;
    }>;
}
