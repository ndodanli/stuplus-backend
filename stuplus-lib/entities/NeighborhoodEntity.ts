import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { Message } from "./MessageEntity";
import { User } from "./UserEntity";
export interface Neighborhood extends BaseEntity {
  title: string;
  cityId: string;
  NeighborhoodId: string;
}

export interface NeighborhoodDocument extends Neighborhood, Document {
  minify(): unknown;
}

export const NeighborhoodSchema: Schema = new Schema({
  title: { type: String, required: true },
  cityId: { type: String, required: true },
  NeighborhoodId: { type: String, required: true },
});

NeighborhoodSchema.index({ recordStatus: 1 });

NeighborhoodSchema.pre("save", function (next) {
  //
  next()
})

NeighborhoodSchema.pre("deleteOne", function (next) {
  //
  next()
});

NeighborhoodSchema.methods.minify = async function (
  this: NeighborhoodDocument
) {
  const response: Neighborhood & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    title: this.title,
    cityId: this.cityId,
    NeighborhoodId: this.NeighborhoodId,
  };
  return response;
};