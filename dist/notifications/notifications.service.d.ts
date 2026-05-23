export declare class NotificationsService {
    private readonly logger;
    sendPushBatch(tokens: string[], title: string, body: string, data?: object): Promise<{
        sent: number;
        failed: number;
    }>;
    sendPushNotification(pushToken: string, title: string, body: string, data?: object): Promise<boolean>;
}
