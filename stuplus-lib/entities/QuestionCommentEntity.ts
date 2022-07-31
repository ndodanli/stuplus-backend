import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { School } from "./SchoolEntity";
import { User } from "./UserEntity";

export interface QuestionComment extends BaseEntity {
  ownerId: string; //user id
  questionId: string;
  comment: string;
  score: number;
  //ignore
  owner?: User | null; // ignore
  ownerSchool?: School | null; //ignore
  likeCount: number; // ignore
  subCommentCount: number // ignore
  likeType: LikeType; // ignore

}

export interface QuestionCommentDocument extends QuestionComment, Document {
  minify(): unknown;
}

export const QuestionCommentSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  questionId: { type: String, required: true },
  comment: { type: String, required: true },
  score: { type: Number, required: false, default: 0 },
});

QuestionCommentSchema.index({ recordStatus: -1, questionId: -1, score: -1, createdAt: -1 });

// Just to prove that hooks are still functioning as expected
QuestionCommentSchema.pre("save", function (next) {
  //
  next()
})

QuestionCommentSchema.pre("deleteOne", function (next) {
  //
  next()
});

QuestionCommentSchema.methods.minify = async function (
  this: QuestionCommentDocument
) {
  const response: QuestionComment & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    questionId: this.questionId,
    comment: this.comment,
    score: this.score,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    //ignore
    likeType: LikeType.None, // ignore
    likeCount: 0, // ignore
    subCommentCount: 0, // ignore
    owner: null, // ignore
    ownerSchool: null, // ignore
  };
  return response;
};