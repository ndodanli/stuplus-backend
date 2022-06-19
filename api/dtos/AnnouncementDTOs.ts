import { EmailConfigurations } from "aws-sdk/clients/iotevents";
import { Role } from "../../stuplus-lib/enums/enums";
import { EmailConfirmation } from "../../stuplus-lib/entities/UserEntity";
import { mapToDTO } from "../../stuplus-lib/utils/general";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";

export class AddAnnouncementDTO {
    coverImageUrl: string = "";
    title: string = "";
    relatedSchoolIds: string[] | string = [];
    text: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetAnnouncementsForUserDTO extends BaseFilter {
    schoolIds: string[] | undefined;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
