import { LikeType } from "../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../stuplus-lib/utils/general";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { ImageFiles } from "../../stuplus-lib/entities/QuestionEntity";

export class QuestionAddDTO {
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

export class QuestionGetMultipleDTO extends BaseFilter {
    schoolIds: string[] = [];
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class QuestionGetSingleDTO extends BaseFilter {
    id: string[] | undefined;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class QuestionLikeDislikeDTO extends BaseFilter {
    questionId: string = "";
    beforeType: LikeType = LikeType.None;
    type: LikeType = LikeType.Like;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class QuestionCommentDTO extends BaseFilter {
    questionId: string = "";
    comment: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class QuestionCommenLikeDisliketDTO extends BaseFilter {
    commentId: string = "";
    questionId: string = "";
    type: LikeType = LikeType.Like;
    beforeType: LikeType = LikeType.None;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class QuestionGetCommentsDTO extends BaseFilter {
    questionId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

//#region QuestionEntity DTOs
export class QuestionUserMM extends BaseFilter {
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