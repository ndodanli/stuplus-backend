import { AcceptsDiscriminator, Model, model, Schema } from "mongoose";
import { DepartmentDocument, DepartmentSchema } from "./DepartmentModel";
import { FacultyDocument, FacultySchema } from "./FacultyModel";
import { SchoolDocument, SchoolSchema } from "./SchoolModel";
import { UserDocument, UserSchema } from "./UserModel";

export default interface BaseModel {
  createdAt: Date;
  updatedAt: Date;
  title: String | null;
}

const collections = ["User", "School", "Faculty", "Department"];

const baseSpreadator: Record<string, AcceptsDiscriminator> = {};

collections.forEach((collectionName: string) => {
  baseSpreadator[collectionName] = model(collectionName + "Base", new Schema({
    title: { type: String, required: false, default: null },
  }, { collection: collectionName, timestamps: true }))
})

export const SchoolModel = baseSpreadator["School"].discriminator<
  SchoolDocument,
  Model<SchoolDocument>
>("School", SchoolSchema);

export const DepartmentModel = baseSpreadator["Department"].discriminator<
  DepartmentDocument,
  Model<DepartmentDocument>
>("Department", DepartmentSchema);

export const FacultyModel = baseSpreadator["Faculty"].discriminator<
  FacultyDocument,
  Model<FacultyDocument>
>("Faculty", FacultySchema);

export const UserModel = baseSpreadator["User"].discriminator<
  UserDocument,
  Model<UserDocument>
>("User", UserSchema);