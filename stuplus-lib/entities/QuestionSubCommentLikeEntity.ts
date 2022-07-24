import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface QuestionSubCommentLike extends BaseEntity {
  ownerId: string; //user id
  subCommentId: string;
  commentId: string;
  questionId: string;
  type: LikeType;
}

export interface QuestionSubCommentLikeDocument extends QuestionSubCommentLike, Document {
  minify(): unknown;
}

export const QuestionSubCommentLikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  subCommentId: { type: String, required: true },
  commentId: { type: String, required: true },
  questionId: { type: String, required: true },
  type: { type: Number, required: true }
});

QuestionSubCommentLikeSchema.index({ recordStatus: 1, subCommentId: 1, type: 1 });

// Just to prove that hooks are still functioning as expected
QuestionSubCommentLikeSchema.pre("save", function (next) {
  //
  next()
})

QuestionSubCommentLikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

QuestionSubCommentLikeSchema.methods.minify = async function (
  this: QuestionSubCommentLikeDocument
) {
  const response: QuestionSubCommentLike & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    subCommentId: this.subCommentId,
    commentId: this.commentId,
    questionId: this.questionId,
    type: this.type,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
  };
  return response;
};