import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";

export interface Message extends BaseEntity {
  ownerId: string; //user id
  text: string;
  forwarded: boolean;
  forwardedAt: Date;
  readed: boolean;
  readedAt: Date;
  files: MessageFiles[];
  replyToId?: string; //message id
  deletedForUserIds: string[];
  deletedForUserDate?: Date;
  chatId: string;
  //ignore
  owner?: User | null; //ignore
  replyTo?: ReplyToDTO | null; //ignore
}


export class ReplyToDTO {
  messageId: string;
  messageOwnerId: string;
  messageOwner: User | undefined;
  text: string;
  files: MessageFiles[];
  constructor(messageId: string, messageOwnerId: string, messageOwner: User | undefined = undefined, text: string, files: MessageFiles[]) {
    this.messageId = messageId;
    this.messageOwnerId = messageOwnerId;
    this.messageOwner = messageOwner;
    this.text = text;
    this.files = files;
  }
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
  ownerId: { type: String, required: true },
  text: { type: String, required: false, default: null },
  forwarded: { type: Boolean, required: true, default: false },
  forwardedAt: { type: Date, required: false, default: null },
  readed: { type: Boolean, required: true, default: false },
  readedAt: { type: Date, required: false, default: null },
  chatId: { type: String, required: true },
  files: {
    type: Array.of(new Schema({
      url: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
    })), required: false, default: []
  },
  replyToId: { type: String, required: false, default: null },
  deletedForUserIds: { type: Array.of(String), required: false, default: [] },
  deletedForUserDate: { type: Date, required: false, default: null },
});

MessageSchema.index({ recordStatus: -1, createdAt: -1 });

// MessageSchema.index({ text: "text", description: "text" });

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
    ownerId: this.ownerId,
    text: this.text,
    forwarded: this.forwarded,
    forwardedAt: this.forwardedAt,
    readed: this.readed,
    readedAt: this.readedAt,
    files: this.files,
    replyToId: this.replyToId,
    chatId: this.chatId,
    deletedForUserIds: this.deletedForUserIds,
    deletedForUserDate: this.deletedForUserDate,
    recordDeletionDate: this.recordDeletionDate,
    //ignore
    replyTo: null, //ignore
  };
  return response;
};