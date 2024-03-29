const OneSignal = require("@onesignal/node-onesignal");
import { isImage, isVideo, stringify } from "../utils/general";
import { GroupMessageEntity, MessageEntity } from "../entities/BaseEntity";
import logger from "../config/logger";
import { RedisGMOperationType, RedisKeyType, RedisPMOperationType, RedisSubKeyType } from "../enums/enums_socket";
import RedisService from "./redisService";
import { groupChatName } from "../utils/namespaceCreators";
import { io } from "../../stuplus.api/socket";
import { User } from "../entities/UserEntity";
import { MessageFiles } from "../entities/MessageEntity";
import { MessageType } from "../enums/enums";
export default class MessageService {
    public static async sendGroupMessage({ ownerId, text, groupChatId, fromUser, files, replyToId, type, mentionedUsers }: { ownerId: string; text: string; groupChatId: string; fromUser: User; files?: MessageFiles[], replyToId?: string, type?: MessageType, mentionedUsers?: [] }): Promise<any> {
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
                        _id: chatData.e.ownerId, //user id
                        username: fromUser.username, //username
                        firstName: fromUser.firstName, //first name
                        lastName: fromUser.lastName, //last name
                        profilePhotoUrl: fromUser.profilePhotoUrl, //profile picture url
                        avatarKey: fromUser.avatarKey, //avatar key
                    }
                };
                if (mentionedUsers) {
                    chatData.e["mentionedUsers"] = mentionedUsers;
                    emitData["mentionedUsers"] = mentionedUsers;
                }
                if (files) {
                    chatData.e["files"] = files;
                    chatData.e["type"] = type;
                    emitData["files"] = files;
                    emitData["type"] = type;
                } else {
                    chatData.e["type"] = MessageType.Text;
                    emitData["type"] = MessageType.Text;
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
                const groupMessageCount = await RedisService.incrementGroupChatMessageCount(chatData.e.groupChatId);
                await RedisService.client.hSet(RedisKeyType.User + chatData.e.ownerId + RedisSubKeyType.GroupChatReadCounts, chatData.e.groupChatId, groupMessageCount);
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

    public static async sendPrivateMessage({ toUserId, ownerId, text, chatId, fromUser, files, replyToId, type }: { toUserId: string, ownerId: string; text: string; chatId: string; fromUser: User; files?: MessageFiles[], replyToId?: string, type?: MessageType }): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const now = new Date();
                const messageEntity = new MessageEntity({});
                const chatData: any = {
                    e: {
                        _id: messageEntity.id,
                        ownerId: ownerId.toString(),
                        text: text,
                        chatId: chatId.toString(),
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisPMOperationType.InsertMessage
                }
                const emitData: any = {
                    t: chatData.e.text, mi: messageEntity.id, ci: chatData.e.chatId, f: {
                        _id: fromUser._id.toString(), //user id
                        username: fromUser.username, //username
                        firstName: fromUser.firstName, //first name
                        lastName: fromUser.lastName, //last name
                        profilePhotoUrl: fromUser.profilePhotoUrl, //profile picture url
                        avatarKey: fromUser.avatarKey, //avatar key
                    }
                };
                if (files) {
                    chatData.e["files"] = files;
                    chatData.e["type"] = type;
                    emitData["files"] = files;
                    emitData["type"] = type;
                } else {
                    chatData.e["type"] = MessageType.Text;
                    emitData["type"] = MessageType.Text;
                }

                if (replyToId) {
                    chatData.e["replyToId"] = replyToId;
                }
                await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + chatData.e.chatId, messageEntity.id + RedisPMOperationType.InsertMessage, stringify(chatData));
                chatData.e["owner"] = {
                    _id: chatData.e.ownerId,
                    username: fromUser.username
                }
                await RedisService.updatePrivateChatLastMessage(chatData.e, chatId);
                await RedisService.incrementUnreadPCCountForUser(toUserId, chatId);
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