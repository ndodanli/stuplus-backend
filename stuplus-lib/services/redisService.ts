import path from 'path';
import { createClient } from 'redis';
import logger from '../config/logger';
import { ChatEntity, DepartmentEntity, FacultyEntity, FollowEntity, GroupChatEntity, GroupChatUserEntity, GroupMessageEntity, SchoolEntity, UserEntity } from '../entities/BaseEntity';
import { User, UserDocument } from '../entities/UserEntity';
import { RedisGMOperationType, RedisKeyType, RedisSubKeyType } from '../enums/enums_socket';
import NotValidError from '../errors/NotValidError';
import { getMessage } from '../localization/responseMessages';
import { Document } from "mongoose";
import { RecordStatus, RedisAcquireEntityFilterOrder } from '../enums/enums';
import userLimits from '../constants/userLimits';
import { GroupChat } from '../entities/GroupChatEntity';
import { chunk, generateRandomNumber } from '../utils/general';
import { Chat } from '../entities/ChatEntity';
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// const url = process.env.REDIS_URL
let client = createClient({ url: process.env.REDIS_URL });

const initializeRedis = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            await client.connect();
            console.log("redis client created");
            await RedisService.setGroupChatMemberCounts();
            resolve(true);
        } catch (error) {
            logger.error({ err: error }, "An error occurred while connecting to redis.");
            console.error({ err: error }, "An error occurred while connecting to redis.");
            process.exit(1);
        }
    });
};

interface RedisAcquireEntityFilters {
    sort: { property: string, order: RedisAcquireEntityFilterOrder };
    limit: number;
}
export default class RedisService {
    static client = client;

    static async acquire<T>(key: string, ttl: number, func: Function): Promise<T> {
        const value = await this.client.get(key);
        if (value) {
            return JSON.parse(value) as unknown as T;
        } else {
            const result = await func();
            await this.client.set(key, JSON.stringify(result), { EX: ttl });
            return result;
        }
    }

    static async acquireHash<T>(masterKey: string, func: Function, project: string[], ttl?: number,): Promise<T> {
        const value = await this.client.hmGet(masterKey, project)
        if (value.every(x => x === null)) {
            const result: any = await func();
            const ops: any = [this.client.hSet(masterKey, result)]
            if (ttl)
                ops.push(this.client.expire(masterKey, ttl));
            await Promise.all(ops);
            if (project.length > 0) {
                for (const key in result) {
                    if (!project.includes(key))
                        delete result[key];
                }
            }
            return result;
        } else {
            let obj: { [key: string]: any } = {} as T;
            for (let i = 0; i < project.length; i++) {
                obj[project[i]] = JSON.parse(value[i]);
            }
            return obj as unknown as T;
        }
    }

    static async refreshFollowingsIfNotExists(userId: string): Promise<void> {
        if (!await RedisService.client.exists(RedisKeyType.UserFollowings + userId)) {
            const allFollowingIds = await FollowEntity.find({ followerId: userId }, { followingId: 1, _id: 0 }).lean(true);
            if (allFollowingIds.length > 0) {
                await RedisService.client.multi()
                    .sAdd(RedisKeyType.UserFollowings + userId, allFollowingIds.map(x => x.followingId))
                    .expire(RedisKeyType.UserFollowings + userId, 60 * 60 * 48)
                    .exec();
            }
        }
    }

    static async acquireUser(userId: string, project: string[]): Promise<User> {
        return await this.acquireHash<User>(RedisKeyType.User + userId, async () => {
            const user = await UserEntity.findOne({ _id: userId }, {
                username_fuzzy: 0, firstName_fuzzy: 0, lastName_fuzzy: 0, externalLogins: 0, password: 0
            }, { lean: true });

            if (!user) throw new NotValidError(getMessage("userNotFound", ["tr"]));

            const school = await SchoolEntity.findOne({ _id: user.schoolId }, { title: 1, _id: 0 });
            const faculty = await FacultyEntity.findOne({ _id: user.facultyId }, { title: 1, _id: 0 });
            const department = await DepartmentEntity.findOne({ _id: user.departmentId }, { title: 1, _id: 0 });

            if (school)
                user.schoolName = school.title;

            if (faculty)
                user.facultyName = faculty.title;

            if (department)
                user.departmentName = department.title;

            return user;
        }, project, 60 * 60 * 24);
    }

    static async acquireGroupGuard(): Promise<User> {
        return await this.acquireHash<User>(RedisKeyType.User + "62ab8a204166fd1eaebbb3fa", async () => {
            const user = await UserEntity.findOne({ _id: "62ab8a204166fd1eaebbb3fa" }, {
                username_fuzzy: 0, firstName_fuzzy: 0, lastName_fuzzy: 0, externalLogins: 0,
            }, { lean: true })

            if (!user) throw new NotValidError(getMessage("userNotFound", ["tr"]));

            const school = await SchoolEntity.findOne({ _id: user.schoolId }, { "title": 1, "_id": 0 });
            const faculty = await FacultyEntity.findOne({ _id: user.facultyId }, { "title": 1, "_id": 0 });
            const department = await DepartmentEntity.findOne({ _id: user.departmentId }, { "title": 1, "_id": 0 });

            if (school)
                user.schoolName = school.title;

            if (faculty)
                user.facultyName = faculty.title;

            if (department)
                user.departmentName = department.title;

            return user;
        }, ["_id", "username", "firstName", "lastName", "avatarKey", "profilePhotoUrl"]);
    }

    static async updateUser(user: UserDocument): Promise<void> {
        if (user instanceof UserEntity)
            user = user.toObject();
        const userId = user._id.toString();
        for (const key in user) {
            if (!["_id", "firstName", "lastName", "email", "phoneNumber", "profilePhotoUrl",
                "role", "grade", "schoolId", "facultyId", "departmentId", "isAccEmailConfirmed",
                "isSchoolEmailConfirmed", "interestIds", "avatarKey", "username", "about", "privacySettings",
                "blockedUserIds"].includes(key))
                delete user[key];
        }
        const ops: any = [this.client.hSet(RedisKeyType.User + userId, user)]
        ops.push(this.client.expire(RedisKeyType.User + userId, 60 * 60 * 24));
        await Promise.all(ops);
    }

    static async acquireAllSchools(): Promise<any[]> {
        let schools: any = await this.client.hVals(RedisKeyType.Schools).then(values => {
            return values.map(value => JSON.parse(value));
        }
        ).catch(err => {
            logger.error({ err: err }, "An error occurred while acquiring all schools.");
            console.error({ err: err }, "An error occurred while acquiring all schools.");
        });
        if (!schools || schools.length === 0) {
            schools = await SchoolEntity.find({}, {}, { lean: true });
            for (let i = 0; i < schools.length; i++) {
                const school = schools[i];
                await this.client.hSet(RedisKeyType.Schools, school._id.toString(), JSON.stringify(school));
            }
        }
        return schools;
    }

    static async acquireSingleSchool(schoolId: string): Promise<any> {
        let school: any = await this.client.hGet(RedisKeyType.Schools, schoolId).then(value => JSON.parse(value ?? "")).catch(err => {
            logger.error({ err: err }, "An error occurred while acquiring school.");
            console.error({ err: err }, "An error occurred while acquiring school.");
        });
        if (!school) {
            await this.acquireAllSchools();
            school = await this.client.hGet(RedisKeyType.Schools, schoolId).then(value => JSON.parse(value ?? "")).catch(err => {
                logger.error({ err: err }, "An error occurred while acquiring school.");
                console.error({ err: err }, "An error occurred while acquiring school.");
            });
        }
        return school;
    }

    static async updateSchools(): Promise<void> {
        await this.client.del(RedisKeyType.Schools);
    }

    static async updateInterests(): Promise<void> {
        await this.client.del(RedisKeyType.Interests + "interests");
    }

    static async acquireEntity<T extends object>(key: string, query: any, filters?: RedisAcquireEntityFilters): Promise<T> {
        let documentList = [];

        const redisValue = await this.client.lRange(key, 0, -1);
        const redisDocumentList = redisValue.map(x => JSON.parse(x).e);

        documentList = await query();

        if (redisDocumentList.length > 0) {
            for (let i = 0; i < redisDocumentList.length; i++) {
                const redisDocument = redisDocumentList[i];
                if (documentList.every((document: Document) => document._id.toString() !== redisDocument._id)) {
                    documentList.push(redisDocument);
                }
            }
            if (filters) {
                // if (filters.sort) {
                //     if (filters.sort.order === RedisAcquireEntityFilterOrder.ASC)
                //         documentList = documentList.sort((a: any, b: any) => (a[filters.sort.property] > b[filters.sort.property]) ? 1 : ((b[filters.sort.property] > a[filters.sort.property]) ? -1 : 0));
                //     else
                //         documentList = documentList.sort((a: any, b: any) => (a[filters.sort.property] < b[filters.sort.property]) ? 1 : ((b[filters.sort.property] < a[filters.sort.property]) ? -1 : 0));
                // }
                if (filters.limit) {
                    documentList = documentList.slice(0, filters.limit);
                }
            }
        }
        // await this.client.set(key, JSON.stringify(data), { EX: 60 * 120 });

        return documentList as unknown as T;
    }

    // static async setGroupChatMessageCounts(): Promise<void> {
    // if (!await this.client.hExists(RedisKeyType.AllGroupChats, "groupChatCountsSetted")) {
    // const totalGroupChatCount = await GroupChatEntity.countDocuments({});
    // const chunkSize = 500;
    // const chunkCount = Math.ceil(totalGroupChatCount / chunkSize);
    // for (let i = 0; i < chunkCount; i++) {
    //     const ops = [];
    //     const groupChatMessageCountQueries = [];
    //     const groupChats = await GroupChatEntity.find({}, { _id: 1 }, { lean: true, skip: i * chunkSize, limit: chunkSize });
    //     for (let j = 0; j < groupChats.length; j++) {
    //         const groupChat = groupChats[j];
    //         groupChatMessageCountQueries.push(GroupMessageEntity.countDocuments({ groupChatId: groupChat._id }));
    //     }
    //     if (groupChatMessageCountQueries.length > 0) {
    //         const groupChatMessageCounts = await Promise.all(groupChatMessageCountQueries);
    //         for (let j = 0; j < groupChats.length; j++) {
    //             const groupChat = groupChats[j];
    //             ops.push(this.client.hSet(RedisKeyType.AllGroupChats, groupChat._id.toString() + ":mc", groupChatMessageCounts[j]));
    //         }
    //         await Promise.all(ops);
    //     }
    // }
    // await this.client.hSet(RedisKeyType.AllGroupChats, "groupChatCountsSetted", "true");
    // }
    // }

    static async acquireUserPrivateChatIds(userId: string): Promise<string[]> {
        let ids = await this.client.sMembers(RedisKeyType.User + RedisSubKeyType.PrivateChatIds + userId);
        if (ids.length === 0) {
            const privateChats = await ChatEntity.find({
                $or: [
                    { ownerId: userId },
                    { participantId: userId }
                ]
            }).lean(true);
            if (privateChats.length > 0) {
                ids = privateChats.map(x => x._id.toString());
                await Promise.all([
                    this.client.sAdd(RedisKeyType.User + RedisSubKeyType.PrivateChatIds + userId, ids),
                    this.client.expire(RedisKeyType.User + RedisSubKeyType.PrivateChatIds + userId, 60 * 60 * 24 * 7)
                ]);
            }
        }
        return ids;
    }

    static async addToUserPrivateChatIds(userId: string, chatId: string): Promise<void> {
        await this.client.sAdd(RedisKeyType.User + RedisSubKeyType.PrivateChatIds + userId, chatId);
    }

    static async delPrivateChatIdsFromUsers(userIds: string[], chatIds: string[]): Promise<void> {
        let remOps = [];
        const userIdChunks = chunk(userIds, 500);
        for (let i = 0; i < userIdChunks.length; i++) {
            for (let j = 0; j < userIdChunks[i].length; j++) {
                remOps.push(this.client.sRem(RedisKeyType.User + RedisSubKeyType.PrivateChatIds + userIdChunks[i][j], chatIds));
            }
            await Promise.all(remOps);
            remOps = [];
        }
    }

    static async acquireUserGroupChatIds(userId: string): Promise<string[]> {
        let ids = await this.client.sMembers(RedisKeyType.User + RedisSubKeyType.GroupChatIds + userId);
        if (ids.length === 0) {
            const groupChatUsers = await GroupChatUserEntity.find({ userId: userId }, {},).lean(true);
            if (groupChatUsers.length > 0) {
                ids = groupChatUsers.map(x => x.groupChatId);
                await Promise.all([
                    this.client.sAdd(RedisKeyType.User + RedisSubKeyType.GroupChatIds + userId, ids),
                    this.client.expire(RedisKeyType.User + RedisSubKeyType.GroupChatIds + userId, 60 * 60 * 24 * 7)
                ]);
            }
        }
        return ids;
    }

    static async isUserInGroupChat(userId: string, groupChatId: string): Promise<boolean> {
        return await this.client.sIsMember(RedisKeyType.User + RedisSubKeyType.GroupChatIds + userId, groupChatId);
    }

    static async addToUserGroupChatIds(userId: string, groupChatId: string): Promise<void> {
        await this.client.sAdd(RedisKeyType.User + RedisSubKeyType.GroupChatIds + userId, groupChatId);
    }

    static async delGroupChatIdsFromUsers(userIds: string[], groupChatIds: string[]): Promise<void> {
        let remOps = [];
        const userIdChunks = chunk(userIds, 500);
        for (let i = 0; i < userIdChunks.length; i++) {
            for (let j = 0; j < userIdChunks[i].length; j++) {
                remOps.push(this.client.sRem(RedisKeyType.User + RedisSubKeyType.GroupChatIds + userIdChunks[i][j], groupChatIds));
            }
            await Promise.all(remOps);
            remOps = [];
        }
    }

    // static async setGroupChats(): Promise<void> {
    // if (!await this.client.exists(RedisKeyType.AllGroupChats)) {
    //     const redisGMs: any = [];
    //     let lastMessageUserIds: string[] = [];
    //     const notFoundLastMessageChatIds: string[] = [];
    //     const totalGroupChatCount = await GroupChatEntity.countDocuments({});
    //     const chunkSize = 1000;
    //     const chunkCount = Math.ceil(totalGroupChatCount / chunkSize);
    //     for (let i = 0; i < chunkCount; i++) {
    //         const groupChatChunkQuery = GroupChatEntity.find({}, { titlesch_fuzzy: 0, hashTags_fuzzy: 0, __t: 0, __v: 0, createdAt: 0, updatedAt: 0, recordStatus: 0 })
    //             .sort({ _id: -1 }).skip(i * chunkSize).limit(chunkSize).lean(true).allowDiskUse(true);
    //         const groupChatChunk = await groupChatChunkQuery;
    //         for (let k = 0; k < groupChatChunk.length; k++) {
    //             const groupChat = groupChatChunk[k];
    //             const redisGMAll = await RedisService.client.hVals(RedisKeyType.DBGroupMessage + groupChat._id.toString());
    //             for (let i = 0; i < redisGMAll.length; i++) {
    //                 const chatData = JSON.parse(redisGMAll[i]);
    //                 if (chatData.t == RedisGMOperationType.InsertMessage)
    //                     redisGMs.push(chatData.e);
    //             }

    //             const lastMessage = redisGMs.length ?
    //                 redisGMs[redisGMs.length - 1] : null;

    //             if (lastMessage) {
    //                 const owner = await UserEntity.findOne({ _id: lastMessage.ownerId }, { _id: 1, username: 1, avatarKey: 1, profilePhotoUrl: 1, firstName: 1, lastName: 1 }).lean(true);
    //                 if (owner)
    //                     lastMessage.owner = {
    //                         _id: owner._id,
    //                         username: owner.username,
    //                         avatarKey: owner.avatarKey,
    //                         profilePhotoUrl: owner.profilePhotoUrl,
    //                         firstName: owner.firstName,
    //                         lastName: owner.lastName
    //                     }
    //                 groupChat.lastMessage = lastMessage;
    //                 await this.client.hSet(RedisKeyType.AllGroupChats, groupChat._id.toString() + ":lm", JSON.stringify(lastMessage));
    //             }
    //             else
    //                 notFoundLastMessageChatIds.push(groupChat._id.toString());

    //             await this.client.hSet(RedisKeyType.AllGroupChats, groupChat._id.toString(), JSON.stringify(groupChat));
    //         }
    //         const notFoundLastMessages: any = await GroupMessageEntity.aggregate([
    //             { $match: { groupChatId: { $in: notFoundLastMessageChatIds }, recordStatus: RecordStatus.Active } },
    //             { $sort: { createdAt: -1 } },
    //             {
    //                 $group: {
    //                     _id: "$groupChatId",
    //                     ownerId: { $first: "$ownerId" },
    //                     text: { $first: "$text" },
    //                     files: { $first: "$files" },
    //                     replyToId: { $first: "$replyToId" },
    //                     entityId: { $first: "$_id" },
    //                 }
    //             }
    //         ]);
    //         lastMessageUserIds = notFoundLastMessages.map((x: { ownerId: string; }) => x.ownerId);

    //         const lastMessageUsers = await UserEntity.find({ _id: { $in: [...new Set(lastMessageUserIds)] } }, {
    //             _id: 1, username: 1, firstName: 1, lastName: 1,
    //             avatarKey: 1, profilePhotoUrl: 1
    //         }).lean(true);
    //         if (lastMessageUsers.length > 0) {
    //             for (let j = 0; j < groupChatChunk.length; j++) {
    //                 const gmChat = groupChatChunk[j];
    //                 if (!gmChat.lastMessage) {
    //                     const lastMessage = notFoundLastMessages.find((x: { _id: any; }) => x._id.toString() === gmChat._id.toString());
    //                     if (lastMessage) {
    //                         gmChat.lastMessage = {
    //                             _id: lastMessage.entityId.toString(),
    //                             ownerId: lastMessage.ownerId,
    //                             text: lastMessage.text,
    //                             files: lastMessage.files,
    //                             replyToId: lastMessage.replyToId,
    //                             groupChatId: lastMessage._id
    //                         }
    //                         const lastMessageUser = lastMessageUsers.find(x => x._id.toString() === gmChat.lastMessage?.ownerId.toString());
    //                         if (gmChat.lastMessage) {
    //                             if (lastMessageUser)
    //                                 gmChat.lastMessage.owner = {
    //                                     _id: lastMessageUser._id,
    //                                     username: lastMessageUser.username,
    //                                     avatarKey: lastMessageUser.avatarKey,
    //                                     profilePhotoUrl: lastMessageUser.profilePhotoUrl,
    //                                     firstName: lastMessageUser.firstName,
    //                                     lastName: lastMessageUser.lastName
    //                                 };
    //                             await this.client.hSet(RedisKeyType.AllGroupChats, gmChat._id.toString() + ":lm", JSON.stringify(gmChat.lastMessage));
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }
    // }

    static async addPrivateChat(privateChat: Chat): Promise<void> {
        const privateChatId = privateChat._id.toString();
        this.client.hSet(RedisKeyType.AllPrivateChats, privateChatId, JSON.stringify(
            { _id: privateChatId, ownerId: privateChat.ownerId, participantId: privateChat.participantId }
        ));
    }

    static async updatePrivateChatLastMessage(chatLM: any, chatId: string): Promise<void> {
        this.client.hSet(RedisKeyType.AllPrivateChats, chatId + ":lm", JSON.stringify({
            text: chatLM.text,
            files: chatLM.files,
            owner: {
                _id: chatLM.owner._id,
                username: chatLM.owner.username,
            },
            createdAt: chatLM.createdAt,
        }))
    }

    static async addGroupChat(groupChat: GroupChat): Promise<void> {
        const groupChatId = groupChat._id.toString();
        this.client.hSet(RedisKeyType.AllGroupChats, groupChatId, JSON.stringify(
            { _id: groupChatId, title: groupChat.title, coverImageUrl: groupChat.coverImageUrl }
        ));
    }

    static async updateGroupChatLastMessage(groupChatLM: any, groupChatId: string): Promise<void> {
        this.client.hSet(RedisKeyType.AllGroupChats, groupChatId + ":lm", JSON.stringify({
            text: groupChatLM.text,
            files: groupChatLM.files,
            owner: {
                _id: groupChatLM.owner._id,
                username: groupChatLM.owner.username,
            },
            createdAt: groupChatLM.createdAt
        }))
    }

    static async incrementGroupChatMessageCount(groupChatId: string): Promise<void> {
        await this.client.hIncrBy(RedisKeyType.AllGroupChats, groupChatId + ":mc", 1);
    }

    static async incrementGroupMemberCount(groupChatId: string, count: number = 1): Promise<void> {
        await this.client.hIncrBy(RedisKeyType.AllGroupChatMemberCounts, groupChatId, count);
    }

    static async decrementGroupMemberCount(groupChatId: string, count: number = 1): Promise<void> {
        await this.client.hIncrBy(RedisKeyType.AllGroupChatMemberCounts, groupChatId, -1 * count);
    }

    static async isDailyLikeLimitExceeded(userId: string): Promise<boolean> {
        return await this.client.get(RedisKeyType.DailyLikeLimit + userId).then(x => parseInt(x ?? "0")) >= userLimits.MAX_LIKE_PER_DAY;
    }

    static async isDailyCommentLimitExceeded(userId: string): Promise<boolean> {
        return await this.client.get(RedisKeyType.DailyCommentLimit + userId).then(x => parseInt(x ?? "0")) >= userLimits.MAX_COMMENT_PER_DAY;
    }

    static async isDailyNewPMLimitExceeded(userId: string): Promise<boolean> {
        return await this.client.get(RedisKeyType.DailyNewPMLimit + userId).then(x => parseInt(x ?? "0")) >= userLimits.MAX_NEW_PM_PER_DAY;
    }

    static async isDailyFollowLimitExceeded(userId: string): Promise<boolean> {
        return await this.client.get(RedisKeyType.DailyFollowLimit + userId).then(x => parseInt(x ?? "0")) >= userLimits.MAX_FOLLOW_PER_DAY;
    }

    static async incrementDailyCommentCount(userId: string): Promise<void> {
        await this.client.incr(RedisKeyType.DailyCommentLimit + userId);
    }

    static async incrementDailyLikeCount(userId: string): Promise<void> {
        await this.client.incr(RedisKeyType.DailyLikeLimit + userId);
    }

    static async incrementDailyNewPMCount(userId: string): Promise<void> {
        await this.client.incr(RedisKeyType.DailyNewPMLimit + userId);
    }

    static async incrementDailyFollowCount(userId: string): Promise<void> {
        await this.client.incr(RedisKeyType.DailyFollowLimit + userId);
    }

    // static async acquireGroupsMemberCounts(groupIds: string[]): Promise<any> {
    // const ops = [];
    // const missingGroupChatIdsForMemberCounts = [];
    // const results = await this.client.smIsMember(RedisKeyType.GroupChatMemberCountInfo, groupIds);
    // for (let i = 0; i < results.length; i++) {
    //     if (!results[i]) {
    //         missingGroupChatIdsForMemberCounts.push(groupIds[i]);
    //     }
    // }
    // if (missingGroupChatIdsForMemberCounts.length > 0) {
    //     let groupChatMemberCounts: any = await GroupChatUserEntity.aggregate([
    //         { "$match": { groupChatId: { $in: missingGroupChatIdsForMemberCounts } } },
    //         { "$group": { _id: "$groupChatId", count: { $sum: 1 } } },
    //     ]);
    //     for (let i = 0; i < groupChatMemberCounts.length; i++) {
    //         await this.incrementGroupMemberCount(groupChatMemberCounts[i]._id, groupChatMemberCounts[i].count);
    //         await this.client.sAdd(RedisKeyType.GroupChatMemberCountInfo, groupChatMemberCounts[i]._id);
    //     }
    // }
    // const groupChatMemberCounts = await this.client.hmGet(RedisKeyType.GroupChatMemberCountInfo, groupIds);
    // }

    static async setGroupChatMemberCounts() {
        if (!await this.client.exists(RedisKeyType.AllGroupChatMemberCounts)) {
            const totalGroupChatCount = await GroupChatEntity.countDocuments();
            const chunkSize = 5000;
            const chunkCount = Math.ceil(totalGroupChatCount / chunkSize);
            for (let i = 0; i < chunkCount; i++) {
                const groupChats = await GroupChatEntity.find({}, { _id: 1 }).skip(i * chunkSize).limit(chunkSize);
                const groupChatIds: any = groupChats.map(x => x._id.toString());
                let groupChatMemberCounts: any = await GroupChatUserEntity.aggregate([
                    { "$match": { groupChatId: { $in: groupChatIds } } },
                    { "$group": { _id: "$groupChatId", count: { $sum: 1 } } },
                ]);
                for (let i = 0; i < groupChatMemberCounts.length; i++) {
                    await this.incrementGroupMemberCount(groupChatMemberCounts[i]._id, groupChatMemberCounts[i].count);
                }
            }
        }
    }

    static async acquireGroupsMemberCounts(groupIds: string[]): Promise<any> {
        const counts: any = await this.client.hmGet(RedisKeyType.AllGroupChatMemberCounts, groupIds);
        const missingGroupChatIdsForMemberCounts = [];
        for (let i = 0; i < counts.length; i++) {
            if (!counts[i]) {
                counts[i] = -1;
                missingGroupChatIdsForMemberCounts.push({ groupId: groupIds[i], index: i });
            } else {
                counts[i] = parseInt(counts[i]);
            }
        }
        if (missingGroupChatIdsForMemberCounts.length > 0) {
            let groupChatMemberCounts: any = await GroupChatUserEntity.aggregate([
                { "$match": { groupChatId: { $in: missingGroupChatIdsForMemberCounts.map(x => x.groupId) } } },
                { "$group": { _id: "$groupChatId", count: { $sum: 1 } } },
            ]);
            for (let i = 0; i < groupChatMemberCounts.length; i++) {
                await this.incrementGroupMemberCount(groupChatMemberCounts[i]._id, groupChatMemberCounts[i].count);
                const index = missingGroupChatIdsForMemberCounts.find(x => x.groupId === groupChatMemberCounts[i]._id)?.index;
                if (index)
                    counts[index] = groupChatMemberCounts[i].count;
            }
        }
        return counts;
    }
}

export {
    initializeRedis
}