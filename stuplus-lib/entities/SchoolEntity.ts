import { Document, Schema } from "mongoose";
import { SchoolType } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface School extends BaseEntity {
  emailFormat: string;
  title: string;
  coverImageUrl: string;
  type: SchoolType;
}

export interface SchoolDocument extends School, Document {
  minify(): unknown;
}

export const SchoolSchema: Schema = new Schema({
  emailFormat: { type: String, required: true },
  title: { type: String, required: true },
  coverImageUrl: { type: String, required: false, default: null },
  type: { type: Number, required: true },
});

SchoolSchema.index({ recordStatus: 1 });

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
    recordStatus: this.recordStatus,
    emailFormat: this.emailFormat,
    title: this.title,
    coverImageUrl: this.coverImageUrl,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    type: this.type,
    recordDeletionDate: this.recordDeletionDate,
  };

  return response;
};
