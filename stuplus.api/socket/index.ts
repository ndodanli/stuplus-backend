import ISocket from "./interfaces/socket";
import { ChatEntity, GroupMessageForwardEntity, GroupMessageEntity, GroupMessageReadEntity, MessageEntity, UserEntity, GroupChatEntity, GroupChatUserEntity } from "../../stuplus-lib/entities/BaseEntity";
import "../../stuplus-lib/extensions/extensionMethods"
require("dotenv").config();
import { RedisGroupMessageDTO, RedisGroupMessageForwardReadDTO, RedisMessageDTO, RedisMessageForwardReadDTO } from "./dtos/RedisChat";
import { RedisPMOperationType, RedisKeyType, RedisGMOperationType, Role, WatchRoomTypes } from "../../stuplus-lib/enums/enums_socket";
import { authorize, authorizeSocket } from "./utils/auth";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { CreateGroupDTO, GetChatMessagesDTO, WatchUsersDTO } from "./dtos/Chat";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { groupChatName, userWatchRoomName } from "../../stuplus-lib/utils/namespaceCreators";
import RedisService from "../../stuplus-lib/services/redisService";
import { httpServer } from "../server";
import { stringify } from "../../stuplus-lib/utils/general";
import { MessageDocument } from "../../stuplus-lib/entities/MessageEntity";
import { RecordStatus } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { Router } from "express";
import { uploadSingleFileS3 } from "../../stuplus-lib/services/fileService";
const router = Router();
let onlineUsers: Map<string, string>;
setup();
async function setup() {
    onlineUsers = new Map<string, string>();
};

const io = require("socket.io")(httpServer, {
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
    const user = await UserEntity.findOne({ _id: decodedJwtUser["_id"] }, {
        "_id": 0, "__t": 0, "blockedUserIds": 1, "firstName": 1, "lastName": 1, "profilePhotoUrl": 1
    }, { lean: true });
    if (!user) {
        socket.disconnect();
        return;
    }
    onlineUsers.set(decodedJwtUser["_id"], socket.id);
    user.id = decodedJwtUser["_id"];
    socket.data.user = user;

    const groupChats = await GroupChatUserEntity.find({ userId: decodedJwtUser["_id"] }, {
        "_id": 0, "groupChatId": 1
    }, { lean: true });

    for (let i = 0; i < groupChats.length; i++) {
        socket.join(groupChatName(groupChats[i].groupChatId));
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

            let responseData: any = { success: true };

            if (!data.ci) {
                const chatEntity = await ChatEntity.findOneAndUpdate(
                    { ownerId: socket.data.user.id, participantId: data.to },
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
                    from: socket.data.user.id,
                    message: data.m,
                    chatId: data.ci,
                    createdAt: now,
                    updatedAt: now,
                }, t: RedisPMOperationType.InsertMessage
            }

            responseData["mi"] = messageEntity.id;

            await RedisService.client.rPush(RedisKeyType.DBPrivateMessage + data.ci, stringify(chatData));

            io.to(data.to).emit("c-pm-send", { m: data.m, mi: messageEntity.id, ci: data.ci });

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
            const now = new Date();
            const gMessageEntity = new GroupMessageEntity({});
            const chatData: object = {
                e: {
                    _id: gMessageEntity.id, from: socket.data.user.id, message: data.m, groupChatId: data.gCi,
                    createdAt: now,
                    updatedAt: now,
                },
                t: RedisGMOperationType.InsertMessage
            }

            await RedisService.client.rPush(RedisKeyType.DBGroupMessage + data.gCi, stringify(chatData));

            io.to(groupChatName(data.gCi)).emit("c-gm-send", { m: data.m, mi: gMessageEntity.id, gCi: data.gCi, fId: socket.data.user.id });

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

            io.to(groupChatName(data.gCi)).emit("c-gm-forwarded",
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

            io.to(groupChatName(data.gCi)).emit("c-gm-readed",
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

router.post("/createGroup", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<CreateGroupDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        //TODO: check if users who added can be added to group
        const payload = new CreateGroupDTO(req.body);
        const groupChatEntity = await GroupChatEntity.create({ title: payload.title, ownerId: res.locals.user._id, type: payload.type });
        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChatEntity.id });
        });
        await GroupChatUserEntity.insertMany(chatUsers);
        const socketUserDatas = [];
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
                //TODO:offline send notification
            }
        }
        io.in(groupChatName(groupChatEntity.id)).emit("c-group-created",
            {
                t: groupChatEntity.title,
                gCi: groupChatEntity.id,
                gUsers: socketUserDatas
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

router.get("/getMessages", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<GetChatMessagesDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const payload = new GetChatMessagesDTO(req.query);
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
            for (let i = 0; i < redisMessages.length; i++) {
                const rM = redisMessages[i];
                const forwarded = forwards.find(x => x._id == rM._id);
                rM.forwarded = forwarded ? true : false;
                if (rM.forwarded)
                    rM.forwardedAt = forwarded.createdAt;

                const readed = reads.find(x => x._id == rM._id);
                rM.readed = readed ? true : false;
                if (rM.readed)
                    rM.readedAt = readed.createdAt;
            }
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

            for (let i = 0; i < newMessages.length; i++) {
                const newM = newMessages[i];
                const forwarded = forwards.find(x => x._id == newM._id.toString());
                newM.forwarded = forwarded ? true : false;
                if (newM.forwarded)
                    newM.forwardedAt = forwarded.createdAt;

                const readed = reads.find(x => x._id == newM._id.toString());
                newM.readed = readed ? true : false;
                if (newM.readed)
                    newM.readedAt = readed.createdAt;
                messages.push(newM);
            }

        } else {
            messages = await MessageEntity.find({
                chatId: payload.chatId,
                createdAt: { $lt: payload.lastRecordDate }
            }).sort({ createdAt: -1 }).limit(payload.take).lean(true);
            for (let i = 0; i < messages.length; i++) {
                const m = messages[i];
                const forwarded = forwards.find(x => x._id == m._id.toString());
                m.forwarded = forwarded ? true : false;
                if (m.forwarded)
                    m.forwardedAt = forwarded.createdAt;

                const readed = reads.find(x => x._id == m._id.toString());
                m.readed = readed ? true : false;
                if (m.readed)
                    m.readedAt = readed.createdAt;
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


router.post("/sendFileMessage", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadSingleFileS3.array("files", [".png", ".jpg", ".jpeg", ".svg"], 20, "profile_images/", 5242880), async (req: CustomRequest<GetChatMessagesDTO>, res: any) => {
    /* #swagger.tags = ['Chat']
       #swagger.description = 'Send file message.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                             files: {
                                 type: "array",
                                    items: {
                                        type: "string",
                                        format: "binary"
                                    },
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

    const response = new BaseResponse<object>();
    try {
        const payload = new GetChatMessagesDTO(req.query);

    }
    catch (err: any) {
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