import { Role } from "../enums/enums";
import { mapToDTO } from "../utils/general";

export class UpdateUserProfileDTO {
    firstName: string | undefined;
    lastName: string | undefined;
    phoneNumber: string | undefined;
    profilePhotoUrl: string | undefined;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RegisterUserDTO {
    email: string = "";
    password: string = "";
    passwordRepeat: string = "";
    username: string = "";
    role: Role = Role.User;
    firstName: string | undefined;
    lastName: string | undefined;
    phoneNumber: string | undefined;
    profilePhotoUrl: string | undefined;
    schoolId: string = "";
    facultyId: string = "";
    departmentId: string = "";
    grade: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class LoginUserDTO {
    email: string = "";
    password: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}