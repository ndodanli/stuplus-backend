import oneSignalClient from "../config/oneSignal";
const OneSignal = require("@onesignal/node-onesignal");
import { config } from "../config/config";
import { chunk, stringify } from "../utils/general";
import { GroupMessageEntity, UserEntity } from "../entities/BaseEntity";
import logger from "../config/logger";
import { RedisGMOperationType, RedisKeyType } from "../enums/enums_socket";
import RedisService from "./redisService";
import { groupChatName } from "../utils/namespaceCreators";
import { io } from "../../stuplus.api/socket";
import { User } from "../entities/UserEntity";
export default class MessageService {

    public static async sendGroupMessage({ ownerId, text, groupChatId, fromUser }: { ownerId: string; text: string; groupChatId: string; fromUser: User; }): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const now = new Date();
                const gMessageEntity = new GroupMessageEntity({});
                const chatData: any = {
                    e: {
                        _id: gMessageEntity.id,
                        ownerId: ownerId,
                        text: text,
                        groupChatId: groupChatId,
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisGMOperationType.InsertMessage
                }

                await RedisService.client.hSet(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, gMessageEntity.id, stringify(chatData));
                io.in(groupChatName(chatData.e.groupChatId)).emit("cGmSend", {
                    t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                        uN: fromUser.username, //username
                        fN: fromUser.firstName, //first name
                        lN: fromUser.lastName, //last name
                        uId: fromUser._id.toString(), //user id
                        ppUrl: fromUser.profilePhotoUrl, //profile picture url
                        avKey: fromUser.avatarKey, //avatar key
                    }
                });
                resolve();
            } catch (error: any) {
                logger.error({ err: error }, `MessageService(senGroupMessage) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        ownerId: ownerId,
                        Text: text,
                        GroupChatId: groupChatId,
                    }));
                console.log({ err: error }, `MessageService(senGroupMessage) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        ownerId: ownerId,
                        Text: text,
                        GroupChatId: groupChatId,
                    }));
            }
        });
    }
}