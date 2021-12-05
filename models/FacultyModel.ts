import { Document, Model, Schema } from "mongoose";
import BaseModel from "./BaseModel";

export interface Faculty extends BaseModel {
  schoolId: string;
}

export interface FacultyDocument extends Faculty, Document {
  minify(): unknown;
}

export const FacultySchema: Schema = new Schema({
  schoolId: { type: String, required: true },
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
    schoolId: this.schoolId,
    title: this.title,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};