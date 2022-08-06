import { _LeanDocument } from "mongoose";
import { Announcement } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AnnouncementEntity, DepartmentEntity, GroupChatEntity, HashtagEntity, QuestionEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { GroupChat } from "../../stuplus-lib/entities/GroupChatEntity";
import { Hashtag } from "../../stuplus-lib/entities/HashtagEntity";
import { Question } from "../../stuplus-lib/entities/QuestionEntity";
import { User, UserDocument } from "../../stuplus-lib/entities/UserEntity";
import { UserProfileStatus } from "../../stuplus-lib/enums/enums";
import { GroupChatType, RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";
import { searchable, searchableWithSpaces } from "../../stuplus-lib/utils/general";
import { SearchGroupChatDTO } from "../dtos/SearchDTOs";
import { SchoolAccess } from "./schoolAccess";

export class SearchAccess {
    public static async getSearchedAnnouncements(userId: any, payload: SearchGroupChatDTO): Promise<Announcement[]> {
        let announcementQuery;
        const searchableST = searchableWithSpaces(payload.searchTerm);
        if (searchableST.length > 3) {
            announcementQuery = AnnouncementEntity.fuzzySearch(searchableST).allowDiskUse(true);
        } else {
            announcementQuery = AnnouncementEntity.find({
                $or: [
                    { titlesch: { $regex: searchableST, $options: "i" } },
                    { text: { $regex: payload.searchTerm, $options: "i" } },
                    { hashTags: { $regex: searchableST, $options: "i" } }
                ]
            });
        }
        const announcements = await announcementQuery
            .sort({ _id: -1 })
            .select({ hashTags_fuzzy: 0, titlesch_fuzzy: 0 })
            .skip(payload.skip)
            .limit(payload.pageSize)
            .lean(true) as Announcement[];

        return announcements;
    }

    public static async getSearchedQuestions(userId: any, payload: SearchGroupChatDTO): Promise<Question[]> {
        let questionQuery;
        const searchableST = searchableWithSpaces(payload.searchTerm);
        if (searchableST.length > 3) {
            questionQuery = QuestionEntity.fuzzySearch(searchableST).allowDiskUse(true);
        } else {
            questionQuery = QuestionEntity.find({
                $or: [
                    { titlesch: { $regex: searchableST, $options: "i" } },
                    { text: { $regex: payload.searchTerm, $options: "i" } },
                    { hashTags: { $regex: searchableST, $options: "i" } }
                ]
            });
        }
        const questions = await questionQuery
            .sort({ _id: -1 })
            .select({ hashTags_fuzzy: 0, titlesch_fuzzy: 0 })
            .skip(payload.skip)
            .limit(payload.pageSize)
            .lean(true) as Question[];

        return questions;
    }

    public static async getSearchedUsers(userId: any, payload: SearchGroupChatDTO): Promise<User[]> {
        let usersQuery;
        const searchableST = searchableWithSpaces(payload.searchTerm);
        if (searchableST.length > 2) {
            usersQuery = UserEntity.fuzzySearch(searchableST).allowDiskUse(true);
        } else {
            usersQuery = UserEntity.find({
                $or: [
                    { username: { $regex: payload.searchTerm, $options: "i" } },
                    { firstName: { $regex: payload.searchTerm, $options: "i" } },
                    { lastName: { $regex: payload.searchTerm, $options: "i" } }
                ]
            });
        }
        //TODO: add school relation to sort(schoolId)
        const users = await usersQuery
            .sort({ popularity: -1, lastSeenDate: -1 })
            .select({ username: 1, firstName: 1, lastName: 1, profilePhotoUrl: 1, avatarKey: 1 })
            .skip(payload.skip)
            .limit(payload.pageSize)
            .lean(true) as User[];

        return users;
    }

    public static async getSearchedGroupChats(userId: any, payload: SearchGroupChatDTO): Promise<GroupChat[]> {
        let groupChatsQuery;
        const searchableST = searchableWithSpaces(payload.searchTerm);
        if (searchableST.length > 2) {
            groupChatsQuery = GroupChatEntity.fuzzySearch(searchableST).allowDiskUse(true);
        } else {
            groupChatsQuery = GroupChatEntity.find({
                type: GroupChatType.Public,
                $or: [
                    { titlesch: { $regex: searchableST, $options: "i" } },
                    { hashTags: { $regex: searchableST, $options: "i" } },
                ]
            });
        }
        //TODO: add school relation to sort(schoolId)

        const groupChats = await groupChatsQuery
            .sort({ popularity: -1 })
            .select({ title: 1, type: 1, about: 1, coverImageUrl: 1, hashTags: 1, schoolId: 1, departmentId: 1, grade: 1 })
            .skip(payload.skip)
            .limit(payload.pageSize)
            .lean(true) as GroupChat[];

        const requiredDepartmentIds = groupChats.map(group => group.departmentId);

        const schools = await SchoolAccess.getAllSchools();
        const departments = await DepartmentEntity.find({ _id: { $in: requiredDepartmentIds } }).lean(true);

        for (let i = 0; i < groupChats.length; i++) {
            const group = groupChats[i];
            group.school = schools.find(school => school._id == group.schoolId);
            group.department = departments.find(department => department._id == group.departmentId);
        }

        return groupChats;
    }

    public static async getSearchedTags(userId: any, payload: SearchGroupChatDTO): Promise<Hashtag[]> {
        let hashTagQuery = HashtagEntity.find({ tag: { $regex: searchable(payload.searchTerm), $options: "i" } });
        //TODO: add school relation to sort(schoolId)
        const hashTags = await hashTagQuery
            .sort({ overallPopularity: -1 })
            .skip(payload.skip)
            .limit(payload.pageSize)
            .lean(true) as Hashtag[];

        return hashTags;
    }

    public static async getAccountSuggestions(currentUserId: string, relatedUserId?: string | null, relatedUser?: User | null): Promise<User[]> {
        const rUser: User = relatedUser ?
            relatedUser :
            await UserEntity.findOne({ _id: relatedUserId }, { schoolId: 1, departmentId: 1, grade: 1 }).lean(true);

        if (!rUser || !rUser.schoolId)
            return [];

        const suggestionLimit = 25;
        const queryLimit = 50;
        let queryLimitReached = true;
        // const nearSchools = await SchoolEntity.find({ cityId: userSchool.cityId }, { _id: 1 }).lean(true);
        let users: User[] = [];
        await RedisService.refreshFollowingsIfNotExists(rUser._id.toString());
        users = await UserEntity.find({
            "privacySettings.profileStatus": UserProfileStatus.Public,
            schoolId: rUser.schoolId,
            departmentId: rUser.departmentId,
            grade: rUser.grade,
        }, {
            _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
        })
            .sort({ _id: -1, popularity: -1, lastSeenDate: -1 })
            .limit(queryLimit)
            .lean(true);
        if (users.length > 0) {
            let lastUserId: Date = users[users.length - 1]._id;
            const userIds = users.map(user => user._id.toString());
            const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, userIds);
            //delete users that are already followed
            if (users.length < queryLimit)
                queryLimitReached = false;
            for (let i = 0; i < users.length; i++) {
                if (redisFollows[i]) {
                    users.splice(i, 1);
                    i--;
                }
            }
            if (queryLimitReached)
                while (users.length < suggestionLimit) {
                    let secondQueryUsers = await UserEntity.find({
                        "privacySettings.profileStatus": UserProfileStatus.Public,
                        schoolId: rUser.schoolId,
                        departmentId: rUser.departmentId,
                        grade: rUser.grade,
                        _id: { $lt: lastUserId },
                    }, {
                        _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
                    })
                        .sort({ _id: -1, popularity: -1, lastSeenDate: -1 })
                        .limit(queryLimit)
                        .lean(true);
                    if (secondQueryUsers.length === 0)
                        break;
                    lastUserId = secondQueryUsers[secondQueryUsers.length - 1]._id;
                    const secondUserIds = secondQueryUsers.map(user => user._id.toString());
                    const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, secondUserIds);
                    //delete users that are already followed
                    for (let i = 0; i < secondQueryUsers.length; i++) {
                        if (redisFollows[i]) {
                            secondQueryUsers.splice(i, 1);
                            i--;
                        }
                    }
                    users = users.concat(secondQueryUsers);
                }
        }
        const firstFoundedUserIds = users.map(user => user._id);
        if (users.length < suggestionLimit) {
            let usersWithSameDepartment = await UserEntity.find({
                "privacySettings.profileStatus": UserProfileStatus.Public,
                _id: { $nin: firstFoundedUserIds },
                schoolId: rUser.schoolId,
                departmentId: rUser.departmentId,
            }, {
                _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
            })
                .sort({ _id: -1, popularity: -1, lastSeenDate: -1 })
                .limit(queryLimit)
                .lean(true);
            if (usersWithSameDepartment.length > 0) {
                let lastUserId: Date = usersWithSameDepartment[usersWithSameDepartment.length - 1]._id;
                const userIds = usersWithSameDepartment.map(user => user._id.toString());
                const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, userIds);
                if (usersWithSameDepartment.length < queryLimit)
                    queryLimitReached = false;
                //delete users that are already followed
                for (let i = 0; i < usersWithSameDepartment.length; i++) {
                    if (redisFollows[i]) {
                        usersWithSameDepartment.splice(i, 1);
                        i--;
                    }
                }
                users = users.concat(usersWithSameDepartment);
                if (queryLimitReached)
                    while (users.length < suggestionLimit) {
                        let secondQueryUsers = await UserEntity.find({
                            "privacySettings.profileStatus": UserProfileStatus.Public,
                            _id: { $nin: firstFoundedUserIds, $lt: lastUserId },
                            schoolId: rUser.schoolId,
                            departmentId: rUser.departmentId,
                        }, {
                            _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
                        })
                            .sort({ _id: -1, popularity: -1, lastSeenDate: -1 })
                            .limit(queryLimit)
                            .lean(true);
                        if (secondQueryUsers.length === 0)
                            break;
                        lastUserId = secondQueryUsers[secondQueryUsers.length - 1]._id;
                        const secondUserIds = secondQueryUsers.map(user => user._id.toString());
                        const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, secondUserIds);
                        //delete users that are already followed
                        for (let i = 0; i < secondQueryUsers.length; i++) {
                            if (redisFollows[i]) {
                                secondQueryUsers.splice(i, 1);
                                i--;
                            }
                        }
                        users = users.concat(secondQueryUsers);
                    }
            }
        }
        const secondFoundedUserIds = users.map(user => user._id);
        if (users.length < suggestionLimit) {
            let usersWithSameSchool = await UserEntity.find({
                "privacySettings.profileStatus": UserProfileStatus.Public,
                _id: { $nin: secondFoundedUserIds },
                schoolId: rUser.schoolId,
            }, {
                _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
            })
                .sort({ _id: -1, popularity: -1, lastSeenDate: -1 })
                .limit(queryLimit)
                .lean(true);
            if (usersWithSameSchool.length > 0) {
                let lastUserId: Date = usersWithSameSchool[usersWithSameSchool.length - 1]._id;
                const userIds = usersWithSameSchool.map(user => user._id.toString());
                const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, userIds);
                if (usersWithSameSchool.length < queryLimit)
                    queryLimitReached = false;
                //delete users that are already followed
                for (let i = 0; i < usersWithSameSchool.length; i++) {
                    if (redisFollows[i]) {
                        usersWithSameSchool.splice(i, 1);
                        i--;
                    }
                }
                users = users.concat(usersWithSameSchool);
                if (queryLimitReached)
                    while (users.length < suggestionLimit) {
                        let secondQueryUsers = await UserEntity.find({
                            "privacySettings.profileStatus": UserProfileStatus.Public,
                            _id: { $nin: secondFoundedUserIds, $lt: lastUserId },
                            schoolId: rUser.schoolId,
                        }, {
                            _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
                        })
                            .sort({ _id: -1, popularity: -1, lastSeenDate: -1 })
                            .limit(queryLimit)
                            .lean(true);
                        if (secondQueryUsers.length === 0)
                            break;
                        lastUserId = secondQueryUsers[secondQueryUsers.length - 1]._id;
                        const secondUserIds = secondQueryUsers.map(user => user._id.toString());
                        const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, secondUserIds);
                        //delete users that are already followed
                        for (let i = 0; i < secondQueryUsers.length; i++) {
                            if (redisFollows[i]) {
                                secondQueryUsers.splice(i, 1);
                                i--;
                            }
                        }
                        users = users.concat(secondQueryUsers);
                    }
            }
        }
        const thirdFoundedUserIds = users.map(user => user._id);
        if (users.length < suggestionLimit) {
            let usersRandom = await UserEntity.find({
                "privacySettings.profileStatus": UserProfileStatus.Public,
                _id: { $nin: thirdFoundedUserIds },
            }, {
                _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
            })
                .sort({ popularity: -1, lastSeenDate: -1 })
                .limit(queryLimit)
                .lean(true);
            if (usersRandom.length > 0) {
                let lastUserId: Date = usersRandom[usersRandom.length - 1]._id;
                const userIds = usersRandom.map(user => user._id.toString());
                const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, userIds);
                if (usersRandom.length < queryLimit)
                    queryLimitReached = false;
                //delete users that are already followed
                for (let i = 0; i < usersRandom.length; i++) {
                    if (redisFollows[i]) {
                        usersRandom.splice(i, 1);
                        i--;
                    }
                }
                users = users.concat(usersRandom);
                if (queryLimitReached)
                    while (users.length < suggestionLimit) {
                        let thirdQueryUsers = await UserEntity.find({
                            "privacySettings.profileStatus": UserProfileStatus.Public,
                            _id: { $nin: thirdFoundedUserIds, $lt: lastUserId },
                        }, {
                            _id: 1, profilePhotoUrl: 1, avatarKey: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1, schoolId: 1, departmentId: 1, grade: 1
                        })
                            .sort({ popularity: -1, lastSeenDate: -1 })
                            .limit(queryLimit)
                            .lean(true);
                        if (thirdQueryUsers.length === 0)
                            break;
                        lastUserId = thirdQueryUsers[thirdQueryUsers.length - 1]._id;
                        const secondUserIds = thirdQueryUsers.map(user => user._id.toString());
                        const redisFollows = await RedisService.client.smIsMember(RedisKeyType.UserFollowings + currentUserId, secondUserIds);
                        //delete users that are already followed
                        for (let i = 0; i < thirdQueryUsers.length; i++) {
                            if (redisFollows[i]) {
                                thirdQueryUsers.splice(i, 1);
                                i--;
                            }
                        }
                        users = users.concat(thirdQueryUsers);
                    }
            }
        }

        return users;
    }

}