import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class DepartmentListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateDepartmentDTO extends BaseFilter {
    _id: string = "";
    facultyId: string = "";
    title: string = "";
    coverImageUrl: string = "";
    grade: number = 0;
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
