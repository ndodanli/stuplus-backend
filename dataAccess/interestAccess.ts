import { InterestEntity } from "../entities/BaseEntity";
import { InterestDocument } from "../entities/InterestEntity";

export class InterestAccess {
    public static async getAllInterests(fields?: Array<string>): Promise<InterestDocument[] | null> {
        return await InterestEntity.find({}, fields);
    }
}