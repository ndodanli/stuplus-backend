import { DepartmentEntity, FacultyEntity, SchoolEntity } from "../entities/BaseEntity";
import { DepartmentDocument } from "../entities/DepartmentEntity";
import { FacultyDocument } from "../entities/FacultyEntity";
import { SchoolDocument } from "../entities/SchoolEntity";

export class SchoolAccess {
    public static async getAllSchools(fields?: Array<string>): Promise<SchoolDocument[] | null> {
        return await SchoolEntity.find({}, fields);
    }

    public static async getFaculties(schoolId: any, fields?: Array<string>): Promise<FacultyDocument[] | null> {
        return await FacultyEntity.find({ schoolId: schoolId }, fields);
    }

    public static async getDepartments(facultyId: any, fields?: Array<string>): Promise<DepartmentDocument[] | null> {
        return await DepartmentEntity.find({ facultyId: facultyId }, fields);
    }
}