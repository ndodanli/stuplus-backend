import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class QuestionCommentListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateQuestionCommentDTO extends BaseFilter {
    _id: string = "";
    ownerId: string = "";
    questionId: string = "";
    comment: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
