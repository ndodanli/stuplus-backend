import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface GroupMessage extends BaseEntity {
  from: string; //user id
  message: String;
  forwarded: Boolean;
  forwardedAt: Date;
  readed: Boolean;
  readedAt: Date;
  groupChatId: String;
}

export interface GroupMessageDocument extends GroupMessage, Document {
  minify(): unknown;
}

export const GroupMessageSchema: Schema = new Schema({
  from: { type: String, required: true },
  message: { type: String, required: true },
  forwarded: { type: Boolean, required: true, default: false },
  forwardedAt: { type: Date, required: false },
  readed: { type: Boolean, required: true, default: false },
  readedAt: { type: Date, required: false },
  groupChatId: { type: String, required: true },
});

GroupMessageSchema.pre("save", function (next) {
  //
  next()
})

GroupMessageSchema.pre("deleteOne", function (next) {
  //
  next()
});

GroupMessageSchema.methods.minify = async function (
  this: GroupMessageDocument
) {
  const response: GroupMessage & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    from: this.from,
    message: this.message,
    forwarded: this.forwarded,
    forwardedAt: this.forwardedAt,
    readed: this.readed,
    readedAt: this.readedAt,
    groupChatId: this.groupChatId
  };
  return response;
};