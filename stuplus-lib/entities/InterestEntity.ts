import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface Interest extends BaseEntity {
  icon: string;
  title: string;
}

export interface InterestDocument extends Interest, Document {
  minify(): unknown;
}

export const InterestSchema: Schema = new Schema({
  icon: { type: String, required: false },
  title: { type: String, required: true },
});

InterestSchema.index({ recordStatus: 1 });

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
    recordStatus: this.recordStatus,
    icon: this.icon,
    title: this.title,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
  };
  return response;
};
