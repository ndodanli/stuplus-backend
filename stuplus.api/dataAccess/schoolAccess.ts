import { DepartmentEntity, FacultyEntity, SchoolEntity } from "../../stuplus-lib/entities/BaseEntity";
import { DepartmentDocument } from "../../stuplus-lib/entities/DepartmentEntity";
import { FacultyDocument } from "../../stuplus-lib/entities/FacultyEntity";
import { School, SchoolDocument } from "../../stuplus-lib/entities/SchoolEntity";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";

export class SchoolAccess {
    public static async getAllSchools(): Promise<School[]> {
        return await RedisService.acquireAllSchools();
    }

    public static async getFaculties(schoolId: any, fields: Array<string>): Promise<FacultyDocument[] | null> {
        return await FacultyEntity.find({ schoolId: schoolId }, fields);
    }

    public static async getDepartments(schoolId: any, fields: Array<string>): Promise<DepartmentDocument[] | null> {
        return await DepartmentEntity.find({ schoolId: schoolId }, fields);
    }
}