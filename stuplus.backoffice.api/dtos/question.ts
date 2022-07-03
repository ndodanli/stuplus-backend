import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class QuestionListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateQuestionDTO extends BaseFilter {
    _id: string = "";
    ownerId: string = "";
    title: string = "";
    coverImageUrl: string = "";
    relatedSchoolIds: string[] = [];
    text: string = "";
    isActive: boolean = true;
    fromDate: Date | null = null;
    toDate: Date | null = null;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
