import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface AnnouncementSubCommentLike extends BaseEntity {
  ownerId: string; //user id
  subCommentId: string;
  commentId: string;
  announcementId: string;
  type: LikeType;
}

export interface AnnouncementSubCommentLikeDocument extends AnnouncementSubCommentLike, Document {
  minify(): unknown;
}

export const AnnouncementSubCommentLikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  subCommentId: { type: String, required: true },
  commentId: { type: String, required: true },
  announcementId: { type: String, required: true },
  type: { type: Number, required: true }
});

AnnouncementSubCommentLikeSchema.index({ recordStatus: -1, subCommentId: 1, type: 1 });

AnnouncementSubCommentLikeSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementSubCommentLikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementSubCommentLikeSchema.methods.minify = async function (
  this: AnnouncementSubCommentLikeDocument
) {
  const response: AnnouncementSubCommentLike & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    subCommentId: this.subCommentId,
    commentId: this.commentId,
    announcementId: this.announcementId,
    type: this.type,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
  };
  return response;
};