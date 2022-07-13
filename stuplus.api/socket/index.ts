import ISocket from "./interfaces/socket";
import { ChatEntity, GroupMessageForwardEntity, GroupMessageEntity, GroupMessageReadEntity, MessageEntity, UserEntity, GroupChatEntity, GroupChatUserEntity, FollowEntity, NotificationEntity, HashtagEntity } from "../../stuplus-lib/entities/BaseEntity";
import "../../stuplus-lib/extensions/extensionMethods"
require("dotenv").config();
import { RedisSendFileMessageDTO, RedisGroupMessageDTO, RedisGroupMessageForwardReadDTO, RedisMessageDTO, RedisMessageForwardReadDTO, RedisUpdateFileMessageDTO, RedisGroupSendFileMessageDTO, RedisGroupUpdateFileMessageDTO } from "./dtos/RedisChat";
import { RedisPMOperationType, RedisKeyType, RedisGMOperationType, Role, WatchRoomTypes, GroupChatType } from "../../stuplus-lib/enums/enums_socket";
import { authorize, authorizeSocket } from "./utils/auth";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { AddToGroupChatDTO, BlockUserDTO, ClearPMChatHistoryDTO, CreateGroupDTO, DeleteSinglePMDTO, GetChatMessagesDTO, GetGroupChatMessagesDTO, GetGroupUsersDTO, GetSearchedChatMessageDTO, GetSearchedChatMessagesDTO, GetSearchedGroupChatMessageDTO, GetSearchedGroupChatMessagesDTO, LeaveGroupDTO, MakeUsersGroupAdminDTO, RemoveFromGroupChatDTO, UpdateGroupInfoDTO, WatchUsersDTO } from "./dtos/Chat";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { groupChatName, userWatchRoomName } from "../../stuplus-lib/utils/namespaceCreators";
import RedisService from "../../stuplus-lib/services/redisService";
import { searchable, stringify } from "../../stuplus-lib/utils/general";
import { MessageDocument, MessageFiles, ReplyToDTO } from "../../stuplus-lib/entities/MessageEntity";
import { DeleteChatForType, GroupChatUserRole, MessageLimitation, NotificationType, RecordStatus, RedisMessagesNotFoundType } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { Router } from "express";
import { uploadFileS3 } from "../../stuplus-lib/services/fileService";
import { validateBlockUser, validateClearPMChat, validateDeleteSinglePM, validateLeaveGroup, validateSendFileMessage, validateUpdateFileMessage } from "../middlewares/validation/chat/validateChatRoute";
import { GroupMessageDocument } from "../../stuplus-lib/entities/GroupMessageEntity";
import { GroupChatUserDocument } from "../../stuplus-lib/entities/GroupChatUserEntity";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { ChatDocument } from "../../stuplus-lib/entities/ChatEntity";
import { GroupChatDocument } from "../../stuplus-lib/entities/GroupChatEntity";
import { isValidObjectId } from "mongoose";
const router = Router();
let onlineUsers: Map<string, string>;
setup();
async function setup() {
    onlineUsers = new Map<string, string>();
};

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

io.on("connection", async (socket: ISocket) => {
    const decodedJwtUser: any = authorizeSocket(socket.handshake.auth.token);
    if (!decodedJwtUser) {
        socket.disconnect();
        return;
    }

    // await UserEntity.findOne({ _id: decodedJwtUser["_id"] }, {
    //     "_id": 0, "__t": 0, "blockedUserIds": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1
    // }, { lean: true });
    const user = await RedisService.acquireUser(decodedJwtUser["_id"], {
        "_id": 0, "__t": 0, "blockedUserIds": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "username": 1, "avatarKey": 1
    });
    if (!user) {
        socket.disconnect();
        return;
    }
    onlineUsers.set(decodedJwtUser["_id"], socket.id);
    user._id = decodedJwtUser["_id"];
    socket.data.user = user;

    // const groupChats = await GroupChatUserEntity.find({ userId: decodedJwtUser["_id"] }, {
    //     "_id": 0, "groupChatId": 1
    // }, { lean: true });
    const groupChatIds = await RedisService.acquire<string[]>(RedisKeyType.User + socket.data.user._id + ":groupChats", 60 * 60 * 8, async () => {
        const groupChats = await GroupChatUserEntity.find({ userId: socket.data.user._id });
        return groupChats.map(x => x.groupChatId);
    });
    for (let i = 0; i < groupChatIds.length; i++) {
        socket.join(groupChatName(groupChatIds[i]));
    }

    io.in(userWatchRoomName(user.id)).emit("cWatchUsers", {
        id: user.id,
        t: WatchRoomTypes.UserOnline
    });
    console.log("client connected. socket id: ", socket.id);

    socket.join(user.id);

    socket.on("disconnect", async (reason: any) => {
        console.log("disconnect: reason ", reason); // "ping timeout"
        onlineUsers.delete(socket.data.user._id);
        await UserEntity.findOneAndUpdate({ _id: socket.data.user._id }, {
            lastSeenDate: new Date()
        });
        io.in(userWatchRoomName(socket.data.user._id)).emit("cWatchUsers", {
            id: socket.data.user._id,
            t: WatchRoomTypes.UserOffline
        });
    });

    socket.on("pm-send", async (data: RedisMessageDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.m || !data.to) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }
            const toUser = await RedisService.acquireUser(data.to, [
                "_id", "blockedUserIds", "privacySettings", "username"
            ]);
            const toUserId = toUser._id.toString();
            // const toUserFollows = await RedisService.acquire<string[]>(RedisKeyType.User + data.to + ":follows", 60 * 60 * 8, async () => {
            //     //TODO:add hash set logic here
            // });

            if (!toUser)
                cb({ success: false, message: "User not found." });

            if (toUser.blockedUserIds?.includes(socket.data.user._id)) {
                cb({ success: false, message: getMessage("thisUserBlockedYou", ["tr"]) });
                return;
            }

            if (toUser.privacySettings.messageLimitation == MessageLimitation.OnlyWhoUserFollows &&
                !await FollowEntity.exists({ followerId: toUserId, followingId: socket.data.user._id, recordStatus: RecordStatus.Active }))
                cb({ success: false, message: getMessage("cantSendMessageFollow", ["tr"], [toUser.username]) });

            let responseData: any = { success: true };

            if (!data.ci) {
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
            }
            const now = new Date();
            const messageEntity = new MessageEntity({});
            const chatData: object = {
                e: {
                    _id: messageEntity.id,
                    fromId: socket.data.user._id,
                    text: data.m,
                    chatId: data.ci,
                    replyToId: data.rToId,
                    createdAt: now,
                    updatedAt: now,
                }, t: RedisPMOperationType.InsertMessage
            }

            responseData["mi"] = messageEntity.id;

            await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + data.ci, stringify(chatData));

            const emitData = { t: data.m, mi: messageEntity.id, ci: data.ci, f: null };

            if (!data.ci)
                emitData["f"] = socket.data.user;

            io.to(data.to).emit("cPmSend", emitData);

            cb(responseData);
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("pm-forwarded", async (data: RedisMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.mids || !data.mids.length || !data.ci || !data.to) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }
            const now = new Date();
            for (let i = 0; i < data.mids.length; i++) {
                const mi = data.mids[i];
                const chatData: object = {
                    e: {
                        _id: mi,
                        createdAt: now,
                        updatedAt: now,
                    }, t: RedisPMOperationType.UpdateForwarded
                };
                await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + data.ci, stringify(chatData));
            }

            io.to(data.to).emit("cPmForwarded", { mids: data.mids, ci: data.ci });

            cb({ success: true });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("pm-readed", async (data: RedisMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.mids || !data.mids.length || !data.ci || !data.to) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            const now = new Date();

            for (let i = 0; i < data.mids.length; i++) {
                const mi = data.mids[i];

                const chatData: object = {
                    e: {
                        _id: mi,
                        createdAt: now,
                        updatedAt: now,
                    }, t: RedisPMOperationType.UpdateReaded
                }

                await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + data.ci, stringify(chatData));
            }

            io.to(data.to).emit("cPmReaded", { mids: data.mids, ci: data.ci });

            cb({ success: true });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("gm-send", async (data: RedisGroupMessageDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.gCi || !data.m) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }
            const userGroupChatIds = await RedisService.acquire<string[]>(RedisKeyType.User + socket.data.user._id + ":groupChats", 60 * 60 * 8, async () => {
                const groupChats = await GroupChatUserEntity.find({ userId: socket.data.user._id });
                return groupChats.map(x => x.groupChatId);
            });
            if (!userGroupChatIds.includes(data.gCi)) {
                cb({ success: false, message: "Unauthorized." });
                return;
            }
            const now = new Date();
            const gMessageEntity = new GroupMessageEntity({});
            const chatData: object = {
                e: {
                    _id: gMessageEntity.id,
                    fromId: socket.data.user._id,
                    text: data.m,
                    groupChatId: data.gCi,
                    replyToId: data.rToId,
                    createdAt: now,
                    updatedAt: now,
                },
                t: RedisGMOperationType.InsertMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBGroupMessage + data.gCi, stringify(chatData));

            socket.to(groupChatName(data.gCi)).emit("cGmSend", { t: data.m, mi: gMessageEntity.id, gCi: data.gCi, f: socket.data.user });

            cb({ success: true, mi: gMessageEntity.id });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("gm-forwarded", async (data: RedisGroupMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.mids || !data.mids.length || !data.gCi) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            const now = new Date();
            for (let i = 0; i < data.mids.length; i++) {
                const mi = data.mids[i];
                const gMessageForwardEntity = new GroupMessageForwardEntity({});
                const chatData: object = {
                    e: {
                        _id: gMessageForwardEntity.id, messageId: mi, forwardedTo: socket.data.user._id,
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisGMOperationType.InsertForwarded
                }
                await RedisService.client.rPush(RedisKeyType.DBGroupMessage + data.gCi, stringify(chatData));
            }

            socket.to(groupChatName(data.gCi)).emit("cGmForwarded",
                {
                    mi: data.mids,
                    gCi: data.gCi,
                    to: {
                        id: socket.data.user._id,
                        uN: socket.data.user.username,
                        fN: socket.data.user.firstName,
                        lN: socket.data.user.lastName
                    }
                });

            cb({ success: true });

        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("gm-readed", async (data: RedisGroupMessageForwardReadDTO, cb: Function) => {
        try {
            //TODO: offline durumu
            if (!data.mids || !data.mids.length || !data.gCi) {
                cb({ success: false, message: "Invalid parameters." });
                return;
            }

            const now = new Date();
            for (let i = 0; i < data.mids.length; i++) {
                const mi = data.mids[i];
                const gMessageReadEntity = new GroupMessageReadEntity({});
                const chatData: object = {
                    e: {
                        _id: gMessageReadEntity.id,
                        messageId: mi,
                        readedBy: socket.data.user._id,
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisGMOperationType.InsertReaded
                }
                await RedisService.client.rPush(RedisKeyType.DBGroupMessage + data.gCi, stringify(chatData));
            }

            socket.to(groupChatName(data.gCi)).emit("cGmReaded",
                {
                    mi: data.mids,
                    gCi: data.gCi,
                    by: {
                        id: socket.data.user._id,
                        uN: socket.data.user.username,
                        fN: socket.data.user.firstName,
                        lN: socket.data.user.lastName
                    }
                });

            cb({ success: true });

        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });

    socket.on("watch-users", async (data: WatchUsersDTO, cb: Function) => {
        if (!data.uIds || !data.uIds.length) {
            cb({ success: false, message: "Invalid parameters." });
            return;
        }
        if (data.uIds.length > 100) {
            cb({ success: false, message: "You can only watch 100 users at once." });
            return;
        }

        try {
            const usersToJoin = data.uIds.map(uId => userWatchRoomName(uId));
            socket.join(usersToJoin);
            const onlineUsersFromUsersToJoin = [...onlineUsers.keys()].filter(onlineUId => data.uIds?.includes(onlineUId));
            cb({ success: true, onlineUserIds: onlineUsersFromUsersToJoin });
        } catch (error: any) {
            cb({ success: false, message: error?.message });
        }
    });
});

//TEST: PASSED
router.post("/unblockUser", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BlockUserDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new BlockUserDTO(req.body);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // const addedToUserBlockList = await UserEntity.findOneAndUpdate({ _id: res.locals.user._id }, { $push: { blockedUserIds: payload.userId } }, { new: true });
        // if (!addedToUserBlockList)
        //     throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));
        const user = await UserEntity.findOne({ _id: res.locals.user._id });
        if (!user)
            throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));

        user.blockedUserIds = user.blockedUserIds.filter(id => id !== payload.userId);
        user.markModified("blockedUserIds");
        await user.save();

        await RedisService.updateUser(user);

        response.setMessage(getMessage("userUnblockedSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

//TEST: PASSED
router.post("/getBlockedUsers", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    const response = new BaseResponse<any>();
    try {

        const payload = new BaseFilter(req.body);
        const blockedUserIds = await RedisService.acquireUser(res.locals.user._id, ["blockedUserIds"]);
        let blockedUsersQuery = UserEntity.find({ _id: { $in: blockedUserIds.blockedUserIds } }, {
            _id: 1, username: 1, firstName: 1, lastName: 1,
            profilePhotoUrl: 1, avatarKey: 1
        });

        if (payload.lastRecordDate)
            blockedUsersQuery = blockedUsersQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const blockedUsers = await blockedUsersQuery.sort({ createdAt: -1 }).limit(payload.take).lean();
        response.data = blockedUsers;

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

//TEST: PASSED
router.post("/blockuser", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateBlockUser, async (req: CustomRequest<BlockUserDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {

        const payload = new BlockUserDTO(req.body);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // const addedToUserBlockList = await UserEntity.findOneAndUpdate({ _id: res.locals.user._id }, { $push: { blockedUserIds: payload.userId } }, { new: true });
        // if (!addedToUserBlockList)
        //     throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));
        const user = await UserEntity.findOne({ _id: res.locals.user._id });
        if (!user)
            throw new NotValidError(getMessage("userNotFound", req.selectedLangs()));

        user.blockedUserIds.push(payload.userId);
        user.markModified("blockedUserIds");
        await user.save();

        await FollowEntity.updateMany({
            $or: [
                { followerId: res.locals.user._id, followingId: payload.userId },
                { followerId: payload.userId, followingId: res.locals.user._id }
            ]
        }, { recordStatus: RecordStatus.Deleted });

        await RedisService.updateUser(user);

        response.setMessage(getMessage("userBlockedSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/deleteSinglePM", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateDeleteSinglePM, async (req: CustomRequest<DeleteSinglePMDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new DeleteSinglePMDTO(req.body);
        let deleted;
        const now = new Date();
        const redisChatKey = RedisKeyType.DBPrivateMessage + payload.chatId;
        const redisMessageString = await RedisService.client.lRange(redisChatKey, 0, -1).then(x => x.find(y => {
            const data = JSON.parse(y);
            if (data.t == RedisPMOperationType.InsertMessage && data.e._id == payload.messageId && data.e.fromId == res.locals.user._id)
                return true;
        }));

        if (payload.deleteFor == DeleteChatForType.Both) {
            if (redisMessageString) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBPrivateMessage + payload.chatId, -1, redisMessageString) != 0 ? true : false;
                if (!deleted) {
                    deleted = await MessageEntity.findOneAndUpdate(
                        { _id: payload.messageId, fromId: res.locals.user._id },
                        {
                            recordStatus: RecordStatus.Deleted,
                            recordDeletionDate: now
                        });
                } else {
                    const newMessageEntity = new MessageEntity({}); //for duplications with clearing history, assing a new id
                    const newRedisMessage = JSON.parse(redisMessageString).e;
                    newRedisMessage._id = newMessageEntity.id;
                    newRedisMessage.recordStatus = RecordStatus.Deleted;
                    newRedisMessage.recordDeletionDate = now;
                    await RedisService.client.lPush(redisChatKey, stringify(newRedisMessage));

                }
            } else {
                deleted = await MessageEntity.findOneAndUpdate(
                    { _id: payload.messageId, fromId: res.locals.user._id },
                    {
                        recordStatus: RecordStatus.Deleted,
                        recordDeletionDate: now
                    }
                );
            }
            response.setMessage(getMessage("singleMessageDeletedMeSuccess", req.selectedLangs()));
        } else {
            if (redisMessageString) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBPrivateMessage + payload.chatId, -1, redisMessageString) != 0 ? true : false;
                if (!deleted) {
                    deleted = await MessageEntity.findOneAndUpdate(
                        { _id: payload.messageId, fromId: res.locals.user._id },
                        {
                            $push: {
                                deletedForUserIds: res.locals.user._id,
                            },
                            deletedForUserDate: now
                        }
                    );
                } else {
                    const newMessageEntity = new MessageEntity({}); //for duplications with clearing history, assing a new id
                    const newRedisMessage = JSON.parse(redisMessageString).e;
                    newRedisMessage._id = newMessageEntity.id;
                    if (!newRedisMessage.deletedForUserIds) newRedisMessage.deletedForUserIds = [];
                    newRedisMessage.deletedForUserIds.push(res.locals.user._id);
                    newRedisMessage.deletedForUserDate = now;
                    await RedisService.client.lPush(redisChatKey, stringify(newRedisMessage));

                }
            } else {
                deleted = await MessageEntity.findOneAndUpdate(
                    { _id: payload.messageId, fromId: res.locals.user._id },
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

        if (!deleted)
            throw new NotValidError(getMessage("unknownError", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/clearPMChatHistory", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateClearPMChat, async (req: CustomRequest<ClearPMChatHistoryDTO>, res: any) => {
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
        const redisMessagesString = await RedisService.client.lRange(redisChatKey, 0, -1);
        await RedisService.client.del(redisChatKey);

        const redisMessages = redisMessagesString.map(y => {
            const data = JSON.parse(y);
            if (data.t == RedisPMOperationType.InsertMessage)
                return data.e;
        })


        const now = new Date();
        if (payload.deleteFor == DeleteChatForType.Both) {
            for (let i = 0; i < redisMessages.length; i++) {
                const redisMessage = redisMessages[i];
                redisMessage.recordStatus = RecordStatus.Deleted;
                redisMessage.recordDeletionDate = now;
            }
            await RedisService.client.lPush(redisChatKey, redisMessages.map(x => stringify(x)).reverse());

            await MessageEntity.updateMany({
                chatId: payload.chatId,
            }, {
                recordStatus: RecordStatus.Deleted,
                recordDeletionDate: now
            });
            response.setMessage(getMessage("clearPMChatHistoryMeSuccess", res.selectedLangs()));

        }
        else {
            for (let i = 0; i < redisMessages.length; i++) {
                const redisMessage = redisMessages[i];
                if (!redisMessage.deletedForUserIds) redisMessage.deletedForUserIds = [];
                redisMessage.deletedForUserIds.push(res.locals.user._id);
                redisMessage.deletedForUserDate = now;
            }
            await RedisService.client.lPush(redisChatKey, redisMessages.map(x => stringify(x)).reverse());
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
            return InternalError(res, response);
    }

    return Ok(res, response);
});

//TODO: pagination(maybe)
router.get("/getPMChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    const response = new BaseResponse<ChatDocument[]>();
    try {
        // const payload = new BaseFilter(req.body);
        let userPMChatsQuery = ChatEntity.find({
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ]
        });
        // if (payload.lastRecordDate)
        //     userPMChatsQuery = userPMChatsQuery.where({ updatedAt: { $lt: payload.lastRecordDate } });

        // const userPMChats: ChatDocument[] = await userPMChatsQuery.sort({ updatedAt: -1 }).limit(payload.take).lean(true);;
        const userPMChats: ChatDocument[] = await userPMChatsQuery.lean(true);;

        const requiredUserIds = userPMChats.map(x => {
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
        const redisPMReads: any = [];
        const redisPMs: any = [];
        const lastMessageUserIds: string[] = [];
        const notFoundLastMessageChatIds: string[] = [];
        for (let i = 0; i < userPMChats.length; i++) {
            const userPMChat = userPMChats[i];
            const redisPMAll = await RedisService.client.lRange(RedisKeyType.DBPrivateMessage + userPMChat._id.toString(), 0, -1);
            for (let i = 0; i < redisPMAll.length; i++) {
                const chatData = JSON.parse(redisPMAll[i]);
                if (chatData.t == RedisPMOperationType.UpdateReaded)
                    redisPMReads.push(chatData.e);
                else if (chatData.t == RedisPMOperationType.InsertMessage)
                    redisPMs.push(chatData.e);

            }
            for (let i = 0; i < redisPMs.length; i++) {
                const redisPM = redisPMs[i];
                const readed = redisPMReads.find((x: { _id: any; }) => x._id === redisPM._id);
                if (readed) {
                    redisPM.readed;
                    redisPM.readedAt = readed.createdAt;
                } else {
                    redisPM.readed = false;
                    redisPM.readedAt = null;
                }

            }
            userPMChat.unreadMessageCount = await MessageEntity.countDocuments({
                chatId: userPMChat._id,
                readed: false,
                fromId: { $ne: res.locals.user._id }
            });

            userPMChat.unreadMessageCount += redisPMs.filter((x: { fromId: any; readed: any; }) => !x.readed && x.fromId != res.locals.user._id).length;

            userPMChat.lastMessage = redisPMs.length ?
                redisPMs[redisPMs.length - 1] : null;

            if (userPMChat.lastMessage)
                lastMessageUserIds.push(userPMChat.lastMessage.fromId);
            else
                notFoundLastMessageChatIds.push(userPMChat._id.toString());

            let user = users.find(x => x._id.toString() === userPMChat.ownerId);
            if (user) {
                userPMChat.owner = user;
            } else {
                user = users.find(x => x._id.toString() === userPMChat.participantId.toString());
                if (user) {
                    userPMChat.participant = user;
                } else {
                    pmIndexesToRemove.push(i);
                }
            }
        }
        pmIndexesToRemove.forEach(i => userPMChats.splice(i, 1));

        const notFoundLastMessages: any = await MessageEntity.aggregate([
            { $match: { chatId: { $in: notFoundLastMessageChatIds }, recordStatus: RecordStatus.Active } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$chatId",
                    fromId: { $first: "$fromId" },
                    text: { $first: "$text" },
                    forwarded: { $first: "$forwarded" },
                    forwardedAt: { $first: "$forwardedAt" },
                    readed: { $first: "$readed" },
                    readedAt: { $first: "$readedAt" },
                    files: { $first: "$files" },
                    replyToId: { $first: "$replyToId" },
                }
            }
        ]);
        lastMessageUserIds.push(notFoundLastMessages.map((x: { fromId: string; }) => x.fromId));

        const lastMessageUsers = await UserEntity.find({ _id: { $in: lastMessageUserIds } }, {
            _id: 1, username: 1, firstName: 1, lastName: 1,
            avatarKey: 1, profilePhotoUrl: 1
        }).lean(true);
        for (let i = 0; i < userPMChats.length; i++) {
            const userPMChat = userPMChats[i];
            if (!userPMChat.lastMessage)
                userPMChat.lastMessage = notFoundLastMessages.find((x: { _id: any; }) => x._id.toString() === userPMChat._id.toString());
            const lastMessageUser = lastMessageUsers.find(x => x._id.toString() === userPMChat.lastMessage?.fromId.toString());
            if (userPMChat.lastMessage)
                userPMChat.lastMessage.from = lastMessageUser;

        }

        response.data = userPMChats.sort((a: any, b: any) => {
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
            return InternalError(res, response);
    }

    return Ok(res, response);
});

//TODO: pagination(maybe)
router.get("/getGroupChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    const response = new BaseResponse<GroupChatDocument[]>();
    try {
        const payload = new BaseFilter(req.body);
        const userGroupChatUserEntities = await GroupChatUserEntity.find({
            userId: res.locals.user._id
        }, { "groupChatId": 1 });
        const userGroupChatsIds = userGroupChatUserEntities.map(ugc => ugc.groupChatId);
        let userGroupChatsQuery = GroupChatEntity.find({
            _id: { $in: userGroupChatsIds }
        });

        // if (payload.lastRecordDate)
        //     userGroupChatsQuery = userGroupChatsQuery.where({ updatedAt: { $lt: payload.lastRecordDate } });

        // const userGroupChats: GroupChatDocument[] = await userGroupChatsQuery.sort({ updatedAt: -1 }).limit(payload.take).lean(true);
        const userGroupChats: GroupChatDocument[] = await userGroupChatsQuery.lean(true);

        const redisGMReads: any = [];
        const redisGMs: any = [];
        const lastMessageUserIds: string[] = [];
        const notFoundLastMessageChatIds: string[] = [];
        for (let i = 0; i < userGroupChats.length; i++) {
            const userGroupChat = userGroupChats[i];
            const redisGMAll = await RedisService.client.lRange(RedisKeyType.DBGroupMessage + userGroupChat._id.toString(), 0, -1);
            for (let i = 0; i < redisGMAll.length; i++) {
                const chatData = JSON.parse(redisGMAll[i]);
                if (chatData.t == RedisGMOperationType.InsertReaded)
                    redisGMReads.push(chatData.e);
                else if (chatData.t == RedisGMOperationType.InsertMessage)
                    redisGMs.push(chatData.e);

            }
            for (let i = 0; i < redisGMs.length; i++) {
                const redisGM = redisGMs[i];
                const readed = redisGMReads.find((x: { messageId: string; }) => x.messageId === redisGM._id);
                if (readed) {
                    redisGM.readed;
                    redisGM.readedAt = readed.createdAt;
                } else {
                    redisGM.readed = false;
                    redisGM.readedAt = null;
                }

            }
            userGroupChat.unreadMessageCount = await GroupMessageReadEntity.countDocuments({
                groupChatId: userGroupChat._id,
                readed: false,
                fromId: { $ne: res.locals.user._id }
            });

            userGroupChat.unreadMessageCount += redisGMs.filter((x: { fromId: any; readed: any; }) => !x.readed && x.fromId != res.locals.user._id).length;

            userGroupChat.lastMessage = redisGMs.length ?
                redisGMs[redisGMs.length - 1] : null;

            if (userGroupChat.lastMessage)
                lastMessageUserIds.push(userGroupChat.lastMessage.fromId);
            else
                notFoundLastMessageChatIds.push(userGroupChat._id.toString());

        }

        const notFoundLastMessages: any = await GroupMessageEntity.aggregate([
            { $match: { groupChatId: { $in: notFoundLastMessageChatIds }, recordStatus: RecordStatus.Active } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$chatId",
                    fromId: { $first: "$fromId" },
                    text: { $first: "$text" },
                    // forwarded: { $first: "$forwarded" },
                    // forwardedAt: { $first: "$forwardedAt" },
                    // readed: { $first: "$readed" },
                    // readedAt: { $first: "$readedAt" },
                    files: { $first: "$files" },
                    replyToId: { $first: "$replyToId" },
                }
            }
        ]);
        lastMessageUserIds.push(notFoundLastMessages.map((x: { fromId: string; }) => x.fromId));

        const lastMessageUsers = await UserEntity.find({ _id: { $in: lastMessageUserIds } }, {
            _id: 1, username: 1, firstName: 1, lastName: 1,
            avatarKey: 1, profilePhotoUrl: 1
        }).lean(true);
        for (let i = 0; i < userGroupChats.length; i++) {
            const userGMChat = userGroupChats[i];
            if (!userGMChat.lastMessage)
                userGMChat.lastMessage = notFoundLastMessages.find((x: { _id: any; }) => x._id.toString() === userGMChat._id.toString());
            const lastMessageUser = lastMessageUsers.find(x => x._id.toString() === userGMChat.lastMessage?.fromId.toString());
            if (userGMChat.lastMessage) {
                userGMChat.lastMessage.from = lastMessageUser;
            }
        }

        response.data = userGroupChats.sort((a: any, b: any) => {
            a = new Date(a.lastMessage?.createdAt ?? 0);
            b = new Date(b.lastMessage?.createdAt ?? 0);
            if (a < b) return 1;
            if (a > b) return -1;
            return 0;
        });;
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/createGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "chat/group_images/", 5242880), async (req: CustomRequest<CreateGroupDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }
        //TODO: check if users who added can be added to group
        const redisOps: Promise<any>[] = [];
        const payload = new CreateGroupDTO(req.body);
        payload.hashTags.forEach(async (x, index, arr) => {
            arr[index] = searchable(x);
            const now = new Date();
            const hashtagEntity = new HashtagEntity({});
            const hData: object = {
                e: {
                    _id: hashtagEntity.id,
                    tag: arr[index],
                    createdAt: now,
                    updatedAt: now,
                }
            }
            redisOps.push(RedisService.client.rPush(RedisKeyType.DBHashtagEntity + ":" + `${arr[index]}`, stringify(hData)));
            redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagGroupPopularityIncr + `${arr[index]}:groupPopularity`));
        });
        await Promise.all(redisOps);

        const groupChatEntity = await GroupChatEntity.create(
            {
                title: payload.title,
                ownerId: res.locals.user._id,
                type: payload.type,
                coverImageUrl: req.file?.location,
                avatarKey: payload.avatarKey,
                hashTags: payload.hashTags,
            });

        const findGuardInPayloadUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInPayloadUsers != -1)
            payload.userIds.splice(findGuardInPayloadUsers, 1);

        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChatEntity._id.toString() });
        });
        await GroupChatUserEntity.insertMany(chatUsers);
        const usersIdsNotFound = [];
        payload.userIds.push(res.locals.user._id); //add current user to group
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                if (!socketUser) continue;
                socketUser.join(groupChatName(groupChatEntity._id.toString()));
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
                gCi: groupChatEntity.id,
            });

        const groupGuard = await RedisService.acquireUser("62ab8a204166fd1eaebbb3fa")

        const now = new Date();
        const gMessageEntity = new GroupMessageEntity({});
        const chatData: any = {
            e: {
                _id: gMessageEntity.id,
                fromId: "62ab8a204166fd1eaebbb3fa",
                text: `${payload.title} ${getMessage("groupCreated", req.selectedLangs())}`,
                groupChatId: groupChatEntity.id,
                createdAt: now,
                updatedAt: now,
            },
            t: RedisGMOperationType.InsertMessage
        }

        await RedisService.client.rPush(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, stringify(chatData));
        io.in(groupChatName(chatData.e.groupChatId)).emit("cGmSend", {
            t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                uN: groupGuard.username, //username
                fN: groupGuard.firstName, //first name
                lN: groupGuard.lastName, //last name
                uId: groupGuard._id.toString(), //user id
                ppUrl: groupGuard.profilePhotoUrl, //profile picture url
                avKey: groupGuard.avatarKey, //avatar key
            }
        });

        response.data = {
            t: groupChatEntity.title,
            gCoIm: groupChatEntity.coverImage,
            gAvKey: groupChatEntity.avatarKey,
            gCi: groupChatEntity.id,
        };

        if (findGuardInPayloadUsers != -1)
            response.setMessage(getMessage("groupCreatedGuardSuccess", req.selectedLangs()));
        else
            response.setMessage(getMessage("groupCreatedSuccess", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/updateGroupInfo", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "chat/group_images/", 5242880), async (req: CustomRequest<UpdateGroupInfoDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }
        const payload = new UpdateGroupInfoDTO(req.body);
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId },
            {
                hashTags: 0, hashTags_fuzzy: 0,
                title_fuzzy: 0
            }).lean(true);
        if (!groupChat || !await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id }))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        groupChat.title = payload.title;
        groupChat.type = payload.type;
        groupChat.avatarKey = payload.avatarKey;
        if (payload.hashTags) {
            payload.hashTags.forEach((x, index, arr) => {
                arr[index] = searchable(x)
            });
            groupChat.hashTags = payload.hashTags;
        }
        if (req.file) {
            groupChat.coverImageUrl = req.file.location;
        }
        await groupChat.save();
        const groupChatUsers = await GroupChatUserEntity.find({ groupChatId: groupChat._id.toString() }, { "userId": 1 }).lean(true);
        const groupChatUserIds: string[] = groupChatUsers.map((groupChatUser: GroupChatUserDocument) => groupChatUser.userId);
        const offlineUserIds: string[] = [];
        for (let i = 0; i < groupChatUserIds.length; i++) {
            const userId = groupChatUserIds[i];
            const socketId = onlineUsers.get(userId);
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

        response.setMessage(getMessage("groupCreatedSuccess", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/getMessages", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetChatMessagesDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const payload = new GetChatMessagesDTO(req.body);
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

        let messages: MessageDocument[] = [];
        let isFirstPage = !payload.lastRecordDate;
        // const redisMaxMessagesWithFRCount = -60;

        const redisMessagesWithFR = await RedisService.client
            .lRange(RedisKeyType.DBPrivateMessage + payload.chatId, 0, -1).then(x => x.map(y => JSON.parse(y)));
        let forwards = redisMessagesWithFR.filter(x => x.t == RedisPMOperationType.UpdateForwarded).map(x => x.e);
        let reads = redisMessagesWithFR.filter(x => x.t == RedisPMOperationType.UpdateReaded).map(x => x.e);
        if (isFirstPage) {
            let redisMessages = redisMessagesWithFR.filter(x => x.t == RedisPMOperationType.InsertMessage).map(x => x.e)
                .filter(x => x.recordStatus == undefined || x.recordStatus == RecordStatus.Active &&
                    (x.deletedForUserIds == undefined || !x.deletedForUserIds.includes(res.locals.user._id)));
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
                    newMessagesQuery = newMessagesQuery.where({ createdAt: { $lt: redisMessages[0].createdAt } });

                newMessages = await newMessagesQuery.sort({ createdAt: -1 }).limit(payload.take).lean(true);

            }
            for (let i = redisMessages.length - 1; i >= 0; i--)
                messages.push(redisMessages[i]);

            messages = messages.concat(newMessages);

            const messagesNotFound: any[] = [];

            for (let i = messages.length - 1; i >= 0; i--) {
                const message = messages[i];
                if (!message.forwarded) {
                    const forwarded = forwards.find(x => x._id == message._id.toString());
                    message.forwarded = forwarded ? true : false;
                    if (message.forwarded)
                        message.forwardedAt = forwarded.createdAt;
                    // else if (typeof message._id == "string") //if it comes from redis
                    //     messagesNotFound.push({ index: i, messageId: message._id, type: RedisMessagesNotFoundType.Forward });
                }
                if (!message.readed) {
                    const readed = reads.find(x => x._id == message._id.toString());
                    message.readed = readed ? true : false;
                    if (message.readed)
                        message.readedAt = readed.createdAt;
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
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.fromId, repliedMessage.text, repliedMessage.files);
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
                        // if (messageNotFound.type == RedisMessagesNotFoundType.Reply)
                        messages[messageNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.fromId, message.text, message.files);
                        // else if (messageNotFound.type == RedisMessagesNotFoundType.Forward)
                        //     messages[messageNotFound.index].forwarded = message.forwarded;
                        // else if (messageNotFound.type == RedisMessagesNotFoundType.Read)
                        //     messages[messageNotFound.index].readed = message.readed;
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
                createdAt: { $lt: payload.lastRecordDate }
            }).sort({ createdAt: -1 }).limit(payload.take).lean(true);
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (!message.forwarded) {
                    const forwarded = forwards.find(x => x._id == message._id.toString());
                    message.forwarded = forwarded ? true : false;
                    if (message.forwarded)
                        message.forwardedAt = forwarded.createdAt;
                }
                if (!message.readed) {
                    const readed = reads.find(x => x._id == message._id.toString());
                    message.readed = readed ? true : false;
                    if (message.readed)
                        message.readedAt = readed.createdAt;
                }
                if (message.replyToId) {
                    const repliedMessage = messages.find(x => x._id.toString() == message.replyToId);
                    if (repliedMessage) {
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.fromId, repliedMessage.text, repliedMessage.files);
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
                        messages[messageReplyNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.fromId, message.text, message.files);
                    }
                }
            }
        }

        response.data = messages;
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
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

        if (payload.lastRecordDate)
            query = query.where({ createdAt: { $gt: payload.lastRecordDate } });

        response.data = query.sort({ createdAt: 1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
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
            createdAt: { $lt: payload.messageCreatedAt }
        }).sort({ createdAt: -1 }).limit(10).lean(true);

        const afterMessage10 = await MessageEntity.findOne({
            chatId: payload.chatId,
            createdAt: { $gt: payload.messageCreatedAt }
        }).sort({ createdAt: 1 }).limit(10).lean(true);

        response.data = { tenMessageBefore: beforeMessage10, tenMessageAfter: afterMessage10 };

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
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

        if (payload.lastRecordDate)
            query = query.where({ createdAt: { $gt: payload.lastRecordDate } });

        response.data = query.sort({ createdAt: 1 }).limit(payload.take).lean(true);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/getSearchedPM", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetSearchedGroupChatMessageDTO>, res: any) => {
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
            createdAt: { $lt: payload.messageCreatedAt }
        }).sort({ createdAt: -1 }).limit(10).lean(true);

        const afterMessage10 = await MessageEntity.findOne({
            groupChatId: payload.groupChatId,
            createdAt: { $gt: payload.messageCreatedAt }
        }).sort({ createdAt: 1 }).limit(10).lean(true);

        response.data = { tenMessageBefore: beforeMessage10, tenMessageAfter: afterMessage10 };

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

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
                            message: {
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
       "$ref": "#/definitions/NullResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisSendFileMessageDTO(req.body);

        //TODO: offline durumu
        response.data = { ci: null, mi: null };

        if (!payload.ci) {
            const chatEntity = await ChatEntity.findOneAndUpdate(
                { ownerId: res.locals.user._id, participantId: payload.to },
                { $setOnInsert: { ownerId: res.locals.user._id, participantId: payload.to } },
                { upsert: true, new: true });
            payload.ci = chatEntity.id; //may be null, catch it later
            response.data["ci"] = payload.ci;
        }
        const files = [new MessageFiles(req.file.location, req.file.mimetype, req.file.size)];
        const now = new Date();
        const messageEntity = new MessageEntity({});
        const chatData: object = {
            e: {
                _id: messageEntity.id,
                fromId: res.locals.user._id,
                text: payload.m,
                chatId: payload.ci,
                files: files,
                createdAt: now,
                updatedAt: now,
            }, t: RedisPMOperationType.InsertMessage
        }

        response.data["mi"] = messageEntity.id;

        await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + payload.ci, stringify(chatData));
        const emitData: any = { message: payload.m, mi: messageEntity.id, ci: payload.ci, files: files, f: null };

        if (!payload.ci)
            emitData["f"] = await RedisService.acquireUser(res.locals.user._id, ["_id", "username", "firstName", "lastName", "profilePhotoUrl", "avatarKey"]);

        io.to(payload.to).emit("cPmSend", emitData);


    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

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
       "$ref": "#/definitions/NullResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisUpdateFileMessageDTO(req.body);
        let message;

        let redisChatMessages = await RedisService.client.lRange(RedisKeyType.DBPrivateMessage + payload.ci, 0, -1).then(x => x.map(y => {
            const chatData = JSON.parse(y);
            if (chatData.t == RedisPMOperationType.InsertMessage)
                return chatData.e;
        }));
        const files = [new MessageFiles(req.file?.location, req.file.mimetype, req.file.size)];

        message = redisChatMessages.find(x => x._id == payload.mi);
        if (!message) {
            message = await MessageEntity.findById(payload.mi);
            if (!message)
                throw new NotValidError(getMessage("messageNotFound", req.selectedLangs()));
            if (message.fromId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
            message.files.push(new MessageFiles(req.file?.location, req.file.mimetype, req.file.size));
            message.markModified("files");
            await message?.save();
        } else {
            if (message.fromId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
            const chatData: object = {
                e: {
                    mi: payload.mi,
                    file: files[0],
                }, t: RedisPMOperationType.UpdateSendFileMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + payload.ci, stringify(chatData));
        }

        //TODO: offline durumu
        response.data = { ci: null, mi: null };
        response.data["mi"] = payload.mi;

        const emitData: any = { mi: payload.mi, ci: payload.ci, files: files, f: null };

        if (!payload.ci)
            emitData["f"] = await RedisService.acquireUser(res.locals.user._id, ["_id", "username", "firstName", "lastName", "profilePhotoUrl", "avatarKey"]);

        io.to(payload.to).emit("cPmSend", emitData);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/getGroupMessages", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetGroupChatMessagesDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const payload = new GetGroupChatMessagesDTO(req.body);
        const userGroupChatIds = await RedisService.acquire<string[]>(RedisKeyType.User + res.locals.user._id + ":groupChats", 60 * 60 * 8, async () => {
            const groupChats = await GroupChatUserEntity.find({ userId: res.locals.user._id });
            return groupChats.map(x => x.groupChatId);
        });
        if (!userGroupChatIds.includes(payload.groupChatId)) {
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        let messages: GroupMessageDocument[] = [];
        let isFirstPage = !payload.lastRecordDate;
        // const redisMaxMessagesWithFRCount = -60;

        const redisMessagesWithFileUpdates = await RedisService.client
            .lRange(RedisKeyType.DBGroupMessage + payload.groupChatId, 0, -1).then(x => x.map(y => JSON.parse(y)));

        if (isFirstPage) {
            let redisMessages = redisMessagesWithFileUpdates.filter(x => x.t == RedisGMOperationType.InsertMessage).map(x => x.e);
            let redisFileMessageUpdates = redisMessagesWithFileUpdates.filter(x => x.t == RedisGMOperationType.UpdateSendFileMessage).map(x => x.e);
            payload.take -= redisMessages.length
            let newMessages: GroupMessageDocument[] = [];
            if (payload.take > 0) {

                let newMessagesQuery = GroupMessageEntity.find({
                    groupChatId: payload.groupChatId,
                });

                if (redisMessages.length > 0)
                    newMessagesQuery = newMessagesQuery.where({ createdAt: { $lt: redisMessages[0].createdAt } });

                newMessages = await newMessagesQuery.sort({ createdAt: -1 }).limit(payload.take).lean(true);

            }
            for (let i = redisMessages.length - 1; i >= 0; i--)
                messages.push(redisMessages[i]);

            messages = messages.concat(newMessages);

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
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.fromId, repliedMessage.text, repliedMessage.files);
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
                        // if (messageNotFound.type == RedisMessagesNotFoundType.Reply)
                        messages[messageNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.fromId, message.text, message.files);
                        // else if (messageNotFound.type == RedisMessagesNotFoundType.Forward)
                        //     messages[messageNotFound.index].forwarded = message.forwarded;
                        // else if (messageNotFound.type == RedisMessagesNotFoundType.Read)
                        //     messages[messageNotFound.index].readed = message.readed;
                    }
                }
            }

        } else {
            const messagesRepliesNotFound: any[] = [];
            messages = await GroupMessageEntity.find({
                groupChatId: payload.groupChatId,
                createdAt: { $lt: payload.lastRecordDate }
            }).sort({ createdAt: -1 }).limit(payload.take).lean(true);
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (message.replyToId) {
                    const repliedMessage = messages.find(x => x._id.toString() == message.replyToId);
                    if (repliedMessage) {
                        message.replyTo = new ReplyToDTO(repliedMessage._id.toString(), repliedMessage.fromId, repliedMessage.text, repliedMessage.files);
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
                        messages[messageReplyNotFound.index].replyTo = new ReplyToDTO(message._id.toString(), message.fromId, message.text, message.files);
                    }
                }
            }
        }

        response.data = {
            messages: messages,
            groupChat: {
                memberCount: await GroupChatUserEntity.countDocuments({ groupChatId: payload.groupChatId }),
            }
        };
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
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

        if (payload.lastRecordDate)
            groupUsersEntityQuery = groupUsersEntityQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const groupUsersEntity = await groupUsersEntityQuery.sort({ createdAt: -1 }).limit(payload.take).lean(true);

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
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/sendGMFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("files", [".png", ".jpg", ".jpeg", ".svg", ".gif", ".pdf", ".doc", ".docx", ".txt", ".webm", ".mp4", ".mp3", ".avi", ".rar", ".zip"], "chat/group_message_files/", 50000000), validateSendFileMessage, async (req: CustomRequest<RedisGroupSendFileMessageDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Send file message.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                            message: {
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
       "$ref": "#/definitions/NullResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisGroupSendFileMessageDTO(req.body);

        //TODO: offline durumu
        response.data = { gCi: null, mi: null };
        const userGroupChatIds = await RedisService.acquire<string[]>(RedisKeyType.User + res.locals.user._id + ":groupChats", 60 * 60 * 8, async () => {
            const groupChats = await GroupChatUserEntity.find({ userId: res.locals.user._id });
            return groupChats.map(x => x.groupChatId);
        });
        if (!userGroupChatIds.includes(payload.gCi)) {
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        const files = [new MessageFiles(req.file?.location, req.file.mimetype, req.file.size)];
        const now = new Date();
        const messageEntity = new GroupMessageEntity({});
        const chatData: object = {
            e: {
                _id: messageEntity.id,
                fromId: res.locals.user._id,
                text: payload.m,
                groupChatId: payload.gCi,
                files: files,
                replyToId: payload.replyToId,
                createdAt: now,
                updatedAt: now,
            }, t: RedisPMOperationType.InsertMessage
        }

        response.data["mi"] = messageEntity.id;

        await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + payload.gCi, stringify(chatData));

        const emitData: any = { message: payload.m, mi: messageEntity.id, gCi: payload.gCi, files: files, f: null };

        emitData["f"] = await RedisService.acquireUser(res.locals.user._id, ["_id", "username", "firstName", "lastName", "profilePhotoUrl", "avatarKey"]);

        io.in(groupChatName(payload.gCi)).emit("cGmSend", emitData);


    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/updateGMFile", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("files", [".png", ".jpg", ".jpeg", ".svg", ".gif", ".pdf", ".doc", ".docx", ".txt", ".webm", ".mp4", ".mp3", ".avi", ".rar", ".zip"], "chat/message_files/", 5242880), validateUpdateFileMessage, async (req: CustomRequest<RedisGroupUpdateFileMessageDTO>, res: any) => {
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
       "$ref": "#/definitions/NullResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        const payload = new RedisGroupUpdateFileMessageDTO(req.body);
        let message;

        let redisGroupChatMessages = await RedisService.client.lRange(RedisKeyType.DBGroupMessage + payload.gCi, 0, -1).then(x => x.map(y => {
            const chatData = JSON.parse(y);
            if (chatData.t == RedisGMOperationType.InsertMessage)
                return chatData.e;
        }));;
        const files = [new MessageFiles(req.file?.location, req.file.mimetype, req.file.size)];

        message = redisGroupChatMessages.find(x => x._id == payload.mi);
        if (!message) {
            message = await GroupMessageEntity.findById(payload.mi);
            if (!message)
                throw new NotValidError(getMessage("messageNotFound", req.selectedLangs()));
            if (message.fromId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
            message.files.push(new MessageFiles(req.file?.location, req.file.mimetype, req.file.size));
            message.markModified("files");
            await message?.save();
        } else {
            if (message.fromId != res.locals.user._id)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
            const chatData: object = {
                e: {
                    mi: payload.mi,
                    file: files[0],
                }, t: RedisGMOperationType.UpdateSendFileMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBGroupMessage + payload.gCi, stringify(chatData));
        }

        //TODO: offline durumu
        response.data = { ci: null, mi: null };
        response.data["mi"] = payload.mi;

        const emitData: any = { mi: payload.mi, gCi: payload.gCi, files: files, f: null };

        emitData["f"] = await RedisService.acquireUser(res.locals.user._id, ["_id", "username", "firstName", "lastName", "profilePhotoUrl", "avatarKey"]);

        io.in(groupChatName(payload.gCi)).emit("cGmSend", emitData);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/addToGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<AddToGroupChatDTO>, res: any) => {

    var response = new BaseResponse<object>();
    try {
        var payload = new AddToGroupChatDTO(req.body);
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId }, {
            hashTags: 0,
            hashTags_fuzzy: 0,
            title_fuzzy: 0,
        }).lean(true);

        if (!groupChat || (groupChat.ownerId != res.locals.user._id &&
            !await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active })))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        const findGuardInPayloadUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInPayloadUsers != -1)
            payload.userIds.splice(findGuardInPayloadUsers, 1);

        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChat._id.toString() });
        });

        await GroupChatUserEntity.insertMany(chatUsers);

        const socketUserDatas = [];
        const usersIdsNotFound = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            await RedisService.client.del(RedisKeyType.User + userId + ":groupChats");
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                if (!socketUser) continue;
                io.to(socketId).emit("cAddedToGroup", {
                    t: groupChat.title,
                    gCoIm: groupChat.coverImage,
                    gAvKey: groupChat.avatarKey,
                    gCi: groupChat._id.toString(),
                });

                //TODO: send notification and users's new notification badge by 1
                socketUser.join(groupChatName(groupChat._id.toString()));
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user.id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                    avKey: socketUser.avatarKey, //avatar key
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
                avKey: user.avatarKey, //avatar key
            });
        }

        const groupGuard = await RedisService.acquireUser("62ab8a204166fd1eaebbb3fa")
        const notifications = [];
        for (let i = 0; i < socketUserDatas.length; i++) {
            const userData = socketUserDatas[i];
            const now = new Date();
            const gMessageEntity = new GroupMessageEntity({});
            const chatData: any = {
                e: {
                    _id: gMessageEntity.id,
                    fromId: "62ab8a204166fd1eaebbb3fa",
                    text: `${userData.uN} ${getMessage("addedToGroup", req.selectedLangs())}`,
                    groupChatId: groupChat._id.toString(),
                    createdAt: now,
                    updatedAt: now,
                },
                t: RedisGMOperationType.InsertMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, stringify(chatData));
            io.in(groupChatName(chatData.e.groupChatId)).emit("cGmSend", {
                t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                    uN: groupGuard.username, //username
                    fN: groupGuard.firstName, //first name
                    lN: groupGuard.lastName, //last name
                    uId: groupGuard._id.toString(), //user id
                    ppUrl: groupGuard.profilePhotoUrl, //profile picture url
                    avKey: groupGuard.avatarKey, //avatar key
                }
            });
            notifications.push(new NotificationEntity({
                senderId: res.locals.user._id,
                receiverId: userData.uId,
                type: NotificationType.AddedYouToGroupChat,
                groupChatId: chatData.e.groupChatId,
            }));
        }
        await NotificationEntity.insertMany(notifications);

        if (findGuardInPayloadUsers != -1)
            response.setMessage(getMessage("groupUsersAddedGuardSuccess", req.selectedLangs()));
        else
            response.setMessage(getMessage("groupUsersAddedSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
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
                title_fuzzy: 0
            }).lean(true);

        if (!groupChat || groupChat.ownerId != res.locals.user._id)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

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
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user.id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                    avKey: socketUser.avatarKey, //avatar key
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
                avKey: user.avatarKey, //avatar key
            });

        }

        const groupGuard = await RedisService.acquireUser("62ab8a204166fd1eaebbb3fa")

        for (let i = 0; i < socketUserDatas.length; i++) {
            const userData = socketUserDatas[i];
            const now = new Date();
            const gMessageEntity = new GroupMessageEntity({});
            const chatData: any = {
                e: {
                    _id: gMessageEntity.id,
                    fromId: "62ab8a204166fd1eaebbb3fa",
                    text: `${userData.uN} ${getMessage("newAdmin", req.selectedLangs())}`,
                    groupChatId: groupChat._id.toString(),
                    createdAt: now,
                    updatedAt: now,
                },
                t: RedisGMOperationType.InsertMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, stringify(chatData));
            io.in(groupChatName(chatData.e.groupChatId)).emit("cGmSend", {
                t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                    uN: groupGuard.username, //username
                    fN: groupGuard.firstName, //first name
                    lN: groupGuard.lastName, //last name
                    uId: groupGuard._id.toString(), //user id
                    ppUrl: groupGuard.profilePhotoUrl, //profile picture url
                    avKey: groupGuard.avatarKey, //avatar key
                }
            });
        }

        if (findGuardInPayloadUsers != -1)
            response.setMessage(getMessage("groupAdminsAddedGuardSuccess", req.selectedLangs()));
        else
            response.setMessage(getMessage("groupAdminsAddedSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/removeFromGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<RemoveFromGroupChatDTO>, res: any) => {

    var response = new BaseResponse<object>();
    try {
        var payload = new RemoveFromGroupChatDTO(req.body);
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId },
            {
                hashTags: 0, hashTags_fuzzy: 0,
                title_fuzzy: 0
            }).lean(true);

        if (!groupChat || (groupChat.ownerId != res.locals.user._id &&
            !await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active })))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        const findGuardInDeletedUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInDeletedUsers != -1)
            payload.userIds.splice(findGuardInDeletedUsers, 1);


        await GroupChatUserEntity.updateMany({ groupChatId: groupChat._id.toString(), userId: { $in: payload.userIds } }, { recordStatus: RecordStatus.Deleted });

        const socketUserDatas = [];
        const usersIdsNotFound = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            await RedisService.client.del(RedisKeyType.User + userId + ":groupChats");
            const socketId = onlineUsers.get(userId);
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
                    uId: socketUser.data.user.id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                    avKey: socketUser.avatarKey, //avatar key
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
                avKey: user.avatarKey, //avatar key
            });

        }

        const groupGuard = await RedisService.acquireUser("62ab8a204166fd1eaebbb3fa")

        for (let i = 0; i < socketUserDatas.length; i++) {
            const userData = socketUserDatas[i];
            const now = new Date();
            const gMessageEntity = new GroupMessageEntity({});
            const chatData: any = {
                e: {
                    _id: gMessageEntity.id,
                    fromId: "62ab8a204166fd1eaebbb3fa",
                    text: `${userData.uN} ${getMessage("removedFromGroup", req.selectedLangs())}`,
                    groupChatId: groupChat._id.toString(),
                    createdAt: now,
                    updatedAt: now,
                },
                t: RedisGMOperationType.InsertMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, stringify(chatData));
            io.in(groupChatName(chatData.e.groupChatId)).emit("cGmSend", {
                t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                    uN: groupGuard.username, //username
                    fN: groupGuard.firstName, //first name
                    lN: groupGuard.lastName, //last name
                    uId: groupGuard._id.toString(), //user id
                    ppUrl: groupGuard.profilePhotoUrl, //profile picture url
                    avKey: groupGuard.avatarKey, //avatar key
                }
            });
        }

        if (findGuardInDeletedUsers != -1)
            response.setMessage(getMessage("groupUsersRemovedGuardSuccess", req.selectedLangs()));
        else
            response.setMessage(getMessage("groupUsersRemovedSuccess", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/getGroupProfile/:groupChatId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<any>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const groupChatId = req.params.groupChatId;
        if (!isValidObjectId(groupChatId))
            throw new NotValidError(getMessage("invalidObjectId", req.selectedLangs()));

        const groupChat = await GroupChatEntity.findOne({ _id: groupChatId },
            {
                hashTags: 0, hashTags_fuzzy: 0,
                title_fuzzy: 0
            }).lean(true);

        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", req.selectedLangs()));

        if (groupChat.type == GroupChatType.Private) {
            const groupChatUser = await GroupChatUserEntity.exists({ groupChatId: groupChatId, userId: res.locals.user._id, recordStatus: RecordStatus.Active }).lean(true);
            if (!groupChatUser)
                throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));
        }

        const last10User = await GroupChatUserEntity.find({ groupChatId: groupChatId }).sort({ createdAt: -1 }).limit(10).lean(true);
        const last10UserIds = last10User.map(x => x.userId);
        const users = await UserEntity.find({ _id: { $in: last10UserIds } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1, "lastSeenDate": 1 }).lean(true);

        response.data = {
            groupChat: groupChat,
            last10User: users,
        }
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

router.post("/leaveGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateLeaveGroup, async (req: CustomRequest<LeaveGroupDTO>, res: any) => {
    const response = new BaseResponse<any>();
    try {
        const payload = new LeaveGroupDTO(req.body);
        const leaveGroup = await GroupChatUserEntity.findOneAndUpdate({
            groupChatId: payload.groupChatId,
            userId: res.locals.user._id,
        }, {
            recordStatus: RecordStatus.Deleted
        });

        if (!leaveGroup)
            throw new NotValidError(getMessage("groupChatUserNotFound", req.selectedLangs()));

        const groupGuard = await RedisService.acquireUser("62ab8a204166fd1eaebbb3fa")

        const leavedUser = await UserEntity.findOne({ _id: res.locals.user._id }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1, "avatarKey": 1 }).lean(true);
        const now = new Date();
        const gMessageEntity = new GroupMessageEntity({});
        const chatData: any = {
            e: {
                _id: gMessageEntity.id,
                fromId: "62ab8a204166fd1eaebbb3fa",
                text: `${leavedUser?.firstName} ${getMessage("removedFromGroup", req.selectedLangs())}`,
                groupChatId: payload.groupChatId,
                createdAt: now,
                updatedAt: now,
            },
            t: RedisGMOperationType.InsertMessage
        }

        await RedisService.client.rPush(RedisKeyType.DBGroupMessage + chatData.e.groupChatId, stringify(chatData));
        io.in(groupChatName(chatData.e.groupChatId)).emit("cGmSend", {
            t: chatData.e.text, mi: gMessageEntity.id, gCi: chatData.e.groupChatId, f: {
                uN: groupGuard.username, //username
                fN: groupGuard.firstName, //first name
                lN: groupGuard.lastName, //last name
                uId: groupGuard._id.toString(), //user id
                ppUrl: groupGuard.profilePhotoUrl, //profile picture url
                avKey: groupGuard.avatarKey, //avatar key
            }
        });
        const socketId = onlineUsers.get(res.locals.user._id);
        if (socketId) {
            const socketUser = io.sockets.sockets.get(socketId);
            socketUser?.leave(groupChatName(payload.groupChatId));
        }

        response.setMessage(getMessage("leaveGroupSuccess", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

export {
    io,
    router as default
}