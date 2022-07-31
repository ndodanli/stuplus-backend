import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { Message } from "./MessageEntity";
import { User } from "./UserEntity";
export interface District extends BaseEntity {
  title: string;
  cityId: string;
}

export interface DistrictDocument extends District, Document {
  minify(): unknown;
}

export const DistrictSchema: Schema = new Schema({
  title: { type: String, required: true },
  cityId: { type: String, required: true },
});

DistrictSchema.index({ recordStatus: -1 });

DistrictSchema.pre("save", function (next) {
  //
  next()
})

DistrictSchema.pre("deleteOne", function (next) {
  //
  next()
});

DistrictSchema.methods.minify = async function (
  this: DistrictDocument
) {
  const response: District & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    title: this.title,
    cityId: this.cityId,
  };
  return response;
};