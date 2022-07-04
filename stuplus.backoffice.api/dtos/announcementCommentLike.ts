import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { LikeType } from "../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class AnnouncementCommentLikeListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateAnnouncementCommentLikeDTO extends BaseFilter {
    _id: string = "";
    ownerId: string = "";
    commentId: string = "";
    announcementId: string = "";
    type: LikeType = LikeType.Like;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
