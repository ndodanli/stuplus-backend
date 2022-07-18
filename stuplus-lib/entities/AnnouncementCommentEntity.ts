import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { School } from "./SchoolEntity";
import { User } from "./UserEntity";

export interface AnnouncementComment extends BaseEntity {
  ownerId: string; //user id
  announcementId: string;
  comment: string;
  score: number;
  //ignore
  owner?: User | null; // ignore
  ownerSchool?: School | null; //ignore
  likeCount: number; // ignore
  likeType: LikeType; // ignore

}

export interface AnnouncementCommentDocument extends AnnouncementComment, Document {
  minify(): unknown;
}

export const AnnouncementCommentSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  announcementId: { type: String, required: true },
  comment: { type: String, required: true },
  score: { type: Number, required: false, default: 0 },
});

AnnouncementCommentSchema.index({ recordStatus: 1 });

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
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    announcementId: this.announcementId,
    comment: this.comment,
    score: this.score,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    //ignore
    likeType: LikeType.None, // ignore
    likeCount: 0, // ignore
    owner: null, // ignore
    ownerSchool: null, // ignore
  };
  return response;
};