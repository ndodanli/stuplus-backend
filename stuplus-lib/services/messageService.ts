const OneSignal = require("@onesignal/node-onesignal");
import { isImage, isVideo, stringify } from "../utils/general";
import { GroupMessageEntity, MessageEntity } from "../entities/BaseEntity";
import logger from "../config/logger";
import { RedisGMOperationType, RedisKeyType, RedisPMOperationType } from "../enums/enums_socket";
import RedisService from "./redisService";
import { groupChatName } from "../utils/namespaceCreators";
import { io } from "../../stuplus.api/socket";
import { User } from "../entities/UserEntity";
import { MessageFiles } from "../entities/MessageEntity";
import { MessageType } from "../enums/enums";
export default class MessageService {
    public static async sendGroupMessage({ ownerId, text, groupChatId, fromUser, files, replyToId }: { ownerId: string; text: string; groupChatId: string; fromUser: User; files?: MessageFiles[], replyToId?: string }): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const now = new Date();
                const gMessageEntity = new GroupMessageEntity({});
                const chatData: any = {
                    e: {
                        _id: gMessageEntity.id,
                        ownerId: ownerId.toString(),
                        text: text,
                        groupChatId: groupChatId.toString(),
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisGMOperationType.InsertMessage
                }

                const emitData: any = {
                    t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                        uN: fromUser.username, //username
                        fN: fromUser.firstName, //first name
                        lN: fromUser.lastName, //last name
                        uId: chatData.e.ownerId, //user id
                        ppUrl: fromUser.profilePhotoUrl, //profile picture url
                        avKey: fromUser.avatarKey, //avatar key
                    }
                };
                if (files) {
                    chatData.e["files"] = files;
                    chatData.e["type"] = isImage(files[0].mimeType ?? "") ? MessageType.Image : isVideo(files[0].mimeType ?? "") ? MessageType.Video : MessageType.File;
                    emitData["files"] = files;
                }
                if (replyToId) {
                    chatData.e["replyToId"] = replyToId;
                }

                await RedisService.client.hSet(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, gMessageEntity.id + RedisGMOperationType.InsertMessage, stringify(chatData));
                chatData.e["owner"] = {
                    _id: chatData.e.ownerId,
                    username: fromUser.username
                }
                await RedisService.updateGroupChatLastMessage(chatData.e, chatData.e.groupChatId);
                await RedisService.incrementGroupChatMessageCount(chatData.e.groupChatId);
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
                reject(error);
            }
        });
    }

    public static async sendPrivateMessage({ toUserId, ownerId, text, chatId, fromUser, files, replyToId }: { toUserId: string, ownerId: string; text: string; chatId: string; fromUser: User; files?: MessageFiles[], replyToId?: string }): Promise<any> {
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
                if (files) {
                    chatData.e["files"] = files;
                    chatData.e["type"] = isImage(files[0].mimeType ?? "") ? MessageType.Image : isVideo(files[0].mimeType ?? "") ? MessageType.Video : MessageType.File;
                    emitData["files"] = files;
                }
                if (replyToId) {
                    chatData.e["replyToId"] = replyToId;
                }
                await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + chatData.e.chatId, messageEntity.id + RedisPMOperationType.InsertMessage, stringify(chatData));
                chatData.e["owner"] = {
                    _id: chatData.e.ownerId,
                    username: fromUser.username
                }
                await RedisService.updateGroupChatLastMessage(chatData.e, chatData.e.groupChatId);
                io.in(toUserId).emit("cPmSend", emitData);
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