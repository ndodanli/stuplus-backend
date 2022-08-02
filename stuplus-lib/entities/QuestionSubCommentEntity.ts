import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { School } from "./SchoolEntity";
import { User } from "./UserEntity";

export interface QuestionSubComment extends BaseEntity {
  ownerId: string; //user id
  questionId: string;
  commentId: string;
  comment: string;
  popularity: number;
  replyToId: string;
  //ignore
  owner?: User | null; // ignore
  replyTo?: User | null; // ignore
  ownerSchool?: School | null; //ignore
  likeCount: number; // ignore
  likeType: LikeType; // ignore

}

export interface QuestionSubCommentDocument extends QuestionSubComment, Document {
  minify(): unknown;
}

export const QuestionSubCommentSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  questionId: { type: String, required: true },
  commentId: { type: String, required: true },
  comment: { type: String, required: true },
  popularity: { type: Number, required: false, default: 0 },
  replyToId: { type: String, required: false, default: null },
});

QuestionSubCommentSchema.index({ recordStatus: -1, questionId: -1, commentId: -1, popularity: -1, createdAt: 1 });

// Just to prove that hooks are still functioning as expected
QuestionSubCommentSchema.pre("save", function (next) {
  //
  next()
})

QuestionSubCommentSchema.pre("deleteOne", function (next) {
  //
  next()
});

QuestionSubCommentSchema.methods.minify = async function (
  this: QuestionSubCommentDocument
) {
  const response: QuestionSubComment & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    questionId: this.questionId,
    comment: this.comment,
    popularity: this.popularity,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    commentId: this.commentId,
    replyToId: this.replyToId,
    //ignore
    likeType: LikeType.None, // ignore
    likeCount: 0, // ignore
    owner: null, // ignore
    ownerSchool: null, // ignore
  };
  return response;
};