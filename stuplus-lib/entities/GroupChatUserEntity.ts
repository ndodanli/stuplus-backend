import { Document, Schema } from "mongoose";
import { GroupChatUserRole } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface GroupChatUser extends BaseEntity {
  userId: string; //user id
  groupChatId: string; //chat id
  groupRole: GroupChatUserRole;
}

export interface GroupChatUserDocument extends GroupChatUser, Document {
  minify(): unknown;
}

export const GroupChatUserSchema: Schema = new Schema({
  userId: { type: String, required: true },
  groupChatId: { type: String, required: true },
  groupRole: { type: String, required: true },
});

GroupChatUserSchema.index({ groupChatId: 1 })

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
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    userId: this.userId,
    groupChatId: this.groupChatId,
    groupRole: this.groupRole,
  };
  return response;
};