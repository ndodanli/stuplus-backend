import { EmailConfigurations } from "aws-sdk/clients/iotevents";
import { LikeType, Role } from "../../stuplus-lib/enums/enums";
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

export class AnnouncementLikeDislikeDTO extends BaseFilter {
    ownerId: string = ""; //user id
    announcementId: string = "";
    type: LikeType = LikeType.Like
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AnnouncementCommentDTO extends BaseFilter {
    ownerId: string = ""; //user id
    announcementId: string = "";
    comment: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}