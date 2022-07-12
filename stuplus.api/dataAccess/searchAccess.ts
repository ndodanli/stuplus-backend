import { _LeanDocument } from "mongoose";
import { DepartmentEntity, GroupChatEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { GroupChat, GroupChatDocument } from "../../stuplus-lib/entities/GroupChatEntity";
import { User } from "../../stuplus-lib/entities/UserEntity";
import { SearchGroupChatDTO } from "../dtos/SearchDTOs";
import { SchoolAccess } from "./schoolAccess";

export class SearchAccess {

    public static async getSearchedUsers(userId: any, payload: SearchGroupChatDTO): Promise<User[]> {
        let usersQuery;
        if (payload.searchString.length > 2) {
            usersQuery = UserEntity.fuzzySearch(payload.searchString)
        } else {
            usersQuery = UserEntity.find({
                $or: [
                    { username: { $regex: payload.searchString, $options: "i" } },
                    { firstName: { $regex: payload.searchString, $options: "i" } },
                    { lastName: { $regex: payload.searchString, $options: "i" } }
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

        return users
    }

    public static async getSearchedGroupChats(userId: any, payload: SearchGroupChatDTO): Promise<GroupChat[]> {
        let groupChatsQuery;
        if (payload.searchString.length > 2) {
            groupChatsQuery = GroupChatEntity.fuzzySearch(payload.searchString)
        } else {
            groupChatsQuery = GroupChatEntity.find({
                $or: [
                    { title: { $regex: payload.searchString, $options: "i" } },
                    { hashTags: { $regex: payload.searchString, $options: "i" } },
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

}