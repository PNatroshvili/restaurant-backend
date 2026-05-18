export declare class NotificationsService {
    private readonly logger;
    sendPushNotification(pushToken: string, title: string, body: string, data?: object): Promise<void>;
}
