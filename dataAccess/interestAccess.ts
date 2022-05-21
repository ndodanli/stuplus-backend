import { InterestModel } from "../models/BaseModel";
import { InterestDocument } from "../models/InterestModel";

export class InterestAccess {
    public static async getAllInterests(fields?: Array<string>): Promise<InterestDocument[] | null> {
        return await InterestModel.find({}, fields);
    }
}