import { mapToDTO } from "../../../stuplus-lib/utils/general";

export class UserDTO {
    _id: string = "";

    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}