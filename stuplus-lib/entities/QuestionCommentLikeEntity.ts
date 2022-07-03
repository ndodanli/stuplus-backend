import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface QuestionCommentLike extends BaseEntity {
  ownerId: string; //user id
  commentId: string;
  questionId: string;
  type: LikeType;
}

export interface QuestionCommentLikeDocument extends QuestionCommentLike, Document {
  minify(): unknown;
}

export const QuestionCommentLikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  commentId: { type: String, required: true },
  questionId: { type: String, required: true },
  type: {type: Number, required: true}
});

// Just to prove that hooks are still functioning as expected
QuestionCommentLikeSchema.pre("save", function (next) {
  //
  next()
})

QuestionCommentLikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

QuestionCommentLikeSchema.methods.minify = async function (
  this: QuestionCommentLikeDocument
) {
  const response: QuestionCommentLike & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    commentId: this.commentId,
    questionId: this.questionId,
    type: this.type,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};