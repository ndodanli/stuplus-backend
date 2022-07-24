import { LikeType } from "../../stuplus-lib/enums/enums";
import { mapToDTO } from "../../stuplus-lib/utils/general";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { MessageFiles } from "../../stuplus-lib/entities/MessageEntity";

export class UploadImagesDTO {
    uploadPath: string = "";
    isCompressed: boolean = false;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}