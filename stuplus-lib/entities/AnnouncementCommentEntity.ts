import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface AnnouncementComment extends BaseEntity {
  ownerId: string; //user id
  announcementId: string;
  comment: string;
}

export interface AnnouncementCommentDocument extends AnnouncementComment, Document {
  minify(): unknown;
}

export const AnnouncementCommentSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  announcementId: { type: String, required: true },
  comment: { type: String, required: true },
});

// Just to prove that hooks are still functioning as expected
AnnouncementCommentSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementCommentSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementCommentSchema.methods.minify = async function (
  this: AnnouncementCommentDocument
) {
  const response: AnnouncementComment & { _id: string } = {
    _id: this._id,
    ownerId: this.ownerId,
    announcementId: this.announcementId,
    comment: this.comment,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};