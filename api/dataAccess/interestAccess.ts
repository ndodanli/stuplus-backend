import { InterestEntity } from "../../stuplus-lib/entities/BaseEntity";
import { InterestDocument } from "../../stuplus-lib/entities/InterestEntity";

export class InterestAccess {
    public static async getAllInterests(fields: Array<string>): Promise<InterestDocument[] | null> {
        return await InterestEntity.find({}, fields);
    }
}