import { Document, Model, Schema } from "mongoose";
import BaseModel from "./BaseModel";

export interface School extends BaseModel {
}

export interface SchoolDocument extends School, Document {
  minify(): unknown;
}

export const SchoolSchema: Schema = new Schema({
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
    title: this.title,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};
