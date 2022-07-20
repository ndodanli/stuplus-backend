import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { Department } from "../../stuplus-lib/entities/DepartmentEntity";
import { SchoolType } from "../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../stuplus-lib/utils/general";

export class SchoolListDTO extends BaseFilter {
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class AddUpdateSchoolDTO extends BaseFilter {
    _id: string = "";
    title: string = "";
    emailFormat: string = "";
    coverImageUrl: string = "";
    type: SchoolType = SchoolType.Government;
    departments: Department[] = [];
    cityId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
