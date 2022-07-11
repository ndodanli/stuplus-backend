import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface AnnouncementLike extends BaseEntity {
  ownerId: string; //user id
  announcementId: string;
  type: LikeType
}

export interface AnnouncementLikeDocument extends AnnouncementLike, Document {
  minify(): unknown;
}

export const AnnouncementLikeSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  announcementId: { type: String, required: true },
  type: {type: Number, required: true}
});

// Just to prove that hooks are still functioning as expected
AnnouncementLikeSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementLikeSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementLikeSchema.methods.minify = async function (
  this: AnnouncementLikeDocument
) {
  const response: AnnouncementLike & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    announcementId: this.announcementId,
    type: this.type,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};