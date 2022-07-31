import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface GroupMessageRead extends BaseEntity {
  groupChatId: string;
  messageId: string;
  readedBy: String; //user id
}

export interface GroupMessageReadDocument extends GroupMessageRead, Document {
  minify(): unknown;
}

export const GroupMessageReadSchema: Schema = new Schema({
  groupChatId: { type: String, required: true },
  messageId: { type: String, required: true },
  readedBy: { type: String, required: true }
});

GroupMessageReadSchema.index({ recordStatus: -1, readedBy: -1, groupChatId: -1, createdAt: -1 });

GroupMessageReadSchema.pre("save", function (next) {
  //
  next()
})

GroupMessageReadSchema.pre("deleteOne", function (next) {
  //
  next()
});

GroupMessageReadSchema.methods.minify = async function (
  this: GroupMessageReadDocument
) {
  const response: GroupMessageRead & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    messageId: this.messageId,
    readedBy: this.readedBy,
    recordDeletionDate: this.recordDeletionDate,
    groupChatId: this.groupChatId
  };
  return response;
};