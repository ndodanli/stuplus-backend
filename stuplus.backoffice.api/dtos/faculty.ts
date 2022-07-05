import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class FacultyListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateFacultyDTO extends BaseFilter {
    _id: string = "";
    schoolId: string = "";
    title: string = "";
    coverImageUrl: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
