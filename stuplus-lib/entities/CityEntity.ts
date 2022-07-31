import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
export interface City extends BaseEntity {
  title: string;
}

export interface CityDocument extends City, Document {
  minify(): unknown;
}

export const CitySchema: Schema = new Schema({
  title: { type: String, required: true },
});

CitySchema.index({ recordStatus: -1 });

CitySchema.pre("save", function (next) {
  //
  next()
})

CitySchema.pre("deleteOne", function (next) {
  //
  next()
});

CitySchema.methods.minify = async function (
  this: CityDocument
) {
  const response: City & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    title: this.title,
  };
  return response;
};