import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { LikeType } from "../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class AnnouncementLikeListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateAnnouncementLikeDTO extends BaseFilter {
    _id: string = "";
    ownerId: string = "";
    announcementId: string = "";
    type: LikeType = LikeType.Like;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
