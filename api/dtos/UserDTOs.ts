import { EmailConfigurations } from "aws-sdk/clients/iotevents";
import { Role } from "../../stuplus-lib/enums/enums";
import { EmailConfirmation } from "../../stuplus-lib/entities/UserEntity";
import { mapToDTO } from "../../stuplus-lib/utils/general";
import { Gender } from "../../stuplus-lib/enums/enums_socket";

export class UpdateUserProfileDTO {
    firstName: string = "";
    lastName: string = "";
    phoneNumber: string = "";
    avatarKey: string = "";
    about: string = "";
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

export class UserFollowUserDTO {
    followingId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}