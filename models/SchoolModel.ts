import { Document, Schema } from "mongoose";
import BaseModel from "./BaseModel";

export interface School extends BaseModel {
  emailFormat: string;
}

export interface SchoolDocument extends School, Document {
  minify(): unknown;
}

export const SchoolSchema: Schema = new Schema({
  emailFormat: { type: String, required: true },
});

// Just to prove that hooks are still functioning as expected
SchoolSchema.pre("save", function (next) {
  //
  next()
})

SchoolSchema.pre("deleteOne", function (next) {
  //
  next()
});

SchoolSchema.methods.minify = async function (
  this: SchoolDocument
) {

  const response: School & { _id: string } = {
    _id: this._id,
    emailFormat: this.emailFormat,
    title: this.title,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  
  return response;
};
