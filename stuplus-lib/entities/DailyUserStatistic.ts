import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface DailyUserStatistic extends BaseEntity {
  ownerId: string; // userId
  likeCount: number;
  pmCount: number;
  commentCount: number;
  followCount: number;
}

export interface DailyUserStatisticDocument extends DailyUserStatistic, Document {
  minify(): unknown;
}

export const DailyUserStatisticSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  likeCount: { type: Number, required: false, default: 0 },
  pmCount: { type: Number, required: false, default: 0 },
  commentCount: { type: Number, required: false, default: 0 },
  followCount: { type: Number, required: false, default: 0 },
});

// DailyUserStatisticSchema.index({ recordStatus: -1 });

DailyUserStatisticSchema.pre("save", function (next) {
  //
  next()
})

DailyUserStatisticSchema.pre("deleteOne", function (next) {
  //
  next()
});

DailyUserStatisticSchema.methods.minify = async function (
  this: DailyUserStatisticDocument
) {
  const response: DailyUserStatistic & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ownerId: this.ownerId,
    likeCount: this.likeCount,
    pmCount: this.pmCount,
    commentCount: this.commentCount,
    followCount: this.followCount,
  };
  return response;
};