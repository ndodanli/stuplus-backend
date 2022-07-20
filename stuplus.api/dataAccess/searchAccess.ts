import { _LeanDocument } from "mongoose";
import { Announcement } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AnnouncementEntity, DepartmentEntity, GroupChatEntity, HashtagEntity, QuestionEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { GroupChat } from "../../stuplus-lib/entities/GroupChatEntity";
import { Hashtag } from "../../stuplus-lib/entities/HashtagEntity";
import { Question } from "../../stuplus-lib/entities/QuestionEntity";
import { User } from "../../stuplus-lib/entities/UserEntity";
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
            .sort({ createdAt: -1 })
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
            .sort({ createdAt: -1 })
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
            .sort({ lastSeenDate: -1 })
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
                $or: [
                    { titlesch: { $regex: searchableST, $options: "i" } },
                    { hashTags: { $regex: searchableST, $options: "i" } },
                ]
            });
        }
        //TODO: add school relation to sort(schoolId)

        const groupChats = await groupChatsQuery
            .sort({ lastSeenDate: -1 })
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

    public static async getAccountSuggestions(relatedUserId: string, relatedUser: User | null, payload: SearchGroupChatDTO): Promise<Hashtag[]> {
        const rUser = relatedUser ?
            relatedUser :
            await UserEntity.find({ _id: relatedUserId }, { schoolId: 1, departmentId: 1, grade: 1, relatedSchoolIds: 1 }).lean(true);


        let hashTagQuery = HashtagEntity.find({ tag: { $regex: searchable(payload.searchTerm), $options: "i" } });
        //TODO: add school relation to sort(schoolId)
        const hashTags = await hashTagQuery
            .sort({ overallPopularity: -1 })
            .skip(payload.skip)
            .limit(payload.pageSize)
            .lean(true) as Hashtag[];

        return hashTags;
    }

}