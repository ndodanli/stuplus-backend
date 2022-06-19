import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface GroupChatUser extends BaseEntity {
  userId: string; //user id
  groupChatId: string; //chat id
}

export interface GroupChatUserDocument extends GroupChatUser, Document {
  minify(): unknown;
}

export const GroupChatUserSchema: Schema = new Schema({
  userId: { type: String, required: true },
  groupChatId: { type: String, required: true }
});

GroupChatUserSchema.pre("save", function (next) {
  //
  next()
})

GroupChatUserSchema.pre("deleteOne", function (next) {
  //
  next()
});

GroupChatUserSchema.methods.minify = async function (
  this: GroupChatUserDocument
) {
  const response: GroupChatUser & { _id: string } = {
    _id: this._id,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    userId: this.userId,
    groupChatId: this.groupChatId,
  };
  return response;
};