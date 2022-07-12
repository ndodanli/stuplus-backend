import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface ImageStatistic extends BaseEntity {
  host: string;
  totalMasterImage: string;
  totalTransformation: string;
  totalSize: string;
  totalBandwidth: string;
  totalView: string;
}

export interface ImageStatisticDocument extends ImageStatistic, Document {
  minify(): unknown;
}

export const ImageStatisticSchema: Schema = new Schema({
  host: { type: String, required: true },
  totalMasterImage: { type: String, required: true },
  totalTransformation: { type: String, required: true },
  totalSize: { type: String, required: true },
  totalBandwidth: { type: String, required: true },
  totalView: { type: String, required: true },
});

// Just to prove that hooks are still functioning as expected
ImageStatisticSchema.pre("save", function (next) {
  //
  next()
})

ImageStatisticSchema.pre("deleteOne", function (next) {
  //
  next()
});

ImageStatisticSchema.methods.minify = async function (
  this: ImageStatisticDocument
) {
  const response: ImageStatistic & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    host: this.host,
    totalMasterImage: this.totalMasterImage,
    totalTransformation: this.totalTransformation,
    totalSize: this.totalSize,
    totalBandwidth: this.totalBandwidth,
    totalView: this.totalView,
  };
  return response;
};