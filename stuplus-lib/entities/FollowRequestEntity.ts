import { Document, Schema } from "mongoose";
import { FollowStatus } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";

export interface FollowRequest extends BaseEntity {
  ownerId: string;
  requestedId: string; //user id
  status: FollowStatus;
  //ignore
  ownerUser?: User | null;
  requestedUser?: User | null;
}

export interface FollowRequestDocument extends FollowRequest, Document {
  minify(): unknown;
}

export const FollowRequestSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  requestedId: { type: String, required: true },
  status: { type: Number, required: false, default: FollowStatus.Pending },
});

FollowRequestSchema.pre("save", function (next) {
  //
  next()
})

FollowRequestSchema.pre("deleteOne", function (next) {
  //
  next()
});

FollowRequestSchema.methods.minify = async function (
  this: FollowRequestDocument
) {
  const response: FollowRequest & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    requestedId: this.requestedId,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    //ignore
    ownerUser: null,
    requestedUser: null,
  };
  return response;
};
