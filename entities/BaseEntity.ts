import { AcceptsDiscriminator, Model, model, Schema } from "mongoose";
import { DepartmentDocument, DepartmentSchema } from "./DepartmentEntity";
import { FacultyDocument, FacultySchema } from "./FacultyEntity";
import { InterestDocument, InterestSchema } from "./InterestEntity";
import { SchoolDocument, SchoolSchema } from "./SchoolEntity";
import { UserDocument, UserSchema } from "./UserEntity";

export default interface BaseEntity {
  createdAt: Date;
  updatedAt: Date;
}

const collections = ["User", "School", "Faculty", "Department", "Interest"];

const baseSpreadator: Record<string, AcceptsDiscriminator> = {};

collections.forEach((collectionName: string) => {
  baseSpreadator[collectionName] = model(collectionName + "Base", new Schema({
    // title: { type: String, required: false, default: null },
  }, { collection: collectionName, timestamps: true }))
})

export const SchoolEntity = baseSpreadator["School"].discriminator<
  SchoolDocument,
  Model<SchoolDocument>
>("School", SchoolSchema);

export const DepartmentEntity = baseSpreadator["Department"].discriminator<
  DepartmentDocument,
  Model<DepartmentDocument>
>("Department", DepartmentSchema);

export const FacultyEntity = baseSpreadator["Faculty"].discriminator<
  FacultyDocument,
  Model<FacultyDocument>
>("Faculty", FacultySchema);

export const UserEntity = baseSpreadator["User"].discriminator<
  UserDocument,
  Model<UserDocument>
>("User", UserSchema);

export const InterestEntity = baseSpreadator["Interest"].discriminator<
  InterestDocument,
  Model<InterestDocument>
>("Interest", InterestSchema);