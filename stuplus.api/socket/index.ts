import ISocket from "./interfaces/socket";
import { ChatEntity, GroupMessageForwardEntity, GroupMessageEntity, GroupMessageReadEntity, MessageEntity, UserEntity, GroupChatEntity, GroupChatUserEntity } from "../../stuplus-lib/entities/BaseEntity";
import "../../stuplus-lib/extensions/extensionMethods"
require("dotenv").config();
import { RedisSendFileMessageDTO, RedisGroupMessageDTO, RedisGroupMessageForwardReadDTO, RedisMessageDTO, RedisMessageForwardReadDTO, RedisUpdateFileMessageDTO, RedisGroupSendFileMessageDTO, RedisGroupUpdateFileMessageDTO } from "./dtos/RedisChat";
import { RedisPMOperationType, RedisKeyType, RedisGMOperationType, Role, WatchRoomTypes } from "../../stuplus-lib/enums/enums_socket";
import { authorize, authorizeSocket } from "./utils/auth";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { AddToGroupChatDTO, CreateGroupDTO, GetChatMessagesDTO, GetGroupChatMessagesDTO, GetSearchedChatMessageDTO, GetSearchedChatMessagesDTO, MakeUsersGroupAdminDTO, RemoveFromGroupChatDTO, UpdateGroupInfoDTO, WatchUsersDTO } from "./dtos/Chat";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { groupChatName, userWatchRoomName } from "../../stuplus-lib/utils/namespaceCreators";
import RedisService from "../../stuplus-lib/services/redisService";
import { httpServer } from "../server";
import { stringify } from "../../stuplus-lib/utils/general";
import { MessageDocument, MessageFiles, ReplyToDTO } from "../../stuplus-lib/entities/MessageEntity";
import { RecordStatus, RedisMessagesNotFoundType } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { Router } from "express";
import { uploadFileS3 } from "../../stuplus-lib/services/fileService";
import { validateSendFileMessage, validateUpdateFileMessage } from "../middlewares/validation/chat/validateChatRoute";
import { GroupMessageDocument } from "../../stuplus-lib/entities/GroupMessageEntity";
import { GroupChatUserDocument } from "../../stuplus-lib/entities/GroupChatUserEntity";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { ChatDocument } from "../../stuplus-lib/entities/ChatEntity";
const router = Router();
let onlineUsers: Map<string, string>;
setup();
async function setup() {
    onlineUsers = new Map<string, string>();
};

console.log("httpServer: ", httpServer)

const io = require("socket.io")(3000, {
    pingTimeout: 30000,
    maxHttpBufferSize: 1e8,
    // allowRequest: (req, callback) => {
    //     const isOriginValid = check(req);
    //     callback(null, isOriginValid);
    // },
    transports: ["websocket", "polling"],
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
        "_id": 0, "__t": 0, "blockedUserIds": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1
    });
    if (!user) {
        socket.disconnect();
        return;
    }
    onlineUsers.set(decodedJwtUser["_id"], socket.id);
    user.id = decodedJwtUser["_id"];
    socket.data.user = user;

    // const groupChats = await GroupChatUserEntity.find({ userId: decodedJwtUser["_id"] }, {
    //     "_id": 0, "groupChatId": 1
    // }, { lean: true });
    const groupChatIds = await RedisService.acquire<string[]>(RedisKeyType.User + socket.data.user.id + ":groupChats", 60 * 60 * 8, async () => {
        const groupChats = await GroupChatUserEntity.find({ userId: socket.data.user.id });
        return groupChats.map(x => x.groupChatId);
    });
    for (let i = 0; i < groupChatIds.length; i++) {
        socket.join(groupChatName(groupChatIds[i]));
    }

    io.in(userWatchRoomName(user.id)).emit("c-watch-users", {
        id: user.id,
        t: WatchRoomTypes.UserOnline
    });
    console.log("client connected. socket id: ", socket.id);

    socket.join(user.id);

    socket.on("disconnect", (reason: any) => {
        console.log("disconnect: reason ", reason); // "ping timeout"
        onlineUsers.delete(socket.data.user.id);
        io.in(userWatchRoomName(socket.data.user.id)).emit("c-watch-users", {
            id: socket.data.user.id,
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
            const toUser = await RedisService.acquireUser(data.to, {
                "_id": 0, "__t": 0, "blockedUserIds": 1, "firstName": 0, "lastName": 0, "profilePhotoUrl": 0
            });
            // const toUserFollows = await RedisService.acquire<string[]>(RedisKeyType.User + data.to + ":follows", 60 * 60 * 8, async () => {
            //     //TODO:add hash set logic here
            // });
            if (!toUser || toUser.blockedUserIds?.includes(socket.data.user.id)) {
                cb({ success: false, message: "User not found." });
                return;
            }


            let responseData: any = { success: true };

            if (!data.ci) {
                const chatEntity = await ChatEntity.findOneAndUpdate(
                    {
                        $or: [
                            { ownerId: socket.data.user.id, participantId: data.to },
                            { ownerId: data.to, participantId: socket.data.user.id },
                        ],
                    },
                    { $setOnInsert: { ownerId: socket.data.user.id, participantId: data.to } },
                    { upsert: true, new: true });
                data.ci = chatEntity.id; //may be null, catch it later
                responseData["ci"] = data.ci;
            }
            const now = new Date();
            const messageEntity = new MessageEntity({});
            const chatData: object = {
                e: {
                    _id: messageEntity.id,
                    fromId: socket.data.user.id,
                    text: data.m,
                    chatId: data.ci,
                    replyToId: data.rToId,
                    createdAt: now,
                    updatedAt: now,
                }, t: RedisPMOperationType.InsertMessage
            }

            responseData["mi"] = messageEntity.id;

            await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + data.ci, stringify(chatData));

            io.to(data.to).emit("c-pm-send", { t: data.m, mi: messageEntity.id, ci: data.ci });

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

            io.to(data.to).emit("c-pm-forwarded", { mids: data.mids, ci: data.ci });

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

            io.to(data.to).emit("c-pm-readed", { mids: data.mids, ci: data.ci });

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
            const userGroupChatIds = await RedisService.acquire<string[]>(RedisKeyType.User + socket.data.user.id + ":groupChats", 60 * 60 * 8, async () => {
                const groupChats = await GroupChatUserEntity.find({ userId: socket.data.user.id });
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
                    fromId: socket.data.user.id,
                    text: data.m,
                    groupChatId: data.gCi,
                    replyToId: data.rToId,
                    createdAt: now,
                    updatedAt: now,
                },
                t: RedisGMOperationType.InsertMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBGroupMessage + data.gCi, stringify(chatData));

            socket.to(groupChatName(data.gCi)).emit("c-gm-send", { t: data.m, mi: gMessageEntity.id, gCi: data.gCi, fId: socket.data.user.id });

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
                        _id: gMessageForwardEntity.id, messageId: mi, forwardedTo: socket.data.user.id,
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisGMOperationType.InsertForwarded
                }
                await RedisService.client.rPush(RedisKeyType.DBGroupMessage + data.gCi, stringify(chatData));
            }

            socket.to(groupChatName(data.gCi)).emit("c-gm-forwarded",
                {
                    mi: data.mids,
                    gCi: data.gCi,
                    to: {
                        id: socket.data.user.id,
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
                        _id: gMessageReadEntity.id, messageId: mi, readedBy: socket.data.user.id,
                        createdAt: now,
                        updatedAt: now,
                    },
                    t: RedisGMOperationType.InsertReaded
                }
                await RedisService.client.rPush(RedisKeyType.DBGroupMessage + data.gCi, stringify(chatData));
            }

            socket.to(groupChatName(data.gCi)).emit("c-gm-readed",
                {
                    mi: data.mids,
                    gCi: data.gCi,
                    by: {
                        id: socket.data.user.id,
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
            cb({ success: false, message: "You can watch only 100 users at once." });
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

router.get("/", (req: any, res: any) => {
    const count = io.engine.clientsCount;
    // may or may not be similar to the count of Socket instances in the main namespace, depending on your usage
    const count2 = io.of("/").sockets.size;
    return res.status(200).send({
        count,
        count2
    });
});

router.post("/getPMChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
    const response = new BaseResponse<ChatDocument[]>();
    try {
        const payload = new BaseFilter(req.body);
        let userPMChatsQuery = ChatEntity.find({
            $or: [
                { ownerId: res.locals.user._id },
                { participantId: res.locals.user._id }
            ]
        });
        if (payload.lastRecordDate)
            userPMChatsQuery = userPMChatsQuery.where({ updatedAt: { $lt: payload.lastRecordDate } });

        const userPMChats: ChatDocument[] = await userPMChatsQuery.sort({ updatedAt: -1 }).limit(payload.take).lean(true);;

        const requiredUserIds = userPMChats.map(x => {
            if (x.ownerId === res.locals.user._id) {
                return x.participantId;
            } else {
                return x.ownerId;
            }
        });
        const users = await UserEntity.find({ _id: { $in: requiredUserIds } }, {
            _id: 1, username: 1, firstName: 1, lastName: 1,
            avatarKey: 1, profilePhotoUrl: 1
        }).lean(true);
        const pmIndexesToRemove: number[] = [];
        const redisPMReads: any = [];
        const redisPMs: any = [];
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
                redisPMs[redisPMs.length - 1] :
                await MessageEntity.findOne({ chatId: userPMChat._id }, {}, { sort: { createdAt: -1 } }).lean(true);;
            if (userPMChat.lastMessage)
                userPMChat.lastMessage.from = await RedisService.acquireUser(userPMChat.lastMessage.fromId, {
                    _id: 1, username: 1, firstName: 1, lastName: 1
                });

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

        response.data = userPMChats;
    }
    catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

// router.post("/getGroupChats", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
//     const response = new BaseResponse<object>();
//     try {
//         const payload = new BaseFilter(req.body);
//         const userGroupChatUserEntities = await GroupChatUserEntity.find({
//             userId: res.locals.user._id
//         }, { "groupChatId": 1 });
//         const userGroupChatsIds = userGroupChatUserEntities.map(ugc => ugc.groupChatId);
//         const userGroupChats = await GroupChatEntity.find({
//             _id: { $in: userGroupChatsIds }
//         });
//         if (payload.lastRecordDate)
//             userPMChatsQuery = userPMChatsQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

//         const userPMChats = await userPMChatsQuery.sort({ createdAt: -1 }).limit(payload.take);

//         const requiredUserIds = userPMChats.map(x => {
//             if (x.ownerId === res.locals.user._id) {
//                 return x.participantId;
//             } else {
//                 return x.ownerId;
//             }
//         });
//         const users = await UserEntity.find({ _id: { $in: requiredUserIds } }, {
//             _id: 1, username: 1, firstName: 1, lastName: 1,
//             avatarKey: 1, profilePhotoUrl: 1
//         });
//         const groupsIndexesToRemove: number[] = [];
//         for (let i = 0; i < userPMChats.length; i++) {
//             const userPMChat = userPMChats[i];
//             let user = users.find(x => x._id.toString() === userPMChat.ownerId.toString());
//             if (user) {
//                 userPMChat.owner = user;
//             } else {
//                 user = users.find(x => x._id.toString() === userPMChat.participantId.toString());
//                 if (user) {
//                     userPMChat.participant = user;
//                 } else {
//                     groupsIndexesToRemove.push(i);
//                 }
//             }
//         }
//         groupsIndexesToRemove.forEach(i => userPMChats.splice(i, 1));

//         response.data = userPMChats;
//     }
//     catch (err: any) {
//         response.setErrorMessage(err.message);

//         if (err.status != 200)
//             return InternalError(res, response);
//     }

//     return Ok(res, response);
// });

router.post("/createGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "chat/group_images/", 5242880), async (req: CustomRequest<CreateGroupDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }
        //TODO: check if users who added can be added to group
        const payload = new CreateGroupDTO(req.body);
        const groupChatEntity = await GroupChatEntity.create({ title: payload.title, ownerId: res.locals.user._id, type: payload.type, coverImageUrl: req.file?.location, avatarKey: payload.avatarKey });
        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChatEntity._id.toString() });
        });
        await GroupChatUserEntity.insertMany(chatUsers);
        const socketUserDatas = [];
        const usersIdsNotFound = [];
        payload.userIds.push(res.locals.user._id); //add current user to group
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                socketUser?.join(groupChatName(groupChatEntity._id.toString()));
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user.id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
            });
        }
        io.in(groupChatName(groupChatEntity.id)).emit("c-group-created",
            {
                t: groupChatEntity.title,
                gCoIm: groupChatEntity.coverImage,
                gAvKey: groupChatEntity.avatarKey,
                gCi: groupChatEntity.id,
                gUsers: socketUserDatas
            });

        response.data = {
            t: groupChatEntity.title,
            gCoIm: groupChatEntity.coverImage,
            gAvKey: groupChatEntity.avatarKey,
            gCi: groupChatEntity.id,
            gUsers: socketUserDatas
        };

        response.setMessage(getMessage("groupCreatedSuccess", req.selectedLangs()));

    } catch (err: any) {
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
        const payload = new CreateGroupDTO(req.body);
        const groupChatEntity = await GroupChatEntity.create({ title: payload.title, ownerId: res.locals.user._id, type: payload.type, coverImageUrl: req.file?.location, avatarKey: payload.avatarKey });
        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChatEntity.id });
        });
        await GroupChatUserEntity.insertMany(chatUsers);
        const socketUserDatas = [];
        const usersIdsNotFound = [];
        payload.userIds.push(res.locals.user._id); //add current user to group
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                socketUser?.join(groupChatName(groupChatEntity.id));
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user.id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
            });
        }
        io.in(groupChatName(groupChatEntity.id)).emit("c-group-created",
            {
                t: groupChatEntity.title,
                gCoIm: groupChatEntity.coverImage,
                gAvKey: groupChatEntity.avatarKey,
                gCi: groupChatEntity.id,
                gUsers: socketUserDatas
            });

        response.data = {
            t: groupChatEntity.title,
            gCoIm: groupChatEntity.coverImage,
            gAvKey: groupChatEntity.avatarKey,
            gCi: groupChatEntity.id,
            gUsers: socketUserDatas
        };

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
        const groupChat = await GroupChatEntity.findById(payload.groupChatId);
        if (!groupChat || !groupChat.adminIds.includes(res.locals.user._id))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        groupChat.title = payload.title;
        groupChat.type = payload.type;
        groupChat.avatarKey = payload.avatarKey;
        if (req.file) {
            groupChat.coverImageUrl = req.file.location;
        }
        await groupChat.save();
        const groupChatUsers = await GroupChatUserEntity.find({ groupChatId: groupChat.id }, { "userId": 1 }).lean(true);
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
        io.in(groupChatName(groupChat.id)).emit("c-group-info-updated",
            {
                t: groupChat.title,
                gCoIm: groupChat.coverImage,
                gAvKey: groupChat.avatarKey,
                gCi: groupChat.id,
            });

        response.data = {
            t: groupChat.title,
            gCoIm: groupChat.coverImage,
            gAvKey: groupChat.avatarKey,
            gCi: groupChat.id,
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
            let redisMessages = redisMessagesWithFR.filter(x => x.t == RedisPMOperationType.InsertMessage).map(x => x.e);
            let redisFileMessageUpdates = redisMessagesWithFR.filter(x => x.t == RedisPMOperationType.UpdateSendFileMessage).map(x => x.e);
            payload.take -= redisMessages.length
            let newMessages: MessageDocument[] = [];
            if (payload.take > 0) {

                let newMessagesQuery = MessageEntity.find({
                    chatId: payload.chatId,
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

router.get("/getSearchedPMMessages", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetSearchedChatMessagesDTO>, res: any) => {
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

        let query = MessageEntity.find({ chatId: payload.chatId, $text: { $search: payload.searchedText } })

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

router.get("/getSearchedPMMessage", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetSearchedChatMessageDTO>, res: any) => {
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

        io.to(payload.to).emit("c-pm-send", { message: payload.m, mi: messageEntity.id, ci: payload.ci, files: files });


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

        io.to(payload.to).emit("c-pm-send", { mi: payload.mi, ci: payload.ci, files: files });

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

        response.data = messages;
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

        io.in(groupChatName(payload.gCi)).emit("c-gm-send", { message: payload.m, mi: messageEntity.id, gCi: payload.gCi, files: files });


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

        io.in(groupChatName(payload.gCi)).emit("c-gm-send", { mi: payload.mi, gCi: payload.gCi, files: files });

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
        const groupChat = await GroupChatEntity.findById(payload.groupChatId).lean(true);

        if (!groupChat || (groupChat.ownerId != res.locals.user._id && !groupChat.adminIds.includes(res.locals.user._id)))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChat.id });
        });

        await GroupChatUserEntity.insertMany(chatUsers);

        const socketUserDatas = [];
        const usersIdsNotFound = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                socketUser?.join(groupChatName(groupChat.id));
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user.id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
            });
        }
        io.in(groupChatName(groupChat.id)).emit("c-group-new-users",
            {
                gCi: groupChat.id,
                newUsers: socketUserDatas
            });

        //TODO: gruba fotograf koyulmasi ve grup kurulduktan sonra donen bilgiler
        // response.data = {
        //     groupChatId: groupChatEntity.id,

        response.setMessage(getMessage("groupCreatedSuccess", req.selectedLangs()));
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
        const groupChat = await GroupChatEntity.findById(payload.groupChatId).lean(true);

        if (!groupChat || groupChat.ownerId != res.locals.user._id)
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        groupChat.adminIds = groupChat.adminIds.concat(payload.userIds);
        await groupChat.save();
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
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
            });

        }
        io.in(groupChatName(groupChat.id)).emit("c-group-new-admins",
            {
                gCi: groupChat.id,
                newAdmins: socketUserDatas
            });

        //TODO: gruba fotograf koyulmasi ve grup kurulduktan sonra donen bilgiler
        // response.data = {
        //     groupChatId: groupChatEntity.id,

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
        const groupChat = await GroupChatEntity.findById(payload.groupChatId).lean(true);

        if (!groupChat || (groupChat.ownerId != res.locals.user._id && !groupChat.adminIds.includes(res.locals.user._id)))
            throw new NotValidError(getMessage("unauthorized", req.selectedLangs()));

        await GroupChatUserEntity.updateMany({ groupChatId: groupChat.id, userId: { $in: payload.userIds } }, { recordStatus: RecordStatus.Deleted });

        const socketUserDatas = [];
        const usersIdsNotFound = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                socketUser?.leave(groupChatName(groupChat.id));
                socketUserDatas.push({
                    uN: socketUser.data.user.username, //username
                    fN: socketUser.data.user.firstName, //first name
                    lN: socketUser.data.user.lastName, //last name
                    uId: socketUser.data.user.id, //user id
                    ppUrl: socketUser.data.user.profilePhotoUrl, //profile picture url
                });
            } else {
                usersIdsNotFound.push(userId);
                //TODO:offline send notification
            }
        }
        const usersNotFound = await UserEntity.find({ _id: { $in: usersIdsNotFound } }, { "username": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1 }).lean(true);
        for (let i = 0; i < usersNotFound.length; i++) {
            const user = usersNotFound[i];
            socketUserDatas.push({
                uN: user.username, //username
                fN: user.firstName, //first name
                lN: user.lastName, //last name
                uId: user.id, //user id
                ppUrl: user.profilePhotoUrl, //profile picture url
            });

        }
        io.in(groupChatName(groupChat.id)).emit("c-group-removed-users",
            {
                gCi: groupChat.id,
                removedUsers: socketUserDatas
            });

        response.setMessage(getMessage("groupUsersRemovedSuccess", req.selectedLangs()));
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