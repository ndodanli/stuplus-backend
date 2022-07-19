import oneSignalClient from "../config/oneSignal";
const OneSignal = require("@onesignal/node-onesignal");
import { config } from "../config/config";
import { chunk, stringify } from "../utils/general";
import { GroupMessageEntity, MessageEntity, UserEntity } from "../entities/BaseEntity";
import logger from "../config/logger";
import { RedisGMOperationType, RedisKeyType, RedisPMOperationType } from "../enums/enums_socket";
import RedisService from "./redisService";
import { groupChatName } from "../utils/namespaceCreators";
import { io } from "../../stuplus.api/socket";
import { User } from "../entities/UserEntity";
import { MessageFiles } from "../entities/MessageEntity";
export default class MessageService {

    public static async sendGroupMessage({ ownerId, text, groupChatId, fromUser, files }: { ownerId: string; text: string; groupChatId: string; fromUser: User; files?: MessageFiles[] }): Promise<any> {
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

                await RedisService.client.hSet(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, gMessageEntity.i + RedisGMOperationType.InsertMessage, stringify(chatData));
                const emitData: any = {
                    t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                        uN: fromUser.username, //username
                        fN: fromUser.firstName, //first name
                        lN: fromUser.lastName, //last name
                        uId: fromUser._id.toString(), //user id
                        ppUrl: fromUser.profilePhotoUrl, //profile picture url
                        avKey: fromUser.avatarKey, //avatar key
                    }
                };
                if (files)
                    emitData["files"] = files;

                io.in(groupChatName(chatData.e.groupChatId)).emit("cGmSend", emitData);
                resolve(chatData.e);
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

    public static async sendPrivateMessage({ toUserId, ownerId, text, chatId, fromUser, files }: { toUserId: string, ownerId: string; text: string; chatId: string; fromUser: User; files?: MessageFiles[] }): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const now = new Date();
                const messageEntity = new MessageEntity({});
                const chatData: any = {
                    e: {
                        _id: messageEntity.id,
                        ownerId: ownerId,
                        text: text,
                        chatId: chatId,
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisGMOperationType.InsertMessage
                }

                await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + chatData.e.chatId, messageEntity.i + RedisPMOperationType.InsertMessage, stringify(chatData));
                const emitData: any = {
                    t: chatData.e.text, mi: messageEntity.id, ci: chatData.e.chatId, f: {
                        uN: fromUser.username, //username
                        fN: fromUser.firstName, //first name
                        lN: fromUser.lastName, //last name
                        uId: fromUser._id.toString(), //user id
                        ppUrl: fromUser.profilePhotoUrl, //profile picture url
                        avKey: fromUser.avatarKey, //avatar key
                    }
                };
                if (files)
                    emitData["files"] = files;

                io.to(toUserId).emit("cGmSend", emitData);
                resolve(chatData.e);
            } catch (error: any) {
                logger.error({ err: error }, `MessageService(sendPrivateMessage) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        ToUserId: toUserId,
                        ownerId: ownerId,
                        Text: text,
                        ChatId: chatId,
                    }));
                console.log({ err: error }, `MessageService(sendPrivateMessage) failed. {Data}`, stringify(
                    {
                        ErorMessage: error.message,
                        ToUserId: toUserId,
                        ownerId: ownerId,
                        Text: text,
                        ChatId: chatId,
                    }));
            }
        });
    }
}