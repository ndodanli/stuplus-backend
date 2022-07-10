import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { MessageFiles, ReplyToDTO } from "./MessageEntity";

export interface GroupMessage extends BaseEntity {
  fromId: string; //user id
  text: string;
  forwarded: boolean;
  forwardedAt: Date;
  readed: boolean;
  readedAt: Date;
  replyToId?: string; //message id
  files: MessageFiles[];
  groupChatId: string;
  //ignore
  replyTo?: ReplyToDTO | null;
}

export interface GroupMessageDocument extends GroupMessage, Document {
  minify(): unknown;
}

export const GroupMessageSchema: Schema = new Schema({
  fromId: { type: String, required: true },
  text: { type: String, required: true },
  forwarded: { type: Boolean, required: true, default: false },
  forwardedAt: { type: Date, required: false },
  readed: { type: Boolean, required: true, default: false },
  readedAt: { type: Date, required: false },
  files: {
    type: Array.of(new Schema({
      url: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
    })), required: false, default: []
  },
  replyToId: { type: String, required: false, default: null },
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
    fromId: this.fromId,
    text: this.text,
    forwarded: this.forwarded,
    forwardedAt: this.forwardedAt,
    readed: this.readed,
    readedAt: this.readedAt,
    replyToId: this.replyToId,
    files: this.files,
    groupChatId: this.groupChatId
  };
  return response;
};