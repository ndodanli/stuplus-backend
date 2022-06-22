import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface AnnouncementCommentDislike extends BaseEntity {
  ownerId: string; //user id
  commentId: string;
  announcementId: string;
}

export interface AnnouncementCommentDislikeDocument extends AnnouncementCommentDislike, Document {
  minify(): unknown;
}

export const AnnouncementCommentDislikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  commentId: { type: String, required: true },
  announcementId: { type: String, required: true },
});

// Just to prove that hooks are still functioning as expected
AnnouncementCommentDislikeSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementCommentDislikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementCommentDislikeSchema.methods.minify = async function (
  this: AnnouncementCommentDislikeDocument
) {
  const response: AnnouncementCommentDislike & { _id: string } = {
    _id: this._id,
    ownerId: this.ownerId,
    commentId: this.commentId,
    announcementId: this.announcementId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};