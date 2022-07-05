import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface Message extends BaseEntity {
  from: string; //user id
  message: String;
  forwarded: Boolean;
  forwardedAt: Date;
  readed: Boolean;
  readedAt: Date;
  chatId: String;
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
});

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
    chatId: this.chatId
  };
  return response;
};