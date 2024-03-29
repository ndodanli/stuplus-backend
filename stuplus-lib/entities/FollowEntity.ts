import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";

export interface Follow extends BaseEntity {
  followerId: string;
  followingId: string;
  followingUsername: string;
  followingFirstName: string;
  followingLastName: string;
  //ignore
  followerUser?: User | null;
  followingUser?: User | null;
}

export interface FollowDocument extends Follow, Document {
  minify(): unknown;
}

export const FollowSchema: Schema = new Schema({
  followerId: { type: String, required: true },
  followingId: { type: String, required: true },
  followingUsername: { type: String, required: true },
  followingFirstName: { type: String, required: true },
  followingLastName: { type: String, required: true },
});

FollowSchema.index({ recordStatus: -1, followerId: -1, followingId: -1, followingUsername: -1, followingFirstName: -1, followingLastName: -1 });

FollowSchema.pre("save", function (next) {
  //
  next()
})

FollowSchema.pre("deleteOne", function (next) {
  //
  next()
});

FollowSchema.methods.minify = async function (
  this: FollowDocument
) {
  const response: Follow & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    followerId: this.followerId,
    followingId: this.followingId,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    followingUsername: this.followingUsername,
    followingFirstName: this.followingFirstName,
    followingLastName: this.followingLastName,
    //ignore
    followerUser: null,
    followingUser: null,
  };
  return response;
};
