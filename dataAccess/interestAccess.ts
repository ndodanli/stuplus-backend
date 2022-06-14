import { InterestEntity } from "../models/BaseEntity";
import { InterestDocument } from "../models/InterestEntity";

export class InterestAccess {
    public static async getAllInterests(fields?: Array<string>): Promise<InterestDocument[] | null> {
        return await InterestEntity.find({}, fields);
    }
}