import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class AnnouncementCommentListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateAnnouncementCommentDTO extends BaseFilter {
    _id: string = "";
    ownerId: string = "";
    announcementId: string = "";
    comment: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
