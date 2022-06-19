import { EmailConfigurations } from "aws-sdk/clients/iotevents";
import { Role } from "../../stuplus-lib/enums/enums";
import { EmailConfirmation } from "../../stuplus-lib/entities/UserEntity";
import { mapToDTO } from "../../stuplus-lib/utils/general";

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