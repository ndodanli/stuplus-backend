import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface Follower extends BaseEntity {
  followerId: string;
  followingId: string;
}

export interface FollowerDocument extends Follower, Document {
  minify(): unknown;
}

export const FollowerSchema: Schema = new Schema({
  followerId: { type: String, required: true },
  followingId: { type: String, required: true },
});

FollowerSchema.pre("save", function (next) {
  //
  next()
})

FollowerSchema.pre("deleteOne", function (next) {
  //
  next()
});

FollowerSchema.methods.minify = async function (
  this: FollowerDocument
) {
  const response: Follower & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    followerId: this.followerId,
    followingId: this.followingId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};
