import { response } from "express";
import { _LeanDocument } from "mongoose";
import userLimits from "../../stuplus-lib/constants/userLimits";
import { GroupChatEntity, GroupChatUserEntity, UserEntity, GroupMessageEntity, NotificationEntity } from "../../stuplus-lib/entities/BaseEntity";
import { User } from "../../stuplus-lib/entities/UserEntity";
import { RecordStatus, NotificationType, GroupChatUserRole, OSNotificationType } from "../../stuplus-lib/enums/enums";
import { RedisKeyType, RedisGMOperationType } from "../../stuplus-lib/enums/enums_socket";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import MessageService from "../../stuplus-lib/services/messageService";
import OneSignalService from "../../stuplus-lib/services/oneSignalService";
import OnlineUserService from "../../stuplus-lib/services/onlineUsersService";
import RedisService from "../../stuplus-lib/services/redisService";
import { stringify } from "../../stuplus-lib/utils/general";
import { groupChatName } from "../../stuplus-lib/utils/namespaceCreators";
import { SearchGroupChatDTO } from "../dtos/SearchDTOs";
import { io } from "../socket";
import { AddToGroupChatDTO } from "../socket/dtos/Chat";

export class GroupAccess {

    public static async addUsersToGroupChat(acceptedLanguages: Array<string>, userId: any, payload: AddToGroupChatDTO, passAuth: boolean = false): Promise<string> {
        const groupChat = await GroupChatEntity.findOne({ _id: payload.groupChatId }, {
            hashTags: 0,
            hashTags_fuzzy: 0,
            titlesch: 0,
            titlesch_fuzzy: 0,
        }).lean(true);

        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", acceptedLanguages));

        if (!passAuth && groupChat.ownerId != userId &&
            !await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: userId, groupRole: GroupChatUserRole.Admin, recordStatus: RecordStatus.Active }))
            throw new NotValidError(getMessage("unauthorized", acceptedLanguages));

        const findGuardInPayloadUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInPayloadUsers != -1)
            payload.userIds.splice(findGuardInPayloadUsers, 1);

        let anyUserReachedLimit = false;
        const filteredUserIds = await UserEntity.find({ _id: { $in: payload.userIds }, "statistics.groupCount": { $lt: userLimits.TOTAL_GROUPS_PER_USER } }, { _id: 1 }).lean(true);
        if (payload.userIds.length != filteredUserIds.length)
            anyUserReachedLimit = true;
        payload.userIds = filteredUserIds.map(x => x._id.toString());

        const usernames = await UserEntity.find({ _id: { $in: payload.userIds } }, { _id: 1, username: 1 }).lean(true);
        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, username: usernames.find(x => x._id.toString() == userId)?.username, groupChatId: groupChat._id.toString(), groupRole: GroupChatUserRole.Member });
        });

        await GroupChatUserEntity.insertMany(chatUsers);
        await UserEntity.updateMany({ _id: { $in: chatUsers.map(x => x.userId) } }, { $inc: { "statistics.groupCount": 1 } })

        const addToUserGroupChatIdRedisOps = [];
        for (let i = 0; i < chatUsers.length; i++) {
            addToUserGroupChatIdRedisOps.push(RedisService.addToUserGroupChatIds(chatUsers[i].userId, chatUsers[i].groupChatId));
        }
        await Promise.all(addToUserGroupChatIdRedisOps);

        await RedisService.incrementGroupMemberCount(payload.groupChatId, chatUsers.length);

        const socketUserDatas = [];
        const usersIdsNotFound = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            const socketId = OnlineUserService.onlineUsers.get(userId);
            if (socketId) {
                const socketUser = io.sockets.sockets.get(socketId);
                if (!socketUser) continue;
                io.to(socketId).emit("cAddedToGroup", {
                    t: groupChat.title,
                    gCoIm: groupChat.coverImage,
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
        if (usersIdsNotFound.length > 0) {
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
        }

        const groupGuard = await RedisService.acquireGroupGuard();
        const notifications = [];
        for (let i = 0; i < socketUserDatas.length; i++) {
            const userData = socketUserDatas[i];
            await MessageService.sendGroupMessage({
                groupChatId: groupChat._id.toString(),
                ownerId: "62ab8a204166fd1eaebbb3fa",
                text: `${userData.uN} ${getMessage("addedToGroup", acceptedLanguages)}`,
                fromUser: groupGuard
            });
            notifications.push(new NotificationEntity({
                ownerId: userData.uId,
                relatedUserId: userId,
                type: NotificationType.AddedYouToGroupChat,
                groupChatId: groupChat._id.toString(),
            }));
        };

        await OneSignalService.sendNotificationWithUserIds({
            heading: groupChat.title,
            userIds: socketUserDatas.map(x => x.uId),
            content: `${groupChat.title} grubuna katıldın.`,
            chatId: "joinedToGroupChat",
            data: {
                type: OSNotificationType.joinedToGroupChat,
                groupChatId: groupChat._id.toString(),
            }
        })

        await NotificationEntity.insertMany(notifications);
        let responseMessage = findGuardInPayloadUsers != -1 ? getMessage("groupUsersAddedGuardSuccess", acceptedLanguages) : getMessage("groupUsersAddedSuccess", acceptedLanguages);
        if (anyUserReachedLimit)
            responseMessage += " " + getMessage("groupCreatedSomeUsersReachedLimit", acceptedLanguages);

        return responseMessage;
    }

}