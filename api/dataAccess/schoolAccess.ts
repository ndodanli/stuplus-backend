import { DepartmentEntity, FacultyEntity, SchoolEntity } from "../../stuplus-lib/entities/BaseEntity";
import { DepartmentDocument } from "../../stuplus-lib/entities/DepartmentEntity";
import { FacultyDocument } from "../../stuplus-lib/entities/FacultyEntity";
import { SchoolDocument } from "../../stuplus-lib/entities/SchoolEntity";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";

export class SchoolAccess {
    public static async getAllSchools(fields: Array<string>): Promise<SchoolDocument[] | null> {
        return await RedisService.acquire<SchoolDocument[]>(RedisKeyType.Schools, 60 * 60 * 2, async () => await SchoolEntity.find({}, {}, { lean: true }));
    }

    public static async getFaculties(schoolId: any, fields: Array<string>): Promise<FacultyDocument[] | null> {
        return await FacultyEntity.find({ schoolId: schoolId }, fields);
    }

    public static async getDepartments(facultyId: any, fields: Array<string>): Promise<DepartmentDocument[] | null> {
        return await DepartmentEntity.find({ facultyId: facultyId }, fields);
    }
}