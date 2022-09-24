import oneSignalClient from "../config/oneSignal";
// const OneSignal = require("@onesignal/node-onesignal");
import * as OneSignal from '@onesignal/node-onesignal'
import { config } from "../config/config";
import { chunk, stringify } from "../utils/general";
import { UserEntity } from "../entities/BaseEntity";
import logger from "../config/logger";
export default class OneSignalService {
    public static onlineUsers: Map<string, string> = new Map<string, string>();

    public static async sendNotification({ heading, playerIds, content, data = null, throwError = false }: { heading: string; playerIds: string[]; content: string; data?: any | null; throwError?: boolean; }) {
        return new Promise(async (resolve, reject) => {
            const notification = new OneSignal.Notification();
            try {
                notification.app_id = config.ONESIGNAL_APP_ID;
                const playerIdChunks = chunk(playerIds, 1900);
                for (let i = 0; i < playerIdChunks.length; i++) {
                    notification.include_player_ids = playerIdChunks[i];
                    notification.headings = {
                        en: heading
                    };
                    notification.contents = {
                        en: content
                    };
                    if (data)
                        notification.data = data;
                    const g = await oneSignalClient.createNotification(notification);
                    let a = 3;
                    // await oneSignalClient.createNotification(notification);
                }
                resolve(true);
            } catch (error: any) {
                logger.error({ err: error }, `OneSignalService(sendNotification) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        include_player_ids: notification.include_player_ids,
                        notification_headings: notification.headings,
                        notification_contents: notification.contents,
                        notification_data: notification.data
                    }));
                console.log({ err: error }, `OneSignalService(sendNotification) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        include_player_ids: notification.include_player_ids,
                        notification_headings: notification.headings,
                        notification_contents: notification.contents,
                        notification_data: notification.data
                    }));
                if (throwError) {
                    throw error;
                }
            }
        });
    }

    public static async sendNotificationWithUserIds({ heading, userIds, content, chatId, smallIcon, largeIcon, data = null, throwError = false }:
        { heading: string; userIds: string[]; content: string; chatId?: string; smallIcon?: string, largeIcon?: string; data?: any | null; throwError?: boolean; }) {
        return new Promise(async (resolve, reject) => {
            const notification = new OneSignal.Notification();
            try {
                notification.app_id = config.ONESIGNAL_APP_ID;
                const userIdChunks = chunk(userIds, 1900);
                for (let i = 0; i < userIdChunks.length; i++) {
                    notification.include_external_user_ids = userIdChunks[i];
                    notification.android_group = chatId;
                    notification.android_group_message = "Yeni mesajlarınız var";
                    if (chatId)
                        notification.adm_group = chatId;
                    // notification.small_icon = smallIcon;
                    // notification.adm_small_icon = smallIcon;
                    // notification.huawei_small_icon = smallIcon;
                    // notification.large_icon = largeIcon;
                    // notification.adm_large_icon = largeIcon;
                    // notification.huawei_large_icon = largeIcon;
                    notification.headings = {
                        en: heading
                    };
                    notification.contents = {
                        en: content
                    };
                    if (data)
                        notification.data = data;
                    // const { id } = await oneSignalClient.createNotification(notification);
                    await oneSignalClient.createNotification(notification);
                }
                resolve(true);
            } catch (error: any) {
                logger.error({ err: error }, `OneSignalService(sendNotification) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        include_player_ids: notification.include_player_ids,
                        notification_headings: notification.headings,
                        notification_contents: notification.contents,
                        notification_data: notification.data
                    }));
                console.log({ err: error }, `OneSignalService(sendNotification) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        include_player_ids: notification.include_player_ids,
                        notification_headings: notification.headings,
                        notification_contents: notification.contents,
                        notification_data: notification.data
                    }));
                if (throwError) {
                    throw error;
                }
            }
        });
    }
}