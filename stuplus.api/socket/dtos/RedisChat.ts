import { mapToDTO } from "../../../stuplus-lib/utils/general";

export class RedisMessageDTO {
    t?: string;
    ci?: string;
    to?: string;
    rToId?: string;

    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisGroupMessageDTO {
    t?: string;
    gCi?: string;
    rToId?: string;

    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisMessageForwardReadDTO {
    ci?: string;
    to?: string;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisGroupMessageForwardReadDTO {
    gCi?: string;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisMessageReceiptUpdateDTO {
    createdAt?: Date;
    chatId?: string;
    ownerId?: string;
}

export class RedisFileMessageUpdateDTO {
    mi?: string;
    file?: any;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}


export class RedisSendFileMessageDTO {
    t: string = "";
    ci: string = "";
    to: string = "";
    replyToId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisUpdateFileMessageDTO {
    mi: string = "";
    ci: string = "";
    to: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisGroupSendFileMessageDTO {
    m: string = "";
    gCi: string = "";
    replyToId: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisGroupUpdateFileMessageDTO {
    mi: string = "";
    gCi: string = "";
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
