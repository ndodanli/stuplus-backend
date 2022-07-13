import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface Hashtag extends BaseEntity {
  tag: string;
  groupPopularity: number;
  questionPopularity: number;
  announcementPopularity: number;
  overallPopularity: number;
}

export interface HashtagDocument extends Hashtag, Document {
  minify(): unknown;
}

export const HashtagSchema: Schema = new Schema({
  tag: { type: String, required: true },
  groupPopularity: { type: Number, required: false, default: 0 },
  questionPopularity: { type: Number, required: false, default: 0 },
  announcementPopularity: { type: Number, required: false, default: 0 },
  overallPopularity: { type: Number, required: false, default: 0 },
});

// Just to prove that hooks are still functioning as expected
HashtagSchema.pre("save", function (next) {
  //
  next()
})

HashtagSchema.pre("deleteOne", function (next) {
  //
  next()
});

HashtagSchema.methods.minify = async function (
  this: HashtagDocument
) {
  const response: Hashtag & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tag: this.tag,
    groupPopularity: this.groupPopularity,
    questionPopularity: this.questionPopularity,
    announcementPopularity: this.announcementPopularity,
    overallPopularity: this.overallPopularity,
  };
  return response;
};