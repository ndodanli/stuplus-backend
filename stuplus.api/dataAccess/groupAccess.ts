import { response } from "express";
import { _LeanDocument } from "mongoose";
import { GroupChatEntity, GroupChatUserEntity, UserEntity, GroupMessageEntity, NotificationEntity } from "../../stuplus-lib/entities/BaseEntity";
import { User } from "../../stuplus-lib/entities/UserEntity";
import { RecordStatus, NotificationType, GroupChatUserRole } from "../../stuplus-lib/enums/enums";
import { RedisKeyType, RedisGMOperationType } from "../../stuplus-lib/enums/enums_socket";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import MessageService from "../../stuplus-lib/services/messageService";
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
            title_fuzzy: 0,
        }).lean(true);

        if (!groupChat)
            throw new NotValidError(getMessage("groupChatNotFound", acceptedLanguages));

        if (!passAuth && groupChat.ownerId != userId &&
            !await GroupChatUserEntity.exists({ groupChatId: payload.groupChatId, userId: userId, groupRole: GroupChatUserRole.Admin, recordStatus: RecordStatus.Active }))
            throw new NotValidError(getMessage("unauthorized", acceptedLanguages));

        const findGuardInPayloadUsers = payload.userIds.findIndex(userId => userId == "62ab8a204166fd1eaebbb3fa");
        if (findGuardInPayloadUsers != -1)
            payload.userIds.splice(findGuardInPayloadUsers, 1);

        let chatUsers = payload.userIds.map((userId: string) => {
            return new GroupChatUserEntity({ userId: userId, groupChatId: groupChat._id.toString(), groupRole: GroupChatUserRole.Member });
        });

        await GroupChatUserEntity.insertMany(chatUsers);

        const socketUserDatas = [];
        const usersIdsNotFound = [];
        for (let i = 0; i < payload.userIds.length; i++) {
            const userId = payload.userIds[i];
            await RedisService.delGroupChatIdsFromUser(userId);
            const socketId = OnlineUserService.onlineUsers.get(userId);
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

        const groupGuard = await RedisService.acquireUser("62ab8a204166fd1eaebbb3fa")
        const notifications = [];
        for (let i = 0; i < socketUserDatas.length; i++) {
            const userData = socketUserDatas[i];
            await MessageService.senGroupMessage({
                groupChatId: groupChat._id.toString(),
                fromId: "62ab8a204166fd1eaebbb3fa",
                text: `${userData.uN} ${getMessage("addedToGroup", acceptedLanguages)}`,
                fromUser: groupGuard
            })
            notifications.push(new NotificationEntity({
                ownerId: userData.uId,
                relatedUserId: userId,
                type: NotificationType.AddedYouToGroupChat,
                groupChatId: groupChat._id.toString(),
            }));
        }
        await NotificationEntity.insertMany(notifications);

        if (findGuardInPayloadUsers != -1)
            return getMessage("groupUsersAddedGuardSuccess", acceptedLanguages);
        else
            return getMessage("groupUsersAddedSuccess", acceptedLanguages);
    }

}