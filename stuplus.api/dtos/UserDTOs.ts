import { EmailConfigurations } from "aws-sdk/clients/iotevents";
import { FollowStatus, ReportType, Role } from "../../stuplus-lib/enums/enums";
import { EmailConfirmation } from "../../stuplus-lib/entities/UserEntity";
import { mapToDTO } from "../../stuplus-lib/utils/general";
import { Gender } from "../../stuplus-lib/enums/enums_socket";

export class UpdateUserProfileDTO {
    firstName: string = "";
    lastName: string = "";
    phoneNumber: string = "";
    avatarKey: string = "";
    about: string = "";
    username: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class UpdateUserSchoolDTO {
    schoolId: string = "";
    departmentId: string = "";
    grade: number = 1;
    secondaryEducation: boolean = false;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class UpdateUserInterestsDTO {
    interestIds: Array<string> = []
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RegisterUserDTO {
    email: string = "";
    accEmailConfirmation: EmailConfirmation = new EmailConfirmation();
    schoolEmail: string | undefined;
    schoolEmailConfirmation: EmailConfirmation = new EmailConfirmation();
    password: string = "";
    passwordRepeat: string = "";
    gender: Gender = 0;
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

export class LoginUserGoogleDTO {
    AccessToken: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class UserFollowUserRequestDTO {
    requestedId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class UserFollowReqDTO {
    followId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class UserUnfollowDTO {
    followId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class UserRemoveFollowerDTO {
    followId: string = "";
    targetUserId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class ReportDTO {
    ownerId: string = ""; //user id
    reportType: ReportType = ReportType.Other;
    details: string = "";
    userId: string = "";
    messageId: string = "";
    messageText: string = "";
    commentId: string = "";
    commentText: string = "";
    announcementId: string = "";
    announcementText: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class NotificationsReadedDTO {
    notificationIds: string[] = [];
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}