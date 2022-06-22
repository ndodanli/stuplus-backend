import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface AnnouncementDislike extends BaseEntity {
  ownerId: string; //user id
  announcementId: string;
}

export interface AnnouncementDislikeDocument extends AnnouncementDislike, Document {
  minify(): unknown;
}

export const AnnouncementDislikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  announcementId: { type: String, required: true },
});

// Just to prove that hooks are still functioning as expected
AnnouncementDislikeSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementDislikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementDislikeSchema.methods.minify = async function (
  this: AnnouncementDislikeDocument
) {
  const response: AnnouncementDislike & { _id: string } = {
    _id: this._id,
    ownerId: this.ownerId,
    announcementId: this.announcementId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};