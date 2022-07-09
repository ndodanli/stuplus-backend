import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface Message extends BaseEntity {
  from: string; //user id
  message: string;
  forwarded: boolean;
  forwardedAt: Date;
  readed: boolean;
  readedAt: Date;
  files: MessageFiles[];
  replyToId?: string; //message id
  chatId: string;
  //ignore
  replyTo?: Message | null;
}
export class MessageFiles {
  url: string | null;
  mimeType: string | null;
  size: number | null;
  constructor(url: string, mimeType: string, size: number) {
    this.url = url;
    this.mimeType = mimeType;
    this.size = size;
  }
}
export interface MessageDocument extends Message, Document {
  minify(): unknown;
}

export const MessageSchema: Schema = new Schema({
  from: { type: String, required: true },
  message: { type: String, required: true },
  forwarded: { type: Boolean, required: true, default: false },
  forwardedAt: { type: Date, required: false },
  readed: { type: Boolean, required: true, default: false },
  readedAt: { type: Date, required: false },
  chatId: { type: String, required: true },
  files: {
    type: Array.of(new Schema({
      url: { type: String, required: true },
      mimeType: { type: String, required: true },
    })), required: false, default: []
  },
  replyTo: { type: String, required: false, default: null },
});

MessageSchema.index({ message: 'text' });

MessageSchema.pre("save", function (next) {
  //
  next()
})

MessageSchema.pre("deleteOne", function (next) {
  //
  next()
});

MessageSchema.methods.minify = async function (
  this: MessageDocument
) {
  const response: Message & { _id: string } = {
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
    files: this.files,
    replyToId: this.replyToId,
    chatId: this.chatId,
    //ignore
    replyTo: null, //ignore
  };
  return response;
};