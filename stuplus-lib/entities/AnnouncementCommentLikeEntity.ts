import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface AnnouncementCommentLike extends BaseEntity {
  ownerId: string; //user id
  commentId: string;
  announcementId: string;
  type: LikeType;
}

export interface AnnouncementCommentLikeDocument extends AnnouncementCommentLike, Document {
  minify(): unknown;
}

export const AnnouncementCommentLikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  commentId: { type: String, required: true },
  announcementId: { type: String, required: true },
  type: { type: Number, required: true }
});

AnnouncementCommentLikeSchema.index({ recordStatus: 1, commentId: 1, type: 1 });


// Just to prove that hooks are still functioning as expected
AnnouncementCommentLikeSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementCommentLikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementCommentLikeSchema.methods.minify = async function (
  this: AnnouncementCommentLikeDocument
) {
  const response: AnnouncementCommentLike & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    commentId: this.commentId,
    announcementId: this.announcementId,
    type: this.type,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};