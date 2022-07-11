import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";

export interface Follow extends BaseEntity {
  followerId: string;
  followingId: string;
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
});

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
    //ignore
    followerUser: null,
    followingUser: null,
  };
  return response;
};
