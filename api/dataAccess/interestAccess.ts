import { InterestEntity } from "../../stuplus-lib/entities/BaseEntity";
import { InterestDocument } from "../../stuplus-lib/entities/InterestEntity";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";

export class InterestAccess {
    public static async getAllInterests(fields: Array<string>): Promise<InterestDocument[] | null> {
        return await RedisService.acquire<InterestDocument[]>(RedisKeyType.Interests + "interests", 60 * 60 * 2, async () => await InterestEntity.find({}, {}, { lean: true }));
    }
}