import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface AnnouncementCommentLike extends BaseEntity {
  ownerId: string; //user id
  commentId: string;
  announcementId: string;
}

export interface AnnouncementCommentLikeDocument extends AnnouncementCommentLike, Document {
  minify(): unknown;
}

export const AnnouncementCommentLikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  commentId: { type: String, required: true },
  announcementId: { type: String, required: true },
});

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
    ownerId: this.ownerId,
    commentId: this.commentId,
    announcementId: this.announcementId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};