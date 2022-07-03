import { User } from "../../../stuplus-lib/entities/UserEntity";
import { FollowStatus } from "../../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../../stuplus-lib/utils/general";

export class UserProfileResponseDTO {
    user?: User | null;
    followStatus?: object;
    constructor(obj?: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}