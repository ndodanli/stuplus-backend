import ISocket from "./interfaces/socket";
import { ChatEntity, GroupMessageForwardEntity, GroupMessageEntity, GroupMessageReadEntity, MessageEntity, UserEntity, GroupChatEntity, GroupChatUserEntity } from "../../stuplus-lib/entities/BaseEntity";
import "../../stuplus-lib/extensions/extensionMethods"
require("dotenv").config();
import cors from 'cors';
import { RedisGroupMessageDTO, RedisGroupMessageForwardReadDTO, RedisMessageDTO, RedisMessageForwardReadDTO } from "./dtos/RedisChat";
import { RedisPMOperationType, RedisKeyType, RedisGMOperationType, Role, WatchRoomTypes } from "../../stuplus-lib/enums/enums_socket";
import CronService from "../../cron/cronService";
import { authorize, authorizeSocket } from "./utils/auth";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import customExtensions from "../../stuplus-lib/extensions/extensions";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { CreateGroupDTO, WatchUsersDTO } from "./dtos/Chat";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import bodyParser from "body-parser";
import { groupChatName, userWatchRoomName } from "../../stuplus-lib/utils/namespaceCreators";
import RedisService from "../../stuplus-lib/services/redisService";
import { httpServer, app } from "../server";
import { stringify } from "../../stuplus-lib/utils/general";
app.use(customExtensions())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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
        "_id": 0, "__t": 0, "blockedUserIds": 1, "firstName": 1, "lastName": 1
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
                    { ownerId: socket.data.user.id, participant: data.to },
                    { $setOnInsert: { ownerId: socket.data.user.id, participant: data.to } },
                    { upsert: true, new: true });
                data.ci = chatEntity.id; //may be null, catch it later
                responseData["ci"] = data.ci;
            }
            const now = new Date();
            const messageEntity = new MessageEntity({});
            const chatData: object = {
                e: {
                    _id: messageEntity.id, from: socket.data.user.id, message: data.m, chatId: data.ci,
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

app.get("/", (req: any, res: any, next: any) => {
    const count = io.engine.clientsCount;
    // may or may not be similar to the count of Socket instances in the main namespace, depending on your usage
    const count2 = io.of("/").sockets.size;
    return res.status(200).send({
        count,
        count2
    });
});

app.post("/chat/createGroup", authorize([Role.User, Role.Admin]), async (req: CustomRequest<CreateGroupDTO>, res: any, next: any) => {
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

// app.get("/chat/getMessages", authorize([Role.User, Role.Admin]), async (req: CustomRequest<GetGroupChatsDTO>, res: any, next: any) => {
//     const response = new BaseResponse<object>();
//     try {
//         const payload = new GetGroupChatsDTO(req.query);
//     }
//     catch (err: any) {
//         response.setErrorMessage(err.message);

//         if (err.status != 200)
//             return InternalError(res, response);
//     }

//     return Ok(res, response);
// });

export {
    io
}