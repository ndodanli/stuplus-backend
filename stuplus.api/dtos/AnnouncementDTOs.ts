import { LikeType } from "../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../stuplus-lib/utils/general";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { ImageFiles } from "../../stuplus-lib/entities/QuestionEntity";

export class AnnouncementAddDTO {
    images: ImageFiles[] = [];
    title: string = "";
    relatedSchoolIds: string[] | string = [];
    text: string = "";
    hashTags: string[] = [];
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AnnouncementGetMultipleDTO extends BaseFilter {
    schoolIds: string[] = [];
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AnnouncementGetSingleDTO extends BaseFilter {
    id: string[] | undefined;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AnnouncementLikeDislikeDTO extends BaseFilter {
    announcementId: string = "";
    beforeType: LikeType = LikeType.None;
    type: LikeType = LikeType.Like;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AnnouncementCommentDTO extends BaseFilter {
    announcementId: string = "";
    comment: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AnnouncementCommenLikeDisliketDTO extends BaseFilter {
    commentId: string = "";
    announcementId: string = "";
    type: LikeType = LikeType.Like;
    beforeType: LikeType = LikeType.None;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AnnouncementGetCommentsDTO extends BaseFilter {
    announcementId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

//#region AnnouncementEntity DTOs
export class AnnouncementUserMM extends BaseFilter {
    _id: string = "";
    username: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
//#endregion