import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface Faculty extends BaseEntity {
  schoolId: string;
  title: string;
}

export interface FacultyDocument extends Faculty, Document {
  minify(): unknown;
}

export const FacultySchema: Schema = new Schema({
  schoolId: { type: String, required: true },
  title: { type: String, required: true, default: null },
});

// Just to prove that hooks are still functioning as expected
FacultySchema.pre("save", function (next) {
  //
  next()
})

FacultySchema.pre("deleteOne", function (next) {
  //
  next()
});

FacultySchema.methods.minify = async function (
  this: FacultyDocument
) {
  const response: Faculty & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    schoolId: this.schoolId,
    title: this.title,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};