import ISocket from "./interfaces/socket";
import { ChatEntity, GroupMessageEntity, GroupMessageReadEntity, MessageEntity, UserEntity, GroupChatEntity, GroupChatUserEntity, FollowEntity } from "../../stuplus-lib/entities/BaseEntity";
import "../../stuplus-lib/extensions/extensionMethods"
require("dotenv").config();
import { RedisSendFileMessageDTO, RedisGroupMessageDTO, RedisGroupMessageForwardReadDTO, RedisMessageDTO, RedisMessageForwardReadDTO, RedisUpdateFileMessageDTO, RedisGroupSendFileMessageDTO, RedisGroupUpdateFileMessageDTO } from "./dtos/RedisChat";
import { RedisPMOperationType, RedisKeyType, RedisGMOperationType, Role, WatchRoomTypes, GroupChatType, RedisSubKeyType } from "../../stuplus-lib/enums/enums_socket";
import { authorize, authorizeSocket } from "./utils/auth";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { AddToGroupChatDTO, ClearPMChatHistoryDTO, CreateGroupDTO, DeleteSingleGMDTO, DeleteSinglePMDTO, GetChatMessagesDTO, GetGroupChatMessagesDTO, GetGroupChatDataDTO, GetGroupUsersDTO, GetSearchedChatMessageDTO, GetSearchedChatMessagesDTO, GetSearchedGroupChatMessageDTO, GetSearchedGroupChatMessagesDTO, LeaveGroupDTO, MakeUsersGroupAdminDTO, RemoveFromGroupChatDTO, RemovePrivateChatsDTO, UpdateGroupInfoDTO, WatchUsersDTO, GetPrivateChatDataDTO } from "./dtos/Chat";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { groupChatName, userWatchRoomName } from "../../stuplus-lib/utils/namespaceCreators";
import RedisService from "../../stuplus-lib/services/redisService";
import { searchable, stringify, searchableWithSpaces, chunk, sortByCreatedAtDesc, isValidUrl } from "../../stuplus-lib/utils/general";
import { MessageDocument, MessageFiles, ReplyToDTO } from "../../stuplus-lib/entities/MessageEntity";
import { DeleteChatForType, GroupChatUserRole, MessageLimitation, MessageType, RecordStatus, RedisMessagesNotFoundType } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { Router } from "express";
import { uploadFileS3 } from "../../stuplus-lib/services/fileService";
import { validateAddToGroup, validateBlockUser, validateClearPMChat, validateCreateGroup, validateDeleteSinglePM, validateGetGroupChatData, validateGetGroupMessages, validateGetPrivateChatData, validateGetPrivateMessages, validateLeaveGroup, validateRemoveFromGroup, validateRemovePrivateChats, validateSendFileGM, validateSendFileMessage, validateUpdateFileGM, validateUpdateFileMessage } from "../middlewares/validation/chat/validateChatRoute";
import { GroupMessageDocument } from "../../stuplus-lib/entities/GroupMessageEntity";
import { GroupChatUserDocument } from "../../stuplus-lib/entities/GroupChatUserEntity";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { Chat } from "../../stuplus-lib/entities/ChatEntity";
import { GroupChat } from "../../stuplus-lib/entities/GroupChatEntity";
import { isValidObjectId } from "mongoose";
import { GroupAccess } from "../dataAccess/groupAccess";
import OnlineUserService from "../../stuplus-lib/services/onlineUsersService";
import OneSignalService from "../../stuplus-lib/services/oneSignalService";
import { User } from "../../stuplus-lib/entities/UserEntity";
import MessageService from "../../stuplus-lib/services/messageService";
import userLimits from "../../stuplus-lib/constants/userLimits";
const router = Router();

const io = require("socket.io")(3000, {
    pingTimeout: 30000,
    maxHttpBufferSize: 1e8,
    // allowRequest: (req, callback) => {
    //     const isOriginValid = check(req);
    //     callback(null, isOriginValid);
    // },
    transports: ["websocket"],
    allowUpgrades: true,
    cors: {
        origin: "*",
        // allowedHeaders: ["my-custom-header"],
        // credentials: true
    }
});

const initializeSocket = async () => {
    // return new Promise(async (resolve, reject) => {
    //     await RedisService.setGroupChats();
    //     resolve(true);
    // });
}

io.on("connection", async (socket: ISocket) => {
    console.log("socket.handshake.auth", socket.handshake.auth);
    const decodedJwtUser: any = authorizeSocket(socket.handshake.auth.token);
    if (!decodedJwtUser) {
        socket.disconnect();
        return;
    }
    const user = await RedisService.acquireUser(decodedJwtUser["_id"], [
        "blockedUserIds", "firstName", "lastName", "profilePhotoUrl", "username", "avatarKey"
    ]);
    if (!user) {
        socket.disconnect();
        return;
    }
    OnlineUserService.onlineUsers.set(decodedJwtUser["_id"], socket.id);
    user._id = decodedJwtUser["_id"];
    socket.data.user = user;

    const groupChatIds = await RedisService.acquireUserGroupChatIds(socket.data.user._id);
    for (let i = 0; i < groupChatIds.length; i++) {
        socket.join(groupChatName(groupChatIds[i]));
    }

    io.in(userWatchRoomName(user._id)).emit("cWatchUsers", {
        id: user._id,
        t: WatchRoomTypes.UserOnline
    });
    console.log("client connected. socket id: ", socket.id);

    socket.join(user._id);

    socket.on("disconnect", async (reason: any) => {
        console.log("disconnect: reason ", reason); // "ping timeout"
        OnlineUserService.onlineUsers.delete(socket.data.user._id);
        await UserEntity.findOneAndUpdate({ _id: socket.data.user._id }, {
            lastSeenDate: new Date()
        });
        io.in(userWatchRoomName(socket.data.user._id)).emit("cWatchUsers", {
            id: socket.data.user._id,
            t: WatchRoomTypes.UserOffline
        });
    });

    socket.on("writing", async (data: { to: string }) => {
        // if (data.to && await OnlineUserService.isOnline(data.to))
        //TODO: frontendde `gc-${groupId}` formatinda gonderilmeli
        io.to(data.to).emit("cWriting");
    });

    socket.on("pmSend", async (data: RedisMessageDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.t || !data.to) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            if (data.t.length > 1200)
                cb({ success: false, message: getMessage("messageTooLong", ["tr"]) });

            const toUser = await RedisService.acquireUser(data.to, [
                "_id", "blockedUserIds", "privacySettings", "username"
            ]);
            const toUserId = toUser._id.toString();

            if (!toUser)
                cb({ success: false, message: "User not found." });

            if (toUser.blockedUserIds?.includes(socket.data.user._id)) {
                cb({ success: false, message: getMessage("thisUserBlockedYou", ["tr"]) });
                return;
            }

            if (toUser.privacySettings.messageLimitation == MessageLimitation.OnlyWhoUserFollows &&
                !await FollowEntity.exists({ followerId: toUserId, followingId: socket.data.user._id, recordStatus: RecordStatus.Active })) {
                cb({ success: false, message: getMessage("cantSendMessageFollow", ["tr"], [toUser.username]) });
                return;
            }

            let responseData: any = { success: true };

            if (!data.ci) {
                if (await RedisService.isDailyNewPMLimitExceeded(socket.data.user._id))
                    cb({ success: false, message: getMessage("dailyNewPMLimitExceeded", ["tr"]) });

                const chatEntity = await ChatEntity.findOneAndUpdate(
                    {
                        $or: [
                            { ownerId: socket.data.user._id, participantId: data.to },
                            { ownerId: data.to, participantId: socket.data.user._id },
                        ],
                    },
                    { $setOnInsert: { ownerId: socket.data.user._id, participantId: data.to } },
                    { upsert: true, new: true });
                data.ci = chatEntity.id; //may be null, catch it later
                responseData["ci"] = data.ci;
                await RedisService.addPrivateChat(chatEntity);
                if (data.ci) {
                    await RedisService.addToUserPrivateChatIds(chatEntity.ownerId, data.ci);
                }
                await RedisService.incrementDailyNewPMCount(socket.data.user._id);
            }
            if (data.ci)
                await RedisService.addToUserPrivateChatIds(data.to, data.ci);

            const now = new Date();
            const messageEntity = new MessageEntity({});
            const chatData: { e: any, t: number } = {
                e: {
                    _id: messageEntity.id,
                    ownerId: socket.data.user._id,
                    text: data.t,
                    chatId: data.ci,
                    replyToId: data.rToId,
                    createdAt: now,
                    updatedAt: now,
                }, t: RedisPMOperationType.InsertMessage
            }

            chatData.e["type"] = data.t.split(" ").some(x => isValidUrl(x)) ? MessageType.Link : MessageType.Text;

            responseData["mi"] = messageEntity.id;

            await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + data.ci, messageEntity.id + RedisPMOperationType.InsertMessage, stringify(chatData));
            chatData.e["owner"] = {
                _id: socket.data.user._id,
                username: socket.data.user.username,
            }
            await RedisService.updatePrivateChatLastMessage(chatData.e, chatData.e.chatId);
            const emitData = { t: data.t, mi: messageEntity.id, ci: data.ci, f: null };

            if (!data.ci)
                emitData["f"] = socket.data.user;

            if (await OnlineUserService.isOnline(data.to)) {
                socket.to(data.to).emit("cPmSend", emitData);
            }
            else {
                // await OneSignalService.sendNotificationWithUserIds({
                //     heading: socket.data.user.username,
                //     userIds: [data.to],
                //     content: data.m,
                // })
            }

            cb(responseData);
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("pmForwarded", async (data: RedisMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.ci || !data.to) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }
            const now = new Date();
            const chatData: object = {
                e: {
                    ownerId: socket.data.user._id,
                    chatId: data.ci,
                    createdAt: now
                }, t: RedisPMOperationType.UpdateForwarded
            };
            await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + data.ci, socket.data.user._id + RedisPMOperationType.UpdateForwarded, stringify(chatData));

            io.to(data.to).emit("cPmForwarded", { ci: data.ci });

            cb({ success: true });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("pmReaded", async (data: RedisMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.ci || !data.to) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            const now = new Date();
            const chatData: object = {
                e: {
                    ownerId: socket.data.user._id,
                    chatId: data.ci,
                    createdAt: now
                }, t: RedisPMOperationType.UpdateReaded
            }

            await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + data.ci, socket.data.user._id + RedisPMOperationType.UpdateReaded, stringify(chatData));

            io.to(data.to).emit("cPmReaded", { ci: data.ci });

            cb({ success: true });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("gmSend", async (data: RedisGroupMessageDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.gCi || !data.t) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            if (data.t.length > 1200)
                cb({ success: false, message: getMessage("messageTooLong", ["tr"]) });

            if (!await RedisService.isUserInGroupChat(socket.data.user._id, data.gCi)) {
                cb({ success: false, message: getMessage("youAreNotInGroup", ["tr"]) });
                return;
            }
            const now = new Date();
            const gMessageEntity = new GroupMessageEntity({});
            const chatData: { e: any, t: number } = {
                e: {
                    _id: gMessageEntity.id,
                    ownerId: socket.data.user._id,
                    text: data.t,
                    groupChatId: data.gCi,
                    replyToId: data.rToId,
                    createdAt: now,
                },
                t: RedisGMOperationType.InsertMessage
            }

            chatData.e["type"] = data.t.split(" ").some(x => isValidUrl(x)) ? MessageType.Link : MessageType.Text;

            await RedisService.client.hSet(RedisKeyType.DBGroupMessage + data.gCi, gMessageEntity.id + RedisGMOperationType.InsertMessage, stringify(chatData));
            chatData.e["owner"] = {
                _id: socket.data.user._id,
                username: socket.data.user.username,
            }
            await RedisService.updateGroupChatLastMessage(chatData.e, chatData.e.groupChatId);
            await RedisService.incrementGroupChatMessageCount(chatData.e.groupChatId);
            const gcName = groupChatName(data.gCi);
            socket.to(gcName).emit("cGmSend", { t: data.t, mi: gMessageEntity.id, gCi: data.gCi, f: socket.data.user });
            cb({ success: true, mi: gMessageEntity.id });

            // const online
            const clients = io.sockets.adapter.rooms.get('chatId');
            for (const clientId of clients) {

                //this is the socket of each client in the room.
                const clientSocket = io.sockets.sockets.get(clientId);
                clientSocket.connected
                //you can do whatever you need with this

            }

            //TODO: send notification to offline users

        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("gmForwarded", async (data: RedisGroupMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.gCi) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            const now = new Date();
            const chatData: object = {
                e: {
                    groupChatId: data.gCi,
                    forwardedTo: socket.data.user._id,
                    lastForwardedAt: now,
                },
                t: RedisGMOperationType.UpdateForwarded
            }
            await RedisService.client.hSet(RedisKeyType.DBGroupMessage + data.gCi, socket.data.user._id + RedisGMOperationType.UpdateForwarded, stringify(chatData));

        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("gmReaded", async (data: RedisGroupMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.gCi) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            const now = new Date();
            const chatData: object = {
                e: {
                    groupChatId: data.gCi,
                    readedBy: socket.data.user._id,
                    lastReadedAt: now,
                },
                t: RedisGMOperationType.UpdateReaded
            }
            await RedisService.client.hSet(RedisKeyType.DBGroupMessage + data.gCi, socket.data.user._id + RedisGMOperationType.UpdateReaded, stringify(chatData));

            const groupMessageCount = await RedisService.client.hGet(RedisKeyType.AllGroupChats, data.gCi + ":mc").then(res => parseInt(res ?? "0"));

            await RedisService.client.hSet(RedisKeyType.User + socket.data.user._id + RedisSubKeyType.GroupChatReadCounts, data.gCi, groupMessageCount);

        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("watchUsers", async (data: WatchUsersDTO, cb: Function) => {
        if (!data.uIds || !data.uIds.length) {
            cb({ success: false, message: "Invalid parameters." });
            return;
        }
        if (data.uIds.length > 20) {
            cb({ success: false, message: "You can only watch 20 users at once." });
            return;
        }

        try {
            const usersToJoin = data.uIds.map(uId => userWatchRoomName(uId));
            socket.join(usersToJoin);
            const onlineUsersFromUsersToJoin = [...OnlineUserService.onlineUsers.keys()].filter(onlineUId => data.uIds?.includes(onlineUId));
            cb({ success: true, onlineUserIds: onlineUsersFromUsersToJoin });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("unwatchUsers", async (data: WatchUsersDTO, cb: Function) => {
        if (!data.uIds || !data.uIds.length) {
            cb({ success: false, message: "Invalid parameters." });
            return;
        }
        if (data.uIds.length > 50) {
            cb({ success: false, message: "You can only leave watching 50 users at once." });
            return;
        }

        try {
            const usersToLeave = data.uIds.map(uId => userWatchRoomName(uId));
            usersToLeave.forEach(u => {
                socket.leave(u);
            });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });
});

//TEST: PASSED
router.get("/unblockUser/:userId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<any>, res: any) => {
    /* #swagger.tags = ['Chat']
          #swagger.description = 'Unblock user by id.' */
    const response = new BaseResponse<any>();
    try {
        const userId = req.params.userId;
        if (!userId || !isValidObjectId(userId)) {
            throw new NotValidError("Invalid user id.");
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // const addedToUserBlockList = await UserEntity.findOneAndUpdate({ _id: res.locals.user._id }, { $push: { blockedUserIds: payload.userId } }, { new: true });
        // if (!addedToUserBlockList)
        //     throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));
        const user = await UserEntity.findOne({ _id: res.locals.user._id });
        if (!user)
            throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));

        user.blockedUserIds = user.blockedUserIds.filter(id => id !== userId);
        user.markModified("blockedUserIds");
        await user.save();

        await RedisService.updateUser(user);

        response.setMessage(getMessage("userUnblockedSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//TEST: PASSED
router.post("/getBlockedUsers", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    /* #swagger.tags = ['Chat']
          #swagger.description = 'Get blocked users.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/BasePaginationRequest" }
  } */
    const response = new BaseResponse<any>();
    try {

        const payload = new BaseFilter(req.body);
        const blockedUserIds = await RedisService.acquireUser(res.locals.user._id, ["blockedUserIds"]);
        let blockedUsersQuery = UserEntity.find({ _id: { $in: blockedUserIds.blockedUserIds } }, {
            _id: 1, username: 1, firstName: 1, lastName: 1,
            profilePhotoUrl: 1, avatarKey: 1
        });

        if (payload.lastRecordId)
            blockedUsersQuery = blockedUsersQuery.where({ _id: { $lt: payload.lastRecordId } });

        const blockedUsers = await blockedUsersQuery.sort({ _id: -1 }).limit(payload.take).lean();
        response.data = blockedUsers;

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//TEST: PASSED
router.get("/blockUser/:userId", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateBlockUser, async (req: CustomRequest<any>, res: any) => {
    /* #swagger.tags = ['Chat']
          #swagger.description = 'Block user by id.' */
    const response = new BaseResponse<any>();
    try {
        const userId = req.params.userId;
        if (!userId || !isValidObjectId(userId)) {
            throw new NotValidError("Invalid user id.");
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // const addedToUserBlockList = await UserEntity.findOneAndUpdate({ _id: res.locals.user._id }, { $push: { blockedUserIds: userId } }, { new: true });
        // if (!addedToUserBlockList)
        //     throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));
        const user = await UserEntity.findOne({ _id: res.locals.user._id });
        if (!user)
            throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));

        if (!user.blockedUserIds.includes(userId))
            user.blockedUserIds.push(userId);

        user.markModified("blockedUserIds");
        await user.save();

        await FollowEntity.updateMany({
            $or: [
                { followerId: res.locals.user._id, followingId: userId },
                { followerId: userId, followingId: res.locals.user._id }
            ]
        }, { recordStatus: RecordStatus.Deleted });

        await RedisService.updateUser(user);

        response.setMessage(getMessage("userBlockedSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/deleteSingleGM", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateDeleteSinglePM, async (req: CustomRequest<DeleteSingleGMDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Delete a gm from gm chat.' */
    /*	#swagger.requestBody = {
       required: true,
       schema: { $ref: "#/definitions/ChatDeleteSingleGMRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/NullResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new DeleteSingleGMDTO(req.body);

        const now = new Date();
        const redisMultiRes = await RedisService.client.multi()
            .hGet(RedisKeyType.DBGroupMessage + payload.groupChatId, payload.messageId + RedisGMOperationType.InsertMessage)
            .hDel(RedisKeyType.DBGroupMessage + payload.groupChatId, payload.messageId + RedisGMOperationType.InsertMessage)
            .exec();
        const message = redisMultiRes[0] as string;
        if (payload.deleteFor == DeleteChatForType.Both) {
            if (message) {
                const newMessageEntity = new GroupMessageEntity({}); //for duplications with clearing history, assing a new id
                const newRedisMessage = JSON.parse(message).e;
                newRedisMessage._id = newMessageEntity.id;
                newRedisMessage.recordStatus = RecordStatus.Deleted;
                newRedisMessage.recordDeletionDate = now;
                await RedisService.client.hSet(RedisKeyType.DBGroupMessage + payload.groupChatId, payload.messageId + RedisGMOperationType.InsertMessage, stringify(newRedisMessage));
            } else {
                await GroupMessageEntity.findOneAndUpdate(
                    { _id: payload.messageId, ownerId: res.locals.user._id },
                    {
                        recordStatus: RecordStatus.Deleted,
                        recordDeletionDate: now
                    }
                );
            }
            io.to(payload.groupChatId).emit("singleGMDeleted", { mi: payload.messageId, ci: payload.groupChatId });
            response.setMessage(getMessage("singleMessageDeletedMeSuccess", req.selectedLangs()));
        } else {
            if (message) {
                const newMessageEntity = new GroupMessageEntity({}); //for duplications with clearing history, assing a new id
                const newRedisMessage = JSON.parse(message).e;
                newRedisMessage._id = newMessageEntity.id;
                if (!newRedisMessage.deletedForUserIds) newRedisMessage.deletedForUserIds = [];
                newRedisMessage.deletedForUserIds.push(res.locals.user._id);
                newRedisMessage.deletedForUserDate = now;
                await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + payload.groupChatId, payload.messageId + RedisPMOperationType.InsertMessage, stringify(newRedisMessage));
            } else {
                await GroupMessageEntity.findOneAndUpdate(
                    { _id: payload.messageId, ownerId: res.locals.user._id },
                    {
                        $push: {
                            deletedForUserIds: res.locals.user._id,
                        },
                        deletedForUserDate: now
                    }
                );
            }
            response.setMessage(getMessage("singleMessageDeletedBothSuccess", req.selectedLangs()));
        }

        // if (!deleted)
        //     throw new NotValidError(getMessage("unknownError", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/deleteSinglePM", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateDeleteSinglePM, async (req: CustomRequest<DeleteSinglePMDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Delete a pm from pm chat.' */
    /*	#swagger.requestBody = {
       required: true,
       schema: { $ref: "#/definitions/ChatDeleteSinglePMRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/NullResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new DeleteSinglePMDTO(req.body);

        const now = new Date();
        const redisMultiRes = await Promise.all([
            RedisService.client.hGet(RedisKeyType.DBPrivateMessage + payload.chatId, payload.messageId + RedisPMOperationType.InsertMessage),
            RedisService.client.hDel(RedisKeyType.DBPrivateMessage + payload.chatId, payload.messageId + RedisPMOperationType.InsertMessage)
        ])

        const message = redisMultiRes[0] as string;
        if (payload.deleteFor == DeleteChatForType.Both) {
            if (message) {
                const newMessageEntity = new MessageEntity({}); //for duplications with clearing history, assing a new id
                const newRedisMessage = JSON.parse(message).e;
                newRedisMessage._id = newMessageEntity.id;
                newRedisMessage.recordStatus = RecordStatus.Deleted;
                newRedisMessage.recordDeletionDate = now;
                await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + payload.chatId, payload.messageId + RedisPMOperationType.InsertMessage, stringify(newRedisMessage));
            } else {
                await MessageEntity.findOneAndUpdate(
                    { _id: payload.messageId, ownerId: res.locals.user._id },
                    {
                        recordStatus: RecordStatus.Deleted,
                        recordDeletionDate: now
                    }
                );
            }
            const chat = await ChatEntity.findOne({ _id: payload.chatId }).lean(true);
            const toId = chat?.ownerId == res.locals.user._id ? chat?.participantId : chat?.ownerId;
            io.to(toId).emit("singlePMDeleted", { mi: payload.messageId, ci: payload.chatId });
            response.setMessage(getMessage("singleMessageDeletedMeSuccess", req.selectedLangs()));
        } else {
            if (message) {
                const newMessageEntity = new MessageEntity({}); //for duplications with clearing history, assing a new id
                const newRedisMessage = JSON.parse(message).e;
                newRedisMessage._id = newMessageEntity.id;
                if (!newRedisMessage.deletedForUserIds) newRedisMessage.deletedForUserIds = [];
                newRedisMessage.deletedForUserIds.push(res.locals.user._id);
                newRedisMessage.deletedForUserDate = now;
                await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + payload.chatId, payload.messageId + RedisPMOperationType.InsertMessage, stringify(newRedisMessage));
            } else {
                await MessageEntity.findOneAndUpdate(
                    { _id: payload.messageId, ownerId: res.locals.user._id },
                    {
                        $push: {
                            deletedForUserIds: res.locals.user._id,
                        },
                        deletedForUserDate: now
                    }
                );
            }
            response.setMessage(getMessage("singleMessageDeletedBothSuccess", req.selectedLangs()));
        }

        // if (!deleted)
        //     throw new NotValidError(getMessage("unknownError", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/clearPMChatHistory", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateClearPMChat, async (req: CustomRequest<ClearPMChatHistoryDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
     #swagger.description = 'Clear pm chat history.' */
    /*	#swagger.requestBody = {
       required: true,
       schema: { $ref: "#/definitions/ChatClearPMChatHistoryRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/NullResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new ClearPMChatHistoryDTO(req.body);

        if (!await ChatEntity.exists({
            _id: payload.chatId,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ],
            recordStatus: RecordStatus.Active
        }))
            throw new NotValidError(getMessage("unauthorized", res.selectedLangs()));

        const redisChatKey = RedisKeyType.DBPrivateMessage + payload.chatId;
        const redisMultiResponse = await Promise.all([
            RedisService.client.hVals(redisChatKey),
            RedisService.client.del(redisChatKey)
        ])

        const redisMessagesString = redisMultiResponse[0] as string[];

        const redisMessages = redisMessagesString.map(y => {
            const data = JSON.parse(y);
            if (data.t == RedisPMOperationType.InsertMessage)
                return data.e;
        })

        const now = new Date();
        let redisHashMessagesObj: any = {};
        if (payload.deleteFor == DeleteChatForType.Both) {
            for (let i = redisMessages.length - 1; i >= 0; i--) {
                const redisMessage = redisMessages[i];
                redisMessage.recordStatus = RecordStatus.Deleted;
                redisMessage.recordDeletionDate = now;
                const type = redisMessage.t;
                redisHashMessagesObj[redisMessage._id + type] = stringify(redisMessage);
            }
            if (Object.keys(redisHashMessagesObj).length > 0)
                await RedisService.client.hSet(redisChatKey, redisHashMessagesObj);

            await MessageEntity.updateMany({
                chatId: payload.chatId,
            }, {
                recordStatus: RecordStatus.Deleted,
                recordDeletionDate: now
            });
            response.setMessage(getMessage("clearPMChatHistoryMeSuccess", res.selectedLangs()));
        }
        else {
            for (let i = redisMessages.length - 1; i >= 0; i--) {
                const redisMessage = redisMessages[i];
                if (!redisMessage.deletedForUserIds) redisMessage.deletedForUserIds = [];
                redisMessage.deletedForUserIds.push(res.locals.user._id);
                redisMessage.deletedForUserDate = now;
                const type = redisMessage.t;
                redisHashMessagesObj[redisMessage._id + type] = stringify(redisMessage);
            }
            if (Object.keys(redisHashMessagesObj).length > 0)
                await RedisService.client.hSet(redisChatKey, redisHashMessagesObj);
            await MessageEntity.updateMany({
                chatId: payload.chatId,
            }, {
                $push: {
                    "deletedForUserIds": res.locals.user._id
                },
                deletedForUserDate: now
            });
            response.setMessage(getMessage("clearPMChatHistoryBothSuccess", res.selectedLangs()));
        }


    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//TODO: pagination(maybe)
router.get("/getPMChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    /* #swagger.tags = ['Chat']
      #swagger.description = 'Get pm chats.' */
    const response = new BaseResponse<Chat[]>();
    try {
        const userPrivateChatIds = await RedisService.acquireUserPrivateChatIds(res.locals.user._id);
        if (userPrivateChatIds.length == 0)
            return Ok(res, response);

        const getPMChatOps = [];
        for (let i = 0; i < userPrivateChatIds.length; i++) {
            getPMChatOps.push(RedisService.client.hGet(RedisKeyType.AllPrivateChats, userPrivateChatIds[i]));
            getPMChatOps.push(RedisService.client.hGet(RedisKeyType.AllPrivateChats, userPrivateChatIds[i] + ":lm"));
        }
        const redisPrivateChats = await Promise.all(getPMChatOps);
        const userPrivateChats: Chat[] = [];
        const missingPrivateChatIds = [];
        const missingPrivateChatLMIds = [];
        let indexCounter = 0;
        for (let i = 0; i < redisPrivateChats.length; i += 2) {
            let privateChat: any = null;
            if (!redisPrivateChats[i]) {
                missingPrivateChatIds.push(userPrivateChatIds[indexCounter]);
            } else {
                privateChat = JSON.parse(redisPrivateChats[i] ?? "{}");
            }
            if (privateChat) {
                if (!redisPrivateChats[i + 1]) {
                    missingPrivateChatLMIds.push(userPrivateChatIds[indexCounter]);
                } else {
                    privateChat.lastMessage = JSON.parse(redisPrivateChats[i + 1] ?? "{}");
                }
                userPrivateChats.push(privateChat);
            }
            indexCounter++;
        }
        if (missingPrivateChatIds.length > 0) {
            const privateChatsFromDb = await ChatEntity.find({ _id: { $in: missingPrivateChatIds } }, { _id: 1, ownerId: 1, participantId: 1 }).lean(true);
            for (let i = 0; i < privateChatsFromDb.length; i++) {
                userPrivateChats.push(privateChatsFromDb[i]);
                missingPrivateChatLMIds.push(privateChatsFromDb[i]._id.toString());
                await RedisService.addPrivateChat(privateChatsFromDb[i]);
            }
        }
        if (missingPrivateChatLMIds.length > 0) {
            const notFoundLastMessages: any = await MessageEntity.aggregate([
                { $match: { chatId: { $in: missingPrivateChatLMIds }, recordStatus: RecordStatus.Active } },
                { $sort: { _id: -1 } },
                {
                    $group: {
                        _id: "$chatId",
                        ownerId: { $first: "$ownerId" },
                        text: { $first: "$text" },
                        files: { $first: "$files" },
                        createdAt: { $first: "$createdAt" },
                    }
                }
            ]);
            const notFoundUserIds = [];
            for (let i = 0; i < notFoundLastMessages.length; i++) {
                const privateChat = userPrivateChats.find((x: Chat) => x._id.toString() === notFoundLastMessages[i]._id.toString());
                if (privateChat) {
                    privateChat.lastMessage = {
                        ownerId: notFoundLastMessages[i].ownerId,
                        text: notFoundLastMessages[i].text,
                        files: notFoundLastMessages[i].files,
                        createdAt: notFoundLastMessages[i].createdAt,
                    };
                    notFoundUserIds.push(notFoundLastMessages[i].ownerId);
                }
            }
            const notFoundUsers = await UserEntity.find({ _id: { $in: notFoundUserIds } }, { _id: 1, username: 1 }).lean(true);
            for (let i = 0; i < notFoundLastMessages.length; i++) {
                const privateChat = userPrivateChats.find((x: Chat) => x._id.toString() === notFoundLastMessages[i]._id.toString());
                if (privateChat) {
                    //deep copy object
                    const notFoundUser = JSON.parse(JSON.stringify(notFoundUsers.find((x: any) => x._id.toString() === privateChat.lastMessage.ownerId.toString())));
                    privateChat.lastMessage.owner = notFoundUser;
                    await RedisService.updatePrivateChatLastMessage(privateChat.lastMessage, privateChat._id.toString());
                }
            }
        }

        const requiredUserIds = userPrivateChats.map(x => {
            if (x.ownerId === res.locals.user._id) {
                return x.participantId;
            } else {
                return x.ownerId;
            }
        });

        const users = await UserEntity.find({ _id: { $in: requiredUserIds } }, {
            _id: 1, username: 1, firstName: 1, lastName: 1,
            avatarKey: 1, profilePhotoUrl: 1, lastSeenDate: 1
        }).lean(true);

        const pmIndexesToRemove: number[] = [];
        let redisPMReadLastReadedAt: any;
        const redisPMs: any = [];
        for (let i = 0; i < userPrivateChats.length; i++) {
            const userPMChat = userPrivateChats[i];
            userPMChat.unreadMessageCount = 0;
            const redisPMAll = await RedisService.client.hVals(RedisKeyType.DBPrivateMessage + userPMChat._id.toString());
            for (let i = 0; i < redisPMAll.length; i++) {
                const chatData = JSON.parse(redisPMAll[i]);
                if (chatData.t == RedisPMOperationType.UpdateReaded && chatData.e.ownerId == res.locals.user._id)
                    redisPMReadLastReadedAt = chatData.e?.createdAt;
                else if (chatData.t == RedisPMOperationType.InsertMessage)
                    redisPMs.push(chatData.e);

            }
            if (redisPMReadLastReadedAt) {
                for (let i = 0; i < redisPMs.length; i++) {
                    if (new Date(redisPMReadLastReadedAt) <= new Date(redisPMs[i].createdAt) && redisPMs[i].ownerId != res.locals.user._id)
                        userPMChat.unreadMessageCount++
                }
                userPMChat.unreadMessageCount += await MessageEntity.find({
                    chatId: userPMChat._id,
                    createdAt: { $gt: redisPMReadLastReadedAt }
                }).limit(100).count();
            } else {
                userPMChat.unreadMessageCount += redisPMs.filter((x: { ownerId: string; }) => x.ownerId != res.locals.user._id).length;
                userPMChat.unreadMessageCount += await MessageEntity.find({
                    chatId: userPMChat._id,
                    readed: false,
                    ownerId: { $ne: res.locals.user._id }
                }).limit(100).count();
            }

            let chatUserId: string;
            if (userPMChat.ownerId === res.locals.user._id) {
                chatUserId = userPMChat.participantId;
            } else {
                chatUserId = userPMChat.ownerId;
            }

            if (chatUserId)
                userPMChat.chatUser = users.find(x => x._id.toString() === chatUserId);
            else
                pmIndexesToRemove.push(i);
        }
        pmIndexesToRemove.forEach(i => userPrivateChats.splice(i, 1));

        response.data = userPrivateChats.sort((a: any, b: any) => {
            a = new Date(a.lastMessage?.createdAt ?? 0);
            b = new Date(b.lastMessage?.createdAt ?? 0);
            if (a < b) return 1;
            if (a > b) return -1;
            return 0;
        });
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/getNewChatUsers", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    /* #swagger.tags = ['Chat']
        #swagger.description = 'Get new chat users to create a new chat(only users who current user follows, groups not included) .' */
    /*	#swagger.requestBody = {
       required: true,
       schema: { $ref: "#/definitions/BasePaginationSearchTermRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/ChatGetNewChatUsersResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new BaseFilter(req.body);
        let newChatUsersQuery = FollowEntity.find({ followerId: res.locals.user._id }, { _id: 0, followingId: 1, followingUsername: 1, followingFirstName: 1, followingLastName: 1, createdAt: 1 });

        if (payload.lastRecordId)
            newChatUsersQuery = newChatUsersQuery.where({ _id: { $lt: payload.lastRecordId } });

        if (payload.searchTerm)
            newChatUsersQuery = newChatUsersQuery.where({
                $or: [
                    { followingUsername: { $regex: payload.searchTerm, $options: "i" } },
                    { followingFirstName: { $regex: payload.searchTerm, $options: "i" } },
                    { followingLastName: { $regex: payload.searchTerm, $options: "i" } },
                ]
            });

        const newChatFollowingUsers = await newChatUsersQuery
            .sort({ _id: -1 })
            .limit(payload.take)
            .lean(true);

        const newChatFollowingUserIds: string[] = newChatFollowingUsers.map((x: { followingId: string; }) => x.followingId);

        let newChatUsers = await UserEntity.find({ _id: { $in: newChatFollowingUserIds } }, {
            _id: 1, profilePhotoUrl: 1, avatarKey: 1
        }).lean(true);

        for (let i = 0; i < newChatUsers.length; i++) {
            const followUser = newChatFollowingUsers.find((x: { followingId: string; }) => x.followingId === newChatUsers[i]._id.toString());
            if (followUser) {
                newChatUsers[i].createdAt = followUser.createdAt;
                newChatUsers[i].username = followUser.followingUsername;
                newChatUsers[i].firstName = followUser.followingFirstName;
                newChatUsers[i].lastName = followUser.followingLastName;
            }
        }
        newChatUsers = newChatUsers.sort((a: any, b: any) => {
            a = new Date(a.createdAt ?? 0);
            b = new Date(b.createdAt ?? 0);
            if (a < b) return 1;
            if (a > b) return -1;
            return 0;
        });
        response.data = newChatUsers;
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//TODO: pagination(maybe)
router.get("/getGMChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Get gm chats.' */
    const response = new BaseResponse<GroupChat[]>();
    try {
        const userGroupChatsIds = await RedisService.acquireUserGroupChatIds(res.locals.user._id);
        if (userGroupChatsIds.length == 0)
            return Ok(res, response);

        const getGMChatsOps = [];
        for (let i = 0; i < userGroupChatsIds.length; i++) {
            getGMChatsOps.push(RedisService.client.hGet(RedisKeyType.AllGroupChats, userGroupChatsIds[i]));
            getGMChatsOps.push(RedisService.client.hGet(RedisKeyType.AllGroupChats, userGroupChatsIds[i] + ":lm"));
            getGMChatsOps.push(RedisService.client.hGet(RedisKeyType.AllGroupChats, userGroupChatsIds[i] + ":mc"));
            getGMChatsOps.push(RedisService.client.hGet(RedisKeyType.User + res.locals.user._id + RedisSubKeyType.GroupChatReadCounts, userGroupChatsIds[i]));
        }
        const redisGroupChats = await Promise.all(getGMChatsOps);
        const userGroupChats: GroupChat[] = [];
        const missingGroupChatIds = [];
        const missingGroupChatLMIds = [];
        const groupChatNewMessageCount: Map<string, number> = new Map<string, number>();
        const userReadCounts: Map<string, number | undefined> = new Map<string, number | undefined>();
        let indexCounter = 0;
        for (let i = 0; i < redisGroupChats.length; i += 4) {
            let groupChat: any = null;
            if (!redisGroupChats[i]) {
                missingGroupChatIds.push(userGroupChatsIds[indexCounter]);
            } else {
                groupChat = JSON.parse(redisGroupChats[i] ?? "{}");
            }
            if (groupChat) {
                if (!redisGroupChats[i + 1]) {
                    missingGroupChatLMIds.push(userGroupChatsIds[indexCounter]);
                } else {
                    groupChat.lastMessage = JSON.parse(redisGroupChats[i + 1] ?? "{}");
                }
                userGroupChats.push(groupChat);
            }
            groupChatNewMessageCount.set(userGroupChatsIds[indexCounter], parseInt(redisGroupChats[i + 2] ?? "0"));
            if (redisGroupChats[i + 3])
                userReadCounts.set(userGroupChatsIds[indexCounter], parseInt(redisGroupChats[i + 3] ?? "NaN"));
            indexCounter++;
        }
        if (missingGroupChatIds.length > 0) {
            const groupChatsFromDb = await GroupChatEntity.find({ _id: { $in: missingGroupChatIds } }, { _id: 1, title: 1, coverImageUrl: 1 }).lean(true);
            for (let i = 0; i < groupChatsFromDb.length; i++) {
                userGroupChats.push(groupChatsFromDb[i]);
                missingGroupChatLMIds.push(groupChatsFromDb[i]._id.toString());
                await RedisService.addGroupChat(groupChatsFromDb[i]);
            }
        }
        if (missingGroupChatLMIds.length > 0) {
            const notFoundLastMessages: any = await GroupMessageEntity.aggregate([
                { $match: { groupChatId: { $in: missingGroupChatLMIds }, recordStatus: RecordStatus.Active } },
                { $sort: { _id: -1 } },
                {
                    $group: {
                        _id: "$groupChatId",
                        ownerId: { $first: "$ownerId" },
                        text: { $first: "$text" },
                        files: { $first: "$files" },
                        createdAt: { $first: "$createdAt" },
                    }
                }
            ]);

            const notFoundUserIds = [];
            for (let i = 0; i < notFoundLastMessages.length; i++) {
                const groupChat = userGroupChats.find((x: GroupChat) => x._id.toString() === notFoundLastMessages[i]._id.toString());
                if (groupChat) {
                    groupChat.lastMessage = {
                        ownerId: notFoundLastMessages[i].ownerId,
                        text: notFoundLastMessages[i].text,
                        files: notFoundLastMessages[i].files,
                        createdAt: notFoundLastMessages[i].createdAt,
                    };
                    notFoundUserIds.push(notFoundLastMessages[i].ownerId);
                }
            }
            const notFoundUsers = await UserEntity.find({ _id: { $in: notFoundUserIds } }, { _id: 1, username: 1 }).lean(true);
            for (let i = 0; i < notFoundLastMessages.length; i++) {
                const groupChat = userGroupChats.find((x: GroupChat) => x._id.toString() === notFoundLastMessages[i]._id.toString());
                if (groupChat) {
                    //deep copy object
                    const notFoundUser = JSON.parse(JSON.stringify(notFoundUsers.find((x: any) => x._id.toString() === groupChat.lastMessage.ownerId.toString())));
                    groupChat.lastMessage.owner = notFoundUser;
                    delete groupChat.lastMessage.ownerId;
                    await RedisService.updateGroupChatLastMessage(groupChat.lastMessage, groupChat._id.toString());
                }
            }
        }

        const dbGMReads: any = await GroupMessageReadEntity.find({ groupChatId: { $in: userGroupChatsIds }, readedBy: res.locals.user._id });

        let redisGMReadLastReadedAt: any;
        const redisGMs: any = [];
        const unreadMessageCountQueries: any = [];
        let unreadMessageCounts = [];
        for (let i = 0; i < userGroupChats.length; i++) {
            const userGroupChat = userGroupChats[i];
            userGroupChat.unreadMessageCount = 0;
            const userReadCount = userReadCounts.get(userGroupChat._id.toString());
            if (userReadCount == undefined || userReadCount == null || userReadCount == NaN) {
                const redisGMAll = await RedisService.client.hVals(RedisKeyType.DBGroupMessage + userGroupChat._id.toString());
                for (let i = 0; i < redisGMAll.length; i++) {
                    const chatData = JSON.parse(redisGMAll[i]);
                    if (chatData.t == RedisGMOperationType.UpdateReaded && chatData.readedBy == res.locals.user._id)
                        redisGMReadLastReadedAt = chatData.e?.lastReadedAt;
                    else if (chatData.t == RedisGMOperationType.InsertMessage)
                        redisGMs.push(chatData.e);
                }
                if (redisGMReadLastReadedAt) {
                    for (let i = 0; i < redisGMs.length; i++) {
                        if (new Date(redisGMReadLastReadedAt) <= new Date(redisGMs[i].createdAt) && redisGMs[i].ownerId != res.locals.user._id)
                            userGroupChat.unreadMessageCount++
                    }
                } else {
                    userGroupChat.unreadMessageCount += redisGMs.filter((x: { ownerId: string; }) => x.ownerId != res.locals.user._id).length;
                    redisGMReadLastReadedAt = dbGMReads.find((x: { groupChatId: string; }) => x.groupChatId === userGroupChat._id.toString())?.lastReadedAt;
                }

                if (redisGMReadLastReadedAt) {
                    unreadMessageCountQueries.push(GroupMessageEntity
                        .find({
                            groupChatId: userGroupChat._id,
                            createdAt: { $gt: redisGMReadLastReadedAt }
                        }).limit(100).count());
                } else {
                    unreadMessageCountQueries.push(GroupMessageEntity
                        .find({
                            groupChatId: userGroupChat._id
                        }).limit(100).count())
                }
            } else {
                userGroupChat.unreadMessageCount = (groupChatNewMessageCount.get(userGroupChat._id.toString()) ?? 0) - userReadCount;
            }
        }

        if (unreadMessageCountQueries.length > 0) {
            unreadMessageCounts = await Promise.all(unreadMessageCountQueries);
            for (let i = 0; i < userGroupChats.length; i++) {
                userGroupChats[i].unreadMessageCount += unreadMessageCounts[i];
                const groupMessageCount = groupChatNewMessageCount.get(userGroupChats[i]._id.toString()) ?? 0;
                await RedisService.client.hSet(RedisKeyType.User + res.locals.user._id + RedisSubKeyType.GroupChatReadCounts, userGroupChatsIds[i], groupMessageCount - userGroupChats[i].unreadMessageCount);
            }
        }

        response.data = userGroupChats.sort((a: any, b: any) => {
            a = new Date(a.lastMessage?.createdAt ?? 0);
            b = new Date(b.lastMessage?.createdAt ?? 0);
            if (a < b) return 1;
            if (a > b) return -1;
            return 0;
        });
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true(not chat)
router.post("/createGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "chat/group_images/", 5242880), validateCreateGroup, async (req: CustomRequest<any>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Create a new group chat.' */
    /*	#swagger.requestBody = {
    required: true,
   "@content": {
                  "multipart/form-data": {
                      schema: {
                          type: "object",
                          properties: {
                              coverImage: {
                                  type: "string",
                                  format: "binary"
                              },
                              userIds: {
                                    type: "array",
                                    items: {
                                        type: "string"
                                    }
                              },
                              hashTags: {
                                    type: "array",
                                    items: {
                                        type: "string"
                                    }
                              },
                              title: {
                                    type: "string",
                              },
                              type: {
                                    type: "number",
                                    description: "Public: 0, Private: 1",
                              }
                          },
                          required: ["userIds", "title", "type"]
                      }
                  }
              } 
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/AccountUpdateProfilePhotoResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }
        const currentUser = await UserEntity.findOne({ _id: res.locals.user._id }, { _id: 0, statistics: 1 }).lean(true);
        if (!currentUser)
            throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));

        if (currentUser.statistics.groupCount >= userLimits.TOTAL_GROUPS_PER_USER)
            throw new NotValidError(getMessage("userGroupLimitReached", req.selectedLangs()));

        //TODO: check if users who added can be added to group
        const payload = new CreateGroupDTO(req.body);
        if (typeof payload.userIds === "string")
            payload.userIds = payload.userIds.split(",");
        const redisOps: Promise<any>[] = [];
        if (payload.hashTags && payload.hashTags.length > 0) {
            payload.hashTags.forEach(async (x, index, arr) => {
                arr[index] = searchable(x);
                redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagEntity + `${arr[index]}`));
                redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagGroupPopularityIncr + `${arr[index]}:groupPopularity`));
            });
            await Promise.all(redisOps);
        }

        const groupChatEntity = await GroupChatEntity.create(
            {
                title: payload.title,
                titlesch: searchableWithSpaces(payload.title),
                ownerId: res.locals.user._id,
                type: payload.type,
                coverImageUrl: req.file?.location,
                avatarKey: payload.avatarKey,
                hashTags: payload.hashTags,
            });

        await RedisService.addGroupChat(groupChatEntity);
        const groupChatId = groupChatEntity._id.toString();

        const findGuardInPayloadUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInPayloadUsers != -1)
            payload.userIds.splice(findGuardInPayloadUsers, 1);

        let anyUserReachedLimit = false;
        const filteredUserIds = await UserEntity.find({ _id: { $in: payload.userIds }, "statistics.groupCount": { $lt: userLimits.TOTAL_GROUPS_PER_USER } }, { _id: 1 }).lean(true);
        if (payload.userIds.length != filteredUserIds.length)
            anyUserReachedLimit = true;
        payload.userIds = filteredUserIds.map(x => x._id.toString());
        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChatId, groupRole: GroupChatUserRole.Member });
        });
        chatUsers.push(new GroupChatUserEntity({ userId: res.locals.user._id, groupChatId: groupChatId, groupRole: GroupChatUserRole.Owner }));
        await GroupChatUserEntity.insertMany(chatUsers);
        await UserEntity.updateMany({ _id: { $in: chatUsers.map(x => x.userId) } }, { $inc: { "statistics.groupCount": 1 } })

        await RedisService.incrementGroupMemberCount(groupChatId, chatUsers.length);
        const addToUserGroupChatIdRedisOps = [];
        for (let i = 0; i < chatUsers.length; i++) {
            addToUserGroupChatIdRedisOps.push(RedisService.client.sAdd(RedisKeyType.User + RedisSubKeyType.GroupChatIds + chatUsers[i].userId, groupChatId));
        }
        await Promise.all(addToUserGroupChatIdRedisOps);
        const usersIdsNotFound = [];
        payload.userIds.push(res.locals.user._id); //add current user to group
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = OnlineUserService.onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                if (!socketUser) continue;
                socketUser.join(groupChatName(groupChatId));
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        io.in(groupChatName(groupChatEntity.id)).emit("cGroupCreated",
            {
                t: groupChatEntity.title,
                gCoIm: groupChatEntity.coverImage,
                gAvKey: groupChatEntity.avatarKey,
                gCi: groupChatId,
            });

        let responseMessage = payload.title + " ";
        if (findGuardInPayloadUsers != -1)
            responseMessage += getMessage("groupCreatedGuardSuccess", req.selectedLangs())
        else
            responseMessage += getMessage("groupCreatedSuccess", req.selectedLangs());

        if (anyUserReachedLimit)
            responseMessage += " " + getMessage("groupCreatedSomeUsersReachedLimit", req.selectedLangs());

        const groupGuard = await RedisService.acquireGroupGuard();

        await MessageService.sendGroupMessage({
            ownerId: groupGuard._id,
            text: responseMessage,
            groupChatId: groupChatId,
            fromUser: groupGuard
        });

        response.data = {
            t: groupChatEntity.title,
            gCoIm: groupChatEntity.coverImage,
            gAvKey: groupChatEntity.avatarKey,
            gCi: groupChatEntity.id,
        };

        if (findGuardInPayloadUsers != -1)
            response.setMessage(responseMessage);
        else
            response.setMessage(responseMessage);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.get("/removeGroup/:groupChatId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<any>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const groupChatId = req.params.groupChatId as string;

        const groupChatEntity = await GroupChatEntity.findOne({ _id: groupChatId });
        if (!groupChatEntity)
            throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));

        if (groupChatEntity.ownerId != res.locals.user._id)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        io.in(groupChatName(groupChatId)).emit("cGroupRemoved", {
            gCi: groupChatId,
        });

        io.of('/').in(groupChatName(groupChatId)).clients((error: any, socketIds: any[]): void => {
            if (!error && socketIds && socketIds.length > 0)
                socketIds.forEach((socketId: string | number) => io.sockets.sockets[socketId].leave(groupChatName(groupChatId)));
        });

        const users = await GroupChatUserEntity.find({ groupChatId: groupChatId }, { userId: 1 });
        const usersIds = users.map(x => x.userId);
        const usersIdsBatches = chunk(usersIds, 1000);
        for (let i = 0; i < usersIdsBatches.length; i++) {
            const usersIdsBatch = usersIdsBatches[i];
            await GroupChatUserEntity.updateMany({ groupChatId: groupChatId, userId: { $in: usersIdsBatch }, }, { recordStatus: RecordStatus.Deleted });
            await RedisService.decrementGroupMemberCount(groupChatId, usersIdsBatch.length);
            await RedisService.delGroupChatIdsFromUsers(usersIdsBatch, [groupChatId]);
            await UserEntity.updateMany({ _id: { $in: usersIdsBatch } }, { $inc: { "statistics.groupCount": -1 } });
        }

        groupChatEntity.recordStatus = RecordStatus.Deleted;
        await groupChatEntity.save();

        response.message = getMessage("groupRemovedSuccess", req.selectedLangs());
        //TODO: send notification to users

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true(not chat)
router.post("/updateGroupInfo", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "chat/group_images/", 5242880), async (req: CustomRequest<UpdateGroupInfoDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }
        const payload = new UpdateGroupInfoDTO(req.body);
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId });
        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));
        if (!await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id }))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        if (groupChat.title != payload.title)
            groupChat.titlesch = searchableWithSpaces(payload.title);
        groupChat.title = payload.title;
        groupChat.type = payload.type;
        groupChat.avatarKey = payload.avatarKey;
        const redisOps: Promise<any>[] = [];
        if (payload.hashTags) {
            payload.hashTags.forEach((x, index, arr) => {
                arr[index] = searchable(x)
            });
            const differences: string[] = payload.hashTags.filter(x => !groupChat.hashTags.includes(x));
            if (differences.length) {
                groupChat.hashTags = groupChat.hashTags.concat(differences);
                differences.forEach(x => {
                    redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagEntity + `${x}`));
                    redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagGroupPopularityIncr + `${x}:groupPopularity`));
                })
                await Promise.all(redisOps);
            }
        }
        if (req.file) {
            groupChat.coverImageUrl = req.file.location;
        }
        await groupChat.save();
        await RedisService.addGroupChat(groupChat);
        const groupChatUsers = await GroupChatUserEntity.find({ groupChatId: groupChat._id.toString() }, { "userId": 1 }).lean(true);
        const groupChatUserIds: string[] = groupChatUsers.map((groupChatUser: GroupChatUserDocument) => groupChatUser.userId);
        const offlineUserIds: string[] = [];
        for (let i = 0; i < groupChatUserIds.length; i++) {
            const userId = groupChatUserIds[i];
            const socketId = OnlineUserService.onlineUsers.get(userId);
            if (!socketId) {
                offlineUserIds.push(userId);
                //TODO:offline send notification

            }
        }
        io.in(groupChatName(groupChat._id.toString())).emit("cGroupInfoUpdated",
            {
                t: groupChat.title,
                gCoIm: groupChat.coverImage,
                gAvKey: groupChat.avatarKey,
                gCi: groupChat._id.toString(),
            });

        response.data = {
            t: groupChat.title,
            gCoIm: groupChat.coverImage,
            gAvKey: groupChat.avatarKey,
            gCi: groupChat._id.toString(),
        };

        response.setMessage(getMessage("groupUpdatedSuccess", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true
router.post("/getPMs", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetPrivateMessages, async (req: CustomRequest<GetChatMessagesDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
    #swagger.description = 'Ger private chat messages.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/ChatGetPrivateMessagesRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/ChatGetPrivateMessagesResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        const payload = new GetChatMessagesDTO(req.body);
        const chat = await ChatEntity.findOne({
            _id: payload.chatId,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ]
        }, { _id: 0, ownerId: 1, participantId: 1 });

        if (!chat)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        const otherUserId = chat.ownerId == res.locals.user._id ? chat.participantId : chat.ownerId;

        let messages: MessageDocument[] = [];
        let isFirstPage = !payload.lastRecordId;

        const redisMessagesWithFR = await RedisService.client
            .hVals(RedisKeyType.DBPrivateMessage + payload.chatId).then(x => x.map(y => JSON.parse(y)));
        let otherUserLastForwardedAt = await RedisService.client.hGet(RedisKeyType.DBPrivateMessage + payload.chatId, otherUserId + RedisPMOperationType.UpdateForwarded)
            .then(x => x ? JSON.parse(x).e.createdAt : new Date(0));
        let otherUserLastReadedAt = await RedisService.client.hGet(RedisKeyType.DBPrivateMessage + payload.chatId, otherUserId + RedisPMOperationType.UpdateReaded)
            .then(x => x ? JSON.parse(x).e.createdAt : new Date(0));
        if (isFirstPage) {
            let redisMessages = redisMessagesWithFR.filter(x => x.t == RedisPMOperationType.InsertMessage).map(x => x.e)
                .filter(x => x.recordStatus == undefined || x.recordStatus == RecordStatus.Active &&
                    (x.deletedForUserIds == undefined || !x.deletedForUserIds.includes(res.locals.user._id)));
            sortByCreatedAtDesc(redisMessages);
            let redisFileMessageUpdates = redisMessagesWithFR.filter(x => x.t == RedisPMOperationType.UpdateSendFileMessage).map(x => x.e);
            payload.take -= redisMessages.length
            let newMessages: MessageDocument[] = [];
            if (payload.take > 0) {
                let newMessagesQuery = MessageEntity.find({
                    chatId: payload.chatId,
                    deletedForUserIds: {
                        $ne: res.locals.user._id
                    }
                });

                if (redisMessages.length > 0)
                    newMessagesQuery = newMessagesQuery.where({ _id: { $lt: redisMessages[0]._id } });

                newMessages = await newMessagesQuery.sort({ _id: -1 }).limit(payload.take).lean(true);
            }

            messages = messages.concat(redisMessages).concat(newMessages);

            const messagesNotFound: any[] = [];

            for (let i = messages.length - 1; i >= 0; i--) {
                const message = messages[i];
                if (!message.forwarded) {
                    const a = new Date(otherUserLastForwardedAt);
                    const forwarded = new Date(otherUserLastForwardedAt) > new Date(message.createdAt);
                    message.forwarded = forwarded ? true : false;
                    if (message.forwarded)
                        message.forwardedAt = otherUserLastForwardedAt;
                    // else if (typeof message._id == "string") //if it comes from redis
                    //     messagesNotFound.push({ index: i, messageId: message._id, type: RedisMessagesNotFoundType.Forward });
                }
                if (!message.readed) {
                    const readed = new Date(otherUserLastReadedAt) > new Date(message.createdAt);
                    message.readed = readed ? true : false;
                    if (message.readed)
                        message.readedAt = otherUserLastReadedAt;
                    // else if (typeof message._id == "string") //if it comes from redis
                    //     messagesNotFound.push({ index: i, messageId: message._id, type: RedisMessagesNotFoundType.Read });
                }

                if (message.files?.length > 0) {
                    redisFileMessageUpdates.filter(x => x.mi == message._id.toString())
                        .forEach(x => message.files.push(x.file));
                }
                if (message.replyToId) {
                    const repliedMessage = messages.find(x => x._id.toString() == message.replyToId);
                    if (repliedMessage) {
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.ownerId, undefined, repliedMessage.text, repliedMessage.files);
                    } else {
                        messagesNotFound.push({ index: i, messageId: message.replyToId, type: RedisMessagesNotFoundType.Reply });
                    }
                }
            }

            const messageIdsNotFound = messagesNotFound.map(x => x.messageId);
            if (messageIdsNotFound.length > 0) {
                const messagesNotFoundFromDB = await MessageEntity.find({ _id: { $in: messageIdsNotFound } }).lean(true);
                for (let i = 0; i < messagesNotFound.length; i++) {
                    const messageNotFound = messagesNotFound[i];
                    const message = messagesNotFoundFromDB.find(x => x._id.toString() == messageNotFound.messageId);
                    if (message) {
                        messages[messageNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.ownerId, undefined, message.text, message.files);
                    }
                }
            }

        } else {
            const messagesRepliesNotFound: any[] = [];
            messages = await MessageEntity.find({
                chatId: payload.chatId,
                deletedForUserIds: {
                    $ne: res.locals.user._id
                },
                _id: { $lt: payload.lastRecordId }
            }).sort({ _id: -1 }).limit(payload.take).lean(true);
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (!message.forwarded) {
                    const forwarded = new Date(otherUserLastForwardedAt) > message.createdAt;
                    message.forwarded = forwarded ? true : false;
                    if (message.forwarded)
                        message.forwardedAt = otherUserLastForwardedAt;
                }
                if (!message.readed) {
                    const readed = new Date(otherUserLastReadedAt) > message.createdAt;
                    message.readed = readed ? true : false;
                    if (message.readed)
                        message.readedAt = otherUserLastReadedAt;
                }
                if (message.replyToId) {
                    const repliedMessage = messages.find(x => x._id.toString() == message.replyToId);
                    if (repliedMessage) {
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.ownerId, undefined, repliedMessage.text, repliedMessage.files);
                    } else {
                        messagesRepliesNotFound.push({ index: i, messageId: message.replyToId });
                    }
                }
            }

            const messageReplyIdsNotFound = messagesRepliesNotFound.map(x => x.messageId);
            if (messageReplyIdsNotFound.length > 0) {
                const messagesNotFoundFromDB = await MessageEntity.find({ _id: { $in: messageReplyIdsNotFound } }).lean(true);
                for (let i = 0; i < messagesRepliesNotFound.length; i++) {
                    const messageReplyNotFound = messagesRepliesNotFound[i];
                    const message = messagesNotFoundFromDB.find(x => x._id.toString() == messageReplyNotFound.messageId);
                    if (message) {
                        messages[messageReplyNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.ownerId, undefined, message.text, message.files);
                    }
                }
            }
        }

        response.data = messages;
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/getSearchedPMs", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetSearchedChatMessagesDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {

        const payload = new GetSearchedChatMessagesDTO(req.body);

        if (!await ChatEntity.exists({
            _id: payload.chatId,
            recordStatus: RecordStatus.Active,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ]
        })) {
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        let query = MessageEntity.find({ chatId: payload.chatId, text: { $regex: payload.searchedText, $options: "i" } })

        if (payload.lastRecordId)
            query = query.where({ _id: { $gt: payload.lastRecordId } });

        response.data = query.sort({ _id: 1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/getSearchedPM", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetSearchedChatMessageDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const payload = new GetSearchedChatMessageDTO(req.body);

        if (!await ChatEntity.exists({
            _id: payload.chatId,
            recordStatus: RecordStatus.Active,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ]
        })) {
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        const beforeMessage10 = await MessageEntity.findOne({
            chatId: payload.chatId,
            _id: { $lt: payload.messageId }
        }).sort({ _id: -1 }).limit(10).lean(true);

        const afterMessage10 = await MessageEntity.findOne({
            chatId: payload.chatId,
            _id: { $gt: payload.messageId }
        }).sort({ _id: 1 }).limit(10).lean(true);

        response.data = { tenMessageBefore: beforeMessage10, tenMessageAfter: afterMessage10 };

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/getSearchedGMs", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetSearchedGroupChatMessagesDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {

        const payload = new GetSearchedGroupChatMessagesDTO(req.body);

        if (!await GroupChatUserEntity.exists({
            groupChatId: payload.groupChatId,
            userId: res.locals.user._id,
            recordStatus: RecordStatus.Active
        })) {
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        let query = GroupMessageEntity.find({ groupChatId: payload.groupChatId, text: { $regex: payload.searchedText, $options: "i" } })

        if (payload.lastRecordId)
            query = query.where({ _id: { $gt: payload.lastRecordId } });

        response.data = query.sort({ _id: 1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/getSearchedGM", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetSearchedGroupChatMessageDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const payload = new GetSearchedGroupChatMessageDTO(req.body);

        if (!await GroupChatUserEntity.exists({
            groupChatId: payload.groupChatId,
            userId: res.locals.user._id,
            recordStatus: RecordStatus.Active
        })) {
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        const beforeMessage10 = await GroupMessageEntity.findOne({
            groupChatId: payload.groupChatId,
            _id: { $lt: payload.messageId }
        }).sort({ _id: -1 }).limit(10).lean(true);

        const afterMessage10 = await GroupMessageEntity.findOne({
            groupChatId: payload.groupChatId,
            _id: { $gt: payload.messageId }
        }).sort({ _id: 1 }).limit(10).lean(true);

        response.data = { tenMessageBefore: beforeMessage10, tenMessageAfter: afterMessage10 };

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true
router.post("/sendPMFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("files", [".png", ".jpg", ".jpeg", ".svg", ".gif", ".pdf", ".doc", ".docx", ".txt", ".webm", ".mp4", ".mp3", ".avi", ".rar", ".zip"], "chat/message_files/", 50000000), validateSendFileMessage, async (req: CustomRequest<RedisSendFileMessageDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Send file message.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                            t: {
                                type: "string",
                                description: "Message",
                                example: "Hello"
                            },
                            to: {
                                type: "string",
                                description: "Recipient ID",
                            },
                            files: {
                                type: "string",
                                format: "binary",
                                description: "Single file.",
                            },
                            ci: {
                                type: "string",
                                description: "Chat ID",
                            },
                            replyToId: {
                                type: "string",
                                description: "Reply to message ID",
                            }
                         },
                         required: ["files", "to"]
                     }
                 }
             } 
 } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/NullResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (!req.file || req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisSendFileMessageDTO(req.body);

        //TODO: offline durumu
        response.data = { ci: null, mi: null };

        if (!payload.ci) {
            if (await RedisService.isDailyNewPMLimitExceeded(res.locals.user._id))
                throw new NotValidError(getMessage("dailyNewPMLimitExceeded", req.selectedLangs()));
            const chatEntity = await ChatEntity.findOneAndUpdate(
                { ownerId: res.locals.user._id, participantId: payload.to },
                { $setOnInsert: { ownerId: res.locals.user._id, participantId: payload.to } },
                { upsert: true, new: true });
            payload.ci = chatEntity._id.toString(); //may be null, catch it later
            response.data["ci"] = payload.ci;
            await RedisService.incrementDailyNewPMCount(res.locals.user._id);
        }

        const files = [new MessageFiles(req.file.location, req.file.mimetype, req.file.size)];
        const messageEntity = await MessageService.sendPrivateMessage({
            toUserId: payload.to,
            ownerId: res.locals.user._id,
            text: payload.t,
            chatId: payload.ci,
            files: files,
            replyToId: payload.replyToId,
            fromUser: await RedisService.acquireUser(res.locals.user._id, ["_id", "username", "firstName", "lastName", "profilePhotoUrl", "avatarKey"])
        });

        response.data["mi"] = messageEntity._id;
        response.data["files"] = files[0];

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true
router.post("/updatePMFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("files", [".png", ".jpg", ".jpeg", ".svg", ".gif", ".pdf", ".doc", ".docx", ".txt", ".webm", ".mp4", ".mp3", ".avi", ".rar", ".zip"], "chat/message_files/", 5242880), validateUpdateFileMessage, async (req: CustomRequest<RedisUpdateFileMessageDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Send file message.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                            mi: {
                                type: "string",
                                description: "Message ID",
                                example: "62ab8a204166fd1eaebbb3fa"
                            },
                            ci: {
                                type: "string",
                                description: "Chat ID",
                                example: "62ab8a204166fd1eaebbb3fa"
                            },
                            to: {
                                type: "string",
                                description: "Recipient ID",
                                example: "62ab8a204166fd1eaebbb3fa"
                            },
                            files: {
                                type: "string",
                                format: "binary"
                            }
                         },
                         required: ["files", "mi"]
                     }
                 }
             } 
 } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/ChatUpdatePMFileResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (!req.file || req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisUpdateFileMessageDTO(req.body);

        const files = [new MessageFiles(req.file?.location, req.file.mimetype, req.file.size)];

        let message = await RedisService.client.hGet(RedisKeyType.DBPrivateMessage + payload.ci, payload.mi + RedisPMOperationType.InsertMessage)
            .then(x => x ? JSON.parse(x)?.e : null);
        if (!message) {
            message = await MessageEntity.findOne({ _id: payload.mi });
            if (!message)
                throw new NotValidError(getMessage("messageNotFound", req.selectedLangs()));
            if (message.ownerId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
            message.files.push(new MessageFiles(req.file?.location, req.file.mimetype, req.file.size));
            message.markModified("files");
            await message?.save();
        } else {
            if (message.ownerId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
            const chatData: object = {
                e: {
                    mi: payload.mi,
                    file: files[0],
                }, t: RedisPMOperationType.UpdateSendFileMessage
            }

            await RedisService.client.hSet(RedisKeyType.DBPrivateMessage + payload.ci, payload.mi + RedisPMOperationType.UpdateSendFileMessage, stringify(chatData));
        }

        //TODO: offline durumu
        response.data = { ci: null, mi: null };
        response.data["ci"] = payload.ci;
        response.data["mi"] = payload.mi;
        response.data["files"] = files[0];

        const emitData: any = { mi: payload.mi, ci: payload.ci, files: files, f: null };

        io.to(payload.to).emit("cPmSend", emitData);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true
router.post("/getGMs", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetGroupMessages, async (req: CustomRequest<GetGroupChatMessagesDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
        #swagger.description = 'Get group chat messages.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/ChatGetGroupMessagesRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/ChatGetGroupMessagesResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        const payload = new GetGroupChatMessagesDTO(req.body);
        if (!await RedisService.isUserInGroupChat(res.locals.user._id, payload.groupChatId))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let messages: GroupMessageDocument[] = [];
        const replyToUserIds: string[] = [];
        let isFirstPage = !payload.lastRecordId;
        // const redisMaxMessagesWithFRCount = -60;

        const redisMessagesWithFileUpdates = await RedisService.client
            .hVals(RedisKeyType.DBGroupMessage + payload.groupChatId).then(x => x.map(y => JSON.parse(y)));

        if (isFirstPage) {
            let redisMessages = redisMessagesWithFileUpdates.filter(x => x.t == RedisGMOperationType.InsertMessage).map(x => x.e)
                .filter(x => x.recordStatus == undefined || x.recordStatus == RecordStatus.Active &&
                    (x.deletedForUserIds == undefined || !x.deletedForUserIds.includes(res.locals.user._id)));
            let redisFileMessageUpdates = redisMessagesWithFileUpdates.filter(x => x.t == RedisGMOperationType.UpdateSendFileMessage).map(x => x.e);
            payload.take -= redisMessages.length
            let newMessages: GroupMessageDocument[] = [];
            if (payload.take > 0) {
                let newMessagesQuery = GroupMessageEntity.find({
                    groupChatId: payload.groupChatId,
                    deletedForUserIds: {
                        $ne: res.locals.user._id
                    }
                });

                if (redisMessages.length > 0)
                    newMessagesQuery = newMessagesQuery.where({ _id: { $lt: redisMessages[0]._id } });

                newMessages = await newMessagesQuery.sort({ _id: -1 }).limit(payload.take).lean(true);
            }

            messages = messages.concat(redisMessages).concat(newMessages);

            const messagesNotFound: any[] = [];

            for (let i = messages.length - 1; i >= 0; i--) {
                const message = messages[i];
                if (message.files?.length > 0) {
                    redisFileMessageUpdates.filter(x => x.mi == message._id.toString())
                        .forEach(x => message.files.push(x.file));
                }
                if (message.replyToId) {
                    const repliedMessage = messages.find(x => x._id.toString() == message.replyToId);
                    if (repliedMessage) {
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.ownerId, undefined, repliedMessage.text, repliedMessage.files);
                        replyToUserIds.push(repliedMessage.ownerId);
                    } else {
                        messagesNotFound.push({ index: i, messageId: message.replyToId, type: RedisMessagesNotFoundType.Reply });
                    }
                }
            }

            const messageIdsNotFound = messagesNotFound.map(x => x.messageId);
            if (messageIdsNotFound.length > 0) {
                const messagesNotFoundFromDB = await GroupMessageEntity.find({ _id: { $in: messageIdsNotFound } }).lean(true);
                for (let i = 0; i < messagesNotFound.length; i++) {
                    const messageNotFound = messagesNotFound[i];
                    const message = messagesNotFoundFromDB.find(x => x._id.toString() == messageNotFound.messageId);
                    if (message) {
                        messages[messageNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.ownerId, undefined, message.text, message.files);
                        replyToUserIds.push(message.ownerId);
                    }
                }
            }
        } else {
            const messagesRepliesNotFound: any[] = [];
            messages = await GroupMessageEntity.find({
                groupChatId: payload.groupChatId,
                deletedForUserIds: {
                    $ne: res.locals.user._id
                },
                _id: { $lt: payload.lastRecordId }
            }).sort({ _id: -1 }).limit(payload.take).lean(true);
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (message.replyToId) {
                    const repliedMessage = messages.find(x => x._id.toString() == message.replyToId);
                    if (repliedMessage) {
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.ownerId, undefined, repliedMessage.text, repliedMessage.files);
                        replyToUserIds.push(repliedMessage.ownerId);
                    } else {
                        messagesRepliesNotFound.push({ index: i, messageId: message.replyToId });
                    }
                }
            }

            const messageReplyIdsNotFound = messagesRepliesNotFound.map(x => x.messageId);
            if (messageReplyIdsNotFound.length > 0) {
                const messagesNotFoundFromDB = await GroupMessageEntity.find({ _id: { $in: messageReplyIdsNotFound } }).lean(true);
                for (let i = 0; i < messagesRepliesNotFound.length; i++) {
                    const messageReplyNotFound = messagesRepliesNotFound[i];
                    const message = messagesNotFoundFromDB.find(x => x._id.toString() == messageReplyNotFound.messageId);
                    if (message) {
                        messages[messageReplyNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.ownerId, undefined, message.text, message.files);
                        replyToUserIds.push(message.ownerId);
                    }
                }
            }
        }

        const replyToUsers = await UserEntity.find({ _id: { $in: replyToUserIds } }, { username: 1 }).lean(true);
        for (let i = 0; i < messages.length; i++) {
            let message = messages[i];
            if (message.replyTo) {
                message.replyTo.owner = replyToUsers.find(x => x._id.toString() == message.replyTo?.ownerId);
            }
        }

        const memberCounts: any = await RedisService.acquireGroupsMemberCounts([payload.groupChatId]);

        response.data = {
            messages: sortByCreatedAtDesc(messages),
            groupChat: {
                memberCount: memberCounts[0]
            }
        };
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true
router.post("/sendGMFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("files", [".png", ".jpg", ".jpeg", ".svg", ".gif", ".pdf", ".doc", ".docx", ".txt", ".webm", ".mp4", ".mp3", ".avi", ".rar", ".zip"], "chat/group_message_files/", 50000000), validateSendFileGM, async (req: CustomRequest<RedisGroupSendFileMessageDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Send file message.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                            t: {
                                type: "string",
                                description: "Message",
                                example: "Hello"
                            },
                            gCi: {
                                type: "string",
                                description: "Recipient ID",
                            },
                            files: {
                                type: "string",
                                format: "binary"
                            },
                            replyToId: {
                                type: "string",
                                description: "Reply to message ID",
                            }
                         },
                         required: ["files", "gCi"]
                     }
                 }
             } 
 } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/NullResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (!req.file || req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisGroupSendFileMessageDTO(req.body);

        //TODO: offline durumu
        response.data = { gCi: null, mi: null };
        if (!await RedisService.isUserInGroupChat(res.locals.user._id, payload.gCi))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));


        const senderUser = await RedisService.acquireUser(res.locals.user._id, ["_id", "username", "firstName", "lastName", "profilePhotoUrl", "avatarKey"]);

        const files = [new MessageFiles(req.file?.location, req.file.mimetype, req.file.size)];
        const groupMessageEntity = await MessageService.sendGroupMessage({
            ownerId: res.locals.user._id,
            text: payload.m,
            groupChatId: payload.gCi,
            files: files,
            replyToId: payload.replyToId,
            fromUser: senderUser
        });
        response.data["gCi"] = payload.gCi;
        response.data["mi"] = groupMessageEntity._id;
        response.data["files"] = files[0];

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

//PASSED:true
router.post("/updateGMFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("files", [".png", ".jpg", ".jpeg", ".svg", ".gif", ".pdf", ".doc", ".docx", ".txt", ".webm", ".mp4", ".mp3", ".avi", ".rar", ".zip"], "chat/message_files/", 5242880), validateUpdateFileGM, async (req: CustomRequest<RedisGroupUpdateFileMessageDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Send file message.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                            mi: {
                                type: "string",
                                description: "Message ID",
                            },
                            gCi: {
                                type: "string",
                                description: "Group Chat ID",
                            },
                            files: {
                                type: "string",
                                format: "binary"
                            }
                         },
                         required: ["files"]
                     }
                 }
             } 
 } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/ChatUpdateGMFileResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisGroupUpdateFileMessageDTO(req.body);


        const files = [new MessageFiles(req.file?.location, req.file.mimetype, req.file.size)];

        let message = await RedisService.client.hGet(RedisKeyType.DBGroupMessage + payload.gCi, payload.mi + RedisGMOperationType.InsertMessage)
            .then(x => x ? JSON.parse(x)?.e : null);
        if (!message) {
            message = await GroupMessageEntity.findOne({ _id: payload.mi });
            if (!message)
                throw new NotValidError(getMessage("messageNotFound", req.selectedLangs()));
            if (message.ownerId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

            message.files.push(new MessageFiles(req.file?.location, req.file.mimetype, req.file.size));
            message.markModified("files");
            await message?.save();
        } else {
            if (message.ownerId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
            const chatData: object = {
                e: {
                    mi: payload.mi,
                    file: files[0],
                }, t: RedisGMOperationType.UpdateSendFileMessage
            }

            await RedisService.client.hSet(RedisKeyType.DBGroupMessage + payload.gCi, payload.mi + RedisGMOperationType.UpdateSendFileMessage, stringify(chatData));
        }

        //TODO: offline durumu
        response.data = { gCi: null, mi: null };
        response.data["mi"] = payload.mi;
        response.data["gCi"] = payload.gCi;
        response.data["files"] = files[0];

        const emitData: any = { mi: payload.mi, gCi: payload.gCi, files: files, f: null };

        emitData["f"] = await RedisService.acquireUser(res.locals.user._id, ["_id", "username", "firstName", "lastName", "profilePhotoUrl", "avatarKey"]);

        io.in(groupChatName(payload.gCi)).emit("cGmSend", emitData);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/addToGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateAddToGroup, async (req: CustomRequest<AddToGroupChatDTO>, res: any) => {

    var response = new BaseResponse<object>();
    try {
        response.message = await GroupAccess.addUsersToGroupChat(req.selectedLangs(), res.locals.user._id, new AddToGroupChatDTO(req.body));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/makeUsersGroupAdmin", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<MakeUsersGroupAdminDTO>, res: any) => {

    var response = new BaseResponse<object>();
    try {
        var payload = new MakeUsersGroupAdminDTO(req.body);
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId },
            {
                hashTags: 0, hashTags_fuzzy: 0,
                titlesch: 0, titlesch_fuzzy: 0
            }).lean(true);

        if (!groupChat || groupChat.ownerId != res.locals.user._id)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        const groupOwner = await RedisService.acquireUser(res.locals.user._id, ["username"]);

        const findGuardInPayloadUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInPayloadUsers != -1)
            payload.userIds.splice(findGuardInPayloadUsers, 1);

        const bulkMakeAdminOp = payload.userIds.map(userId => {
            return {
                updateOne: {
                    filter: {
                        groupChatId: payload.groupChatId,
                        userId: userId,
                    },
                    update: {
                        groupRole: GroupChatUserRole.Admin
                    }
                }
            }
        })
        await GroupChatUserEntity.bulkWrite(bulkMakeAdminOp);
        const usersIdsNotFound = [];
        const socketUserDatas = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = OnlineUserService.onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user._id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                    avKey: socketUser.avatarKey, //avatar key
                });
            } else {
                usersIdsNotFound.push(userId);
            }
        }

        // await OneSignalService.sendNotificationWithUserIds({
        //     userIds: usersIdsNotFound,
        //     heading: `${groupChat.title} grubunda admin oldun, helal sana.`,
        //     content: `${user.username} seni ${groupChat.title} grubunda admin yaptı.`,
        // })

        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user._id.toString(), //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
                avKey: user.avatarKey, //avatar key
            });

        }

        const groupGuard = await RedisService.acquireGroupGuard();

        for (let i = 0; i < socketUserDatas.length; i++) {
            const userData = socketUserDatas[i];
            await MessageService.sendGroupMessage({
                ownerId: "62ab8a204166fd1eaebbb3fa",
                text: `${groupOwner.username}, ${userData.uN} kullanıcısını admin yaptı.`,
                groupChatId: payload.groupChatId,
                fromUser: groupGuard,
            })
        }

        if (findGuardInPayloadUsers != -1)
            response.setMessage(getMessage("groupAdminsAddedGuardSuccess", req.selectedLangs()));
        else
            response.setMessage(getMessage("groupAdminsAddedSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/removeFromGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateRemoveFromGroup, async (req: CustomRequest<RemoveFromGroupChatDTO>, res: any) => {
    var response = new BaseResponse<object>();
    try {
        var payload = new RemoveFromGroupChatDTO(req.body);
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId },
            {
                hashTags: 0
            });

        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));

        const groupChatUser = await GroupChatUserEntity.findOne({ groupChatId: payload.groupChatId, userId: res.locals.user._id });

        if (!groupChatUser)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        const user = await RedisService.acquireUser(res.locals.user._id, ["username"]);

        if (groupChatUser.groupRole != GroupChatUserRole.Admin && groupChatUser.groupRole != GroupChatUserRole.Owner)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        const findGuardInDeletedUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInDeletedUsers != -1)
            payload.userIds.splice(findGuardInDeletedUsers, 1);

        const findOwnerInDeletedUsers = payload.userIds.findIndex(userId => userId == groupChat.ownerId);
        let randomOldMember: User = new UserEntity();
        if (findOwnerInDeletedUsers != -1) {
            if (groupChat.ownerId != res.locals.user._id)
                throw new NotValidError(getMessage("cannotRemoveOwner", req.selectedLangs()));

            const oldestMembers = await GroupChatUserEntity.find({ groupChatId: payload.groupChatId }, { userId: 1, createdAt: 1 }).sort({ _id: 1 }).limit(5);
            if (oldestMembers.length > 0) {
                const oldMemberId = oldestMembers[Math.floor(Math.random() * oldestMembers.length)].userId;
                randomOldMember = await RedisService.acquireUser(oldMemberId, ["username"]);
                groupChat.ownerId = oldMemberId;
                await groupChat.save();
                await OneSignalService.sendNotificationWithUserIds({
                    heading: `${groupChat.title} grubunda yeni kurucu oldun.`,
                    content: `${user.username} kendini uçurduğu için seni ${groupChat.title} grubunda yeni kurucu yaptım. Sen de bırakıp gitme bizi...`,
                    userIds: [oldMemberId]
                })
                await OneSignalService.sendNotificationWithUserIds({
                    heading: `Hey!👋`,
                    content: `Kendi grubundan ayrıldın, iyi misin?. Herhangi bir problemin varsa ya da sadece kötü hissettiysen bizimle iletişime geçebilirsin, her zaman buradayız.`,
                    userIds: [res.locals.user._id],
                })
            } else {
                throw new NotValidError(getMessage("groupHasNoMemberCannotDelete", req.selectedLangs()));
            }
        }

        await GroupChatUserEntity.updateMany({ groupChatId: groupChat._id.toString(), userId: { $in: payload.userIds } }, { recordStatus: RecordStatus.Deleted });
        await UserEntity.updateMany({ _id: { $in: payload.userIds } }, { $inc: { "statistics.groupCount": -1 } });
        await RedisService.decrementGroupMemberCount(payload.groupChatId, payload.userIds.length);
        await RedisService.delGroupChatIdsFromUsers(payload.userIds, [payload.groupChatId]);

        const socketUserDatas = [];
        const usersIdsNotFound = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = OnlineUserService.onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                socketUser?.leave(groupChatName(groupChat._id.toString()));
                io.to(socketId).emit("cGroupUserLeft",
                    {
                        gCi: groupChat._id.toString(),
                    });
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user._id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                    avKey: socketUser.avatarKey, //avatar key
                });
            } else {
                usersIdsNotFound.push(userId);
            }
        }


        // await OneSignalService.sendNotificationWithUserIds({
        //     userIds: usersIdsNotFound,
        //     heading: `${groupChat.title} grubundan uçuruldun.`,
        //     content: `${user.username} seni ${groupChat.title} grubundan uçurdu.`,
        // })

        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user._id.toString(), //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
                avKey: user.avatarKey, //avatar key
            });

        }

        const groupGuard = await RedisService.acquireGroupGuard();

        for (let i = 0; i < socketUserDatas.length; i++) {
            const userData = socketUserDatas[i];
            await MessageService.sendGroupMessage({
                ownerId: "62ab8a204166fd1eaebbb3fa",
                text: `${userData.uN} ${getMessage("removedFromGroup", req.selectedLangs())}`,
                groupChatId: payload.groupChatId,
                fromUser: groupGuard,
            });
        }

        if (findOwnerInDeletedUsers != -1) {
            await MessageService.sendGroupMessage({
                ownerId: "62ab8a204166fd1eaebbb3fa",
                text: `Bak sen şu işe...`,
                groupChatId: payload.groupChatId,
                fromUser: groupGuard,
            });
            await MessageService.sendGroupMessage({
                ownerId: "62ab8a204166fd1eaebbb3fa",
                text: `Grup kurucusu kendini uçurdu😱, sakin olup düşünmem gerekli🤔. Buldum💡`,
                groupChatId: payload.groupChatId,
                fromUser: groupGuard,
            });
            await MessageService.sendGroupMessage({
                ownerId: "62ab8a204166fd1eaebbb3fa",
                text: `Yeni yöneticimizi kutlayalım ${randomOldMember.username}.`,
                groupChatId: payload.groupChatId,
                fromUser: groupGuard,
            })
            await MessageService.sendGroupMessage({
                ownerId: "62ab8a204166fd1eaebbb3fa",
                text: `Çoook eskilerden bir dostumuzu yönetici yaptım. Tam gaz devam👻`,
                groupChatId: payload.groupChatId,
                fromUser: groupGuard,
            });
        }

        if (findGuardInDeletedUsers != -1)
            response.setMessage(getMessage("groupUsersRemovedGuardSuccess", req.selectedLangs()));
        else
            response.setMessage(getMessage("groupUsersRemovedSuccess", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/leaveGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateLeaveGroup, async (req: CustomRequest<LeaveGroupDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new LeaveGroupDTO(req.body);
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId });
        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));

        const leaveGroup = await GroupChatUserEntity.findOneAndUpdate({
            groupChatId: payload.groupChatId,
            userId: res.locals.user._id,
        }, {
            recordStatus: RecordStatus.Deleted,
        });

        if (!leaveGroup)
            throw new NotValidError(getMessage("groupChatUserNotFound", req.selectedLangs()));

        await UserEntity.findOneAndUpdate({ _id: { $in: res.locals.user._id } }, { $inc: { "statistics.groupCount": -1 } });

        await RedisService.decrementGroupMemberCount(payload.groupChatId);

        await RedisService.delGroupChatIdsFromUsers([res.locals.user._id], [payload.groupChatId]);

        const groupGuard = await RedisService.acquireGroupGuard();

        const leavedUser = await UserEntity.findOne({ _id: res.locals.user._id }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1 }).lean(true);

        await MessageService.sendGroupMessage({
            ownerId: "62ab8a204166fd1eaebbb3fa",
            text: `${leavedUser?.firstName} ${getMessage("removedFromGroup", req.selectedLangs())}`,
            groupChatId: payload.groupChatId,
            fromUser: groupGuard,
        })

        const socketId = OnlineUserService.onlineUsers.get(res.locals.user._id);
        if (socketId) {
            const socketUser = io.sockets.sockets.get(socketId);
            socketUser?.leave(groupChatName(payload.groupChatId));
        }

        const groupOwnedLeaved = groupChat.ownerId == res.locals.user._id
        let randomOldMember: User = new UserEntity();
        if (groupOwnedLeaved) {
            const oldestMembers = await GroupChatUserEntity.find({ groupChatId: payload.groupChatId }, { userId: 1, createdAt: 1 }).sort({ _id: 1 }).limit(5);
            if (oldestMembers.length > 0) {
                const user = await RedisService.acquireUser(res.locals.user._id, ["username"]);
                const oldMemberId = oldestMembers[Math.floor(Math.random() * oldestMembers.length)].userId;
                randomOldMember = await RedisService.acquireUser(oldMemberId, ["username"]);
                groupChat.ownerId = oldMemberId;
                await groupChat.save();
                await OneSignalService.sendNotificationWithUserIds({
                    heading: `${groupChat.title} grubunda yeni kurucu oldun.`,
                    content: `${user.username} ayrıldığı için seni ${groupChat.title} grubunda yeni kurucu yaptım. Sen de bırakıp gitme bizi...`,
                    userIds: [oldMemberId],
                })
                await OneSignalService.sendNotificationWithUserIds({
                    heading: `Hey!👋`,
                    content: `Kendi grubundan ayrıldın, iyi misin?. Herhangi bir problemin varsa ya da sadece kötü hissettiysen bizimle iletişime geçebilirsin, her zaman buradayız.`,
                    userIds: [user._id]
                })
                await MessageService.sendGroupMessage({
                    ownerId: "62ab8a204166fd1eaebbb3fa",
                    text: `Bak sen şu işe...`,
                    groupChatId: payload.groupChatId,
                    fromUser: groupGuard,
                });
                await MessageService.sendGroupMessage({
                    ownerId: "62ab8a204166fd1eaebbb3fa",
                    text: `Grup kurucusu ayrıldı😱, sakin olup düşünmem gerekli🤔. Buldum💡`,
                    groupChatId: payload.groupChatId,
                    fromUser: groupGuard,
                });
                await MessageService.sendGroupMessage({
                    ownerId: "62ab8a204166fd1eaebbb3fa",
                    text: `Yeni yöneticimizi kutlayalım ${randomOldMember.username}.`,
                    groupChatId: payload.groupChatId,
                    fromUser: groupGuard,
                })
                await MessageService.sendGroupMessage({
                    ownerId: "62ab8a204166fd1eaebbb3fa",
                    text: `Çoook eskilerden bir dostumuzu yönetici yaptım. Tam gaz devam👻`,
                    groupChatId: payload.groupChatId,
                    fromUser: groupGuard,
                });
            } else {
                throw new NotValidError(getMessage("groupHasNoMemberCannotDelete", req.selectedLangs()));
            }
        }
        response.setMessage(getMessage("leaveGroupSuccess", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.get("/gc/getProfile/:groupChatId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<any>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const groupChatId = req.params.groupChatId;
        if (!isValidObjectId(groupChatId))
            throw new NotValidError(getMessage("invalidObjectId", req.selectedLangs()));

        const groupChat = await GroupChatEntity.findOne({ _id: groupChatId },
            {
                hashTags: 0, hashTags_fuzzy: 0,
                titlesch: 0, titlesch_fuzzy: 0
            }).lean(true);

        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));

        const groupChatUser = await GroupChatUserEntity.exists({ groupChatId: groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active }).lean(true);

        if (groupChat.type == GroupChatType.Private) {
            if (!groupChatUser)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        const last10User = await GroupChatUserEntity.find({ groupChatId: groupChatId }).sort({ _id: -1 }).limit(10).lean(true);
        const last10UserIds = last10User.map(x => x.userId);
        const users = await UserEntity.find({ _id: { $in: last10UserIds } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1, "lastSeenDate": 1 }).lean(true);

        const totalMemberCount = await GroupChatUserEntity.countDocuments({ groupChatId: groupChatId });

        response.data = {
            groupChat: groupChat,
            last10User: users,
            totalMemberCount: totalMemberCount
        }
        // if (groupChatUser) {
        // const test = await GroupMessageEntity.aggregate([
        //     { "$match": { "type": { "$in": [MessageType.Image, MessageType.Video, MessageType.File, MessageType.Link] } } },
        //     { "$group": { "_id": "$type", "data": { "$push": { files: "$files", text: "$text", type: "$type" } } } },
        //     {
        //         "$project": {
        //             "result": {
        //                 "$cond": {
        //                     "if": { "$eq": [MessageType.Image, "$_id"] },
        //                     "then": { "image": { "$slice": ["$data", 10] } }, //15 for easy
        //                     "else": {
        //                         "$cond": {
        //                             "if": { "$eq": [MessageType.Video, "$_id"] },
        //                             "then": { "video": { "$slice": ["$data", 10] } },// 15 for medium
        //                             "else": {
        //                                 "$cond": {
        //                                     "if": { "$eq": [MessageType.File, "$_id"] },
        //                                     "then": { "file": { "$slice": ["$data", 10] } },// 15 for medium
        //                                     "else": { "link": { "$slice": ["$data", 10] } } // 20 for hard
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // ])
        const groupData = await GroupMessageEntity.find({
            groupChatId: groupChatId,
            $or: [
                { type: MessageType.Image },
                { type: MessageType.Video }
            ],
            deletedForUserIds: { $ne: res.locals.user._id },
        }, { files: 1, text: 1, type: 1 }).sort({ _id: -1 }).limit(20).lean(true);
        response.data["media"] = groupData;
        // }

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/gc/getMoreMedia", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetGroupChatData, async (req: CustomRequest<GetGroupChatDataDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new GetGroupChatDataDTO(req.body);

        const groupChatUser = await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active })
        if (!groupChatUser)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let groupDataQuery = GroupMessageEntity.find({
            groupChatId: payload.groupChatId,
            $or: [
                { type: MessageType.Image },
                { type: MessageType.Video },
            ],
            deletedForUserIds: { $ne: res.locals.user._id },
        }, { files: 1, text: 1, type: 1 });

        if (payload.lastRecordId)
            groupDataQuery = groupDataQuery.where({ _id: { $lt: payload.lastRecordId } });

        response.data = await groupDataQuery.sort({ _id: -1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/gc/getMoreFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetGroupChatData, async (req: CustomRequest<GetGroupChatDataDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new GetGroupChatDataDTO(req.body);

        const groupChatUser = await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active })
        if (!groupChatUser)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let groupDataQuery = GroupMessageEntity.find({
            groupChatId: payload.groupChatId,
            type: MessageType.File,
            deletedForUserIds: { $ne: res.locals.user._id }
        }, { files: 1, text: 1, type: 1 })

        if (payload.lastRecordId)
            groupDataQuery = groupDataQuery.where({ _id: { $lt: payload.lastRecordId } });

        response.data = await groupDataQuery.sort({ _id: -1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/gc/getMoreLink", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetGroupChatData, async (req: CustomRequest<GetGroupChatDataDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new GetGroupChatDataDTO(req.body);

        const groupChatUser = await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active })
        if (!groupChatUser)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let groupDataQuery = GroupMessageEntity.find({
            groupChatId: payload.groupChatId,
            type: MessageType.Link,
            deletedForUserIds: { $ne: res.locals.user._id },
        }, { files: 1, text: 1, type: 1 });

        if (payload.lastRecordId)
            groupDataQuery = groupDataQuery.where({ _id: { $lt: payload.lastRecordId } });

        response.data = await groupDataQuery.sort({ _id: -1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.get("/pc/getProfile/:privateChatId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<any>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const privateChatId = req.params.privateChatId;
        if (!isValidObjectId(privateChatId))
            throw new NotValidError(getMessage("invalidObjectId", req.selectedLangs()));


        if (!await ChatEntity.exists({
            _id: privateChatId,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ],
            RecordStatus: RecordStatus.Active
        }))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        const groupData = await MessageEntity.find({
            chatId: privateChatId,
            $or: [
                { type: MessageType.Image },
                { type: MessageType.Video }
            ],
            deletedForUserIds: { $ne: res.locals.user._id },
        }, { files: 1, text: 1, type: 1 }).sort({ _id: -1 }).limit(20).lean(true);
        response.data["media"] = groupData;
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/pc/getMoreMedia", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetPrivateChatData, async (req: CustomRequest<GetPrivateChatDataDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new GetPrivateChatDataDTO(req.body);

        if (!await ChatEntity.exists({
            _id: payload.chatId,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ],
            RecordStatus: RecordStatus.Active
        }))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let chatDataQuery = MessageEntity.find({
            chatId: payload.chatId,
            $or: [
                { type: MessageType.Image },
                { type: MessageType.Video },
            ],
            deletedForUserIds: { $ne: res.locals.user._id },
        }, { files: 1, text: 1, type: 1 });

        if (payload.lastRecordId)
            chatDataQuery = chatDataQuery.where({ _id: { $lt: payload.lastRecordId } });

        response.data = await chatDataQuery.sort({ _id: -1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/pc/getMoreFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetPrivateChatData, async (req: CustomRequest<GetPrivateChatDataDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new GetPrivateChatDataDTO(req.body);

        if (!await ChatEntity.exists({
            _id: payload.chatId,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ],
            RecordStatus: RecordStatus.Active
        }))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let chatDataQuery = MessageEntity.find({
            chatId: payload.chatId,
            type: MessageType.File,
            deletedForUserIds: { $ne: res.locals.user._id }
        }, { files: 1, text: 1, type: 1 })

        if (payload.lastRecordId)
            chatDataQuery = chatDataQuery.where({ _id: { $lt: payload.lastRecordId } });

        response.data = await chatDataQuery.sort({ _id: -1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/pc/getMoreLink", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetPrivateChatData, async (req: CustomRequest<GetPrivateChatDataDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new GetPrivateChatDataDTO(req.body);

        if (!await ChatEntity.exists({
            _id: payload.chatId,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ],
            RecordStatus: RecordStatus.Active
        }))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let chatDataQuery = MessageEntity.find({
            chatId: payload.chatId,
            type: MessageType.Link,
            deletedForUserIds: { $ne: res.locals.user._id },
        }, { files: 1, text: 1, type: 1 });

        if (payload.lastRecordId)
            chatDataQuery = chatDataQuery.where({ _id: { $lt: payload.lastRecordId } });

        response.data = await chatDataQuery.sort({ _id: -1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/pc/getAllCommonGroupChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateGetPrivateChatData, async (req: CustomRequest<GetPrivateChatDataDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new GetPrivateChatDataDTO(req.body);

        const chat = await ChatEntity.findOne({
            _id: payload.chatId,
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ]
        }).lean(true);
        if (!chat)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let chatDataQuery: any = [
            { "$match": { $or: [{ userId: chat.ownerId }, { userId: chat.participantId }] } },
            { "$group": { _id: "$groupChatId", count: { $sum: 1 } } },
        ];

        const chatData = await GroupChatUserEntity.aggregate(chatDataQuery);
        const commonGroupData = chatData.filter((x: { count: number; }) => x.count > 1);
        const commonGroupIds = commonGroupData.map((x: { _id: string; }) => x._id);
        let commonGroupChats: any = [];
        if (commonGroupIds.length > 0) {
            commonGroupChats = await GroupChatEntity.find({ _id: { $in: commonGroupIds } }, { title: 1, coverImageUrl: 1 }).lean(true);
            const memberCounts = await RedisService.acquireGroupsMemberCounts(commonGroupIds);
            for (let i = 0; i < commonGroupIds.length; i++) {
                const commonGroupChat = commonGroupChats.find((x: { _id: any; }) => x._id.toString() == commonGroupIds[i]);
                if (commonGroupChat)
                    commonGroupChat.memberCount = memberCounts[i]
            }
        }
        response.data = commonGroupChats;
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/getGroupUsers", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetGroupUsersDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const payload = new GetGroupUsersDTO(req.body);

        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId }, { "type": 1 }).lean(true);

        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));

        if (groupChat.type == GroupChatType.Private)
            if (!await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active }).lean(true))
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let groupUsersEntityQuery = GroupChatUserEntity.find({ groupChatId: payload.groupChatId });

        if (payload.lastRecordId)
            groupUsersEntityQuery = groupUsersEntityQuery.where({ _id: { $lt: payload.lastRecordId } });

        const groupUsersEntity = await groupUsersEntityQuery.sort({ _id: -1 }).limit(payload.take).lean(true);

        const groupUsersIds = groupUsersEntity.map(x => x.userId);

        const groupUsers = await UserEntity.find({ _id: { $in: groupUsersIds } }, {
            "username": 1, "firstName": 1, "lastName": 1,
            "profilePhotoUrl": 1, "avatarKey": 1, "about": 1
        }).lean(true);

        response.data = groupUsers;
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/removePrivateChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateRemovePrivateChats, async (req: CustomRequest<RemovePrivateChatsDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const payload = new RemovePrivateChatsDTO(req.body);

        await RedisService.delPrivateChatIdsFromUsers([res.locals.user._id], payload.privateChatsIds);

        response.setMessage(getMessage("removePrivateChatsSuccess", req.selectedLangs()));
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

// router.get("/getGroupData/:groupChatId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<any>, res: any) => {
//     const response = new BaseResponse<any>();
//     try {
//         const groupChatId = req.params.groupChatId;
//         if (!isValidObjectId(groupChatId))
//             throw new NotValidError(getMessage("invalidObjectId", req.selectedLangs()));

//         const groupChat = await GroupChatEntity.findOne({ _id: groupChatId },
//             {
//                 hashTags: 0, hashTags_fuzzy: 0,
//                 titlesch: 0, titlesch_fuzzy: 0
//             }).lean(true);

//         if (!groupChat)
//             throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));

//         if (groupChat.type == GroupChatType.Private) {
//             const groupChatUser = await GroupChatUserEntity.exists({ groupChatId: groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active }).lean(true);
//             if (!groupChatUser)
//                 throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
//         }



//         response.data = {

//         }
//     } catch (err: any) {
//         response.setErrorMessage(err.message);

//         if (err.status != 200)
//             return InternalError(res, response, err);
//     }

//     return Ok(res, response);
// });

export {
    io,
    initializeSocket,
    router as default
}