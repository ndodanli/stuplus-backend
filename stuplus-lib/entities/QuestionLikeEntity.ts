import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface QuestionLike extends BaseEntity {
  ownerId: string; //user id
  questionId: string;
  type: LikeType
}

export interface QuestionLikeDocument extends QuestionLike, Document {
  minify(): unknown;
}

export const QuestionLikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  questionId: { type: String, required: true },
  type: { type: Number, required: true }
});

QuestionLikeSchema.index({ recordStatus: -1, questionId: 1, type: 1 });

// Just to prove that hooks are still functioning as expected
QuestionLikeSchema.pre("save", function (next) {
  //
  next()
})

QuestionLikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

QuestionLikeSchema.methods.minify = async function (
  this: QuestionLikeDocument
) {
  const response: QuestionLike & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    questionId: this.questionId,
    type: this.type,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};