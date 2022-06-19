import { mapToDTO } from "../../stuplus-lib/utils/general";

export class RedisMessageDTO {
    m?: string;
    ci?: string;
    to?: string;

    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisGroupMessageDTO {
    m?: string;
    gCi?: string;

    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisMessageForwardReadDTO {
    mids?: string[];
    ci?: string;
    to?: string;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisGroupMessageForwardReadDTO {
    mids?: string[];
    gCi?: string;
    to?: string;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}

export class RedisMessageReceiptUpdateDTO {
    _id?: string;
    constructor(obj: any) {
        if (obj) {
            mapToDTO(this, obj);
        }
    }
}
