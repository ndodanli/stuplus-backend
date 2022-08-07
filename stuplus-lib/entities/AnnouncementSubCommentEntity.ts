import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { School } from "./SchoolEntity";
import { User } from "./UserEntity";

export interface AnnouncementSubComment extends BaseEntity {
  ownerId: string; //user id
  announcementId: string;
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

export interface AnnouncementSubCommentDocument extends AnnouncementSubComment, Document {
  minify(): unknown;
}

export const AnnouncementSubCommentSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  announcementId: { type: String, required: true },
  commentId: { type: String, required: true },
  comment: { type: String, required: true },
  popularity: { type: Number, required: false, default: 0 },
  replyToId: { type: String, required: false, default: null },
});

AnnouncementSubCommentSchema.index({ recordStatus: -1, announcementId: -1, commentId: -1, popularity: -1 });

AnnouncementSubCommentSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementSubCommentSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementSubCommentSchema.methods.minify = async function (
  this: AnnouncementSubCommentDocument
) {
  const response: AnnouncementSubComment & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    announcementId: this.announcementId,
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