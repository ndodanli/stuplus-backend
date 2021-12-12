import { Document, Model, Schema } from "mongoose";
import BaseModel from "./BaseModel";

export interface Interest extends BaseModel {
  url: string;
}

export interface InterestDocument extends Interest, Document {
  minify(): unknown;
}

export const InterestSchema: Schema = new Schema({
  url: { type: String, required: true },
});

InterestSchema.pre("save", function (next) {
  //
  next()
})

InterestSchema.pre("deleteOne", function (next) {
  //
  next()
});

InterestSchema.methods.minify = async function (
  this: InterestDocument
) {
  const response: Interest & { _id: string } = {
    _id: this._id,
    url: this.url,
    title: this.title,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};
