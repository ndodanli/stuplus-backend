import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class SearchQuestionDTO extends BaseFilter {
    searchTerm: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class SearchPeopleDTO extends BaseFilter {
    searchTerm: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class SearchGroupChatDTO extends BaseFilter {
    searchTerm: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class SearchPeopleAndGroupChatDTO extends BaseFilter {
    searchTerm: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class SearchHashTagDTO extends BaseFilter {
    searchTerm: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class SearchGroupUsersDTO extends BaseFilter {
    searchTerm: string = "";
    groupChatId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}