import { BaseFilter } from "../../../stuplus-lib/dtos/baseFilter";
import { GroupChatSettings } from "../../../stuplus-lib/entities/GroupChatEntity";
import { DeleteChatForType } from "../../../stuplus-lib/enums/enums";
import { GroupChatType } from "../../../stuplus-lib/enums/enums_socket";
import { mapToDTO } from "../../../stuplus-lib/utils/general";

export class CreateGroupDTO {
    userIds: string[] | string = [];
    title: string = "";
    type: GroupChatType = GroupChatType.Private;
    avatarKey: string = "";
    hashTags: string[] = [];
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
    hashTags: string[] = [];
    settings: GroupChatSettings = new GroupChatSettings(true);
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class WatchUsersDTO {
    uIds?: string[];
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
    messageId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetSearchedGroupChatMessagesDTO extends BaseFilter {
    groupChatId: string = "";
    searchedText: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetSearchedGroupChatMessageDTO extends BaseFilter {
    groupChatId: string = "";
    messageId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetGroupUsersDTO extends BaseFilter {
    groupChatId: string = "";
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

export class ClearPMChatHistoryDTO {
    chatId: string = "";
    deleteFor: DeleteChatForType = DeleteChatForType.Me;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class DeleteSinglePMDTO {
    chatId: string = "";
    messageId: string = "";
    deleteFor: DeleteChatForType = DeleteChatForType.Me;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class DeleteSingleGMDTO {
    groupChatId: string = "";
    messageId: string = "";
    deleteFor: DeleteChatForType = DeleteChatForType.Me;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class BlockUserDTO {
    userId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class LeaveGroupDTO {
    groupChatId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetGroupChatDataDTO extends BaseFilter {
    groupChatId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class GetPrivateChatDataDTO extends BaseFilter {
    chatId: string = "";
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RemovePrivateChatsDTO extends BaseFilter {
    privateChatsIds: string[] = [];
    constructor(obj: any) {
        super(obj);
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class JoinGroupDTO {
    groupChatId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}