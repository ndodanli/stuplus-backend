import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { NotificationSettings, PrivacySettings } from "../../stuplus-lib/entities/UserEntity";
import { Gender, Role } from "../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class UserListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateUserDTO extends BaseFilter {
    _id: string = "";
    email: string = "";
    password: string = "";
    username: string = "";
    role: Number = Role.User;
    schoolEmail: string = "";
    firstName: string = "";
    lastName: string = "";
    phoneNumber: string = "";
    schoolId: string = "";
    facultyId: string = "";
    departmentId: string = "";
    isAccEmailConfirmed: Boolean = true;
    isSchoolEmailConfirmed: Boolean = true;
    grade: Number = 0;
    profilePhotoUrl: string = "";
    gender: Gender = Gender.NotDefined;
    notificationSettings: NotificationSettings = new NotificationSettings();
    blockedUserIds: Array<string> = [];
    interestIds: Array<string> = [];
    relatedSchoolIds: Array<string> = [];
    avatarKey: string = "";
    about: string = "";
    privacySettings: PrivacySettings = new PrivacySettings();
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
