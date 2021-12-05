import { DepartmentModel, FacultyModel, SchoolModel } from "../models/BaseModel";
import { SchoolDocument } from "../models/SchoolModel";

export class SchoolAccess {
    public static async getAllSchools(fields?: Array<string>): Promise<SchoolDocument[] | null> {
        return await SchoolModel.find({}, fields);
    }

    public static async getFaculties(schoolId: any, fields?: Array<string>): Promise<SchoolDocument[] | null> {
        return await FacultyModel.find({ schoolId: schoolId }, fields);
    }

    public static async getDepartments(facultyId: any, fields?: Array<string>): Promise<SchoolDocument[] | null> {
        return await DepartmentModel.find({ facultyId: facultyId }, fields);
    }
}