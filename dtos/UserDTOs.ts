import { mapToDTO } from "../utils/general";


export class UpdateUserDTO {
    firstName: string | null = null;
    lastName: string | null = null;
    phoneNumber: string | null = null;
    profilePhotoUrl: string | null = null;
    schoolId: string | null = null;
    facultyId: string | null = null;
    departmentId: string | null = null;
    grade: string | null = null;

    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}