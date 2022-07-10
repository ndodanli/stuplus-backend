import { BaseFilter } from "../../../stuplus-lib/dtos/baseFilter";
import { GroupChatType } from "../../../stuplus-lib/enums/enums_socket";
import { mapToDTO } from "../../../stuplus-lib/utils/general";

export class CreateGroupDTO {
    userIds: string[] = [];
    title: string = "";
    type: GroupChatType = GroupChatType.Private;
    avatarKey: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class UpdateGroupInfoDTO {
    groupChatId: string = "";
    title: string = "";
    type: GroupChatType = GroupChatType.Private;
    avatarKey: string = "";
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

export class GetChatMessagesDTO extends BaseFilter {
    chatId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetSearchedChatMessagesDTO extends BaseFilter {
    chatId: string = "";
    searchedText: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetSearchedChatMessageDTO extends BaseFilter {
    chatId: string = "";
    messageCreatedAt: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetGroupChatMessagesDTO extends BaseFilter {
    groupChatId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class AddToGroupChatDTO {
    groupChatId: string = "";
    userIds: string[] = [];
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RemoveFromGroupChatDTO {
    groupChatId: string = "";
    userIds: string[] = [];
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class MakeUsersGroupAdminDTO {
    groupChatId: string = "";
    userIds: string[] = [];
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}