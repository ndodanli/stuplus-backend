import { GroupChatType } from "../../../stuplus-lib/enums/enums_socket";
import { mapToDTO } from "../../../stuplus-lib/utils/general";

export class CreateGroupDTO {
    userIds: string[] = [];
    title: string = "";
    type: GroupChatType = GroupChatType.Private;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class WatchUsersDTO {
    uIds?: string[];
    title: string = "";
    type: GroupChatType = GroupChatType.Private;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}