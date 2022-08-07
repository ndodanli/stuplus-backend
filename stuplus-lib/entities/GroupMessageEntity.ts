import { Document, Schema } from "mongoose";
import { MessageType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { MessageFiles, ReplyToDTO } from "./MessageEntity";
import { User } from "./UserEntity";

export interface GroupMessage extends BaseEntity {
  ownerId: string; //user id
  text: string;
  forwarded: boolean;
  forwardedAt: Date;
  readed: boolean;
  readedAt: Date;
  replyToId?: string; //message id
  files: MessageFiles[];
  deletedForUserIds: string[];
  deletedForUserDate?: Date;
  groupChatId: string;
  type: MessageType;
  //ignore
  owner?: LastMessageOwnerDTO | null; //ignore
  replyTo?: ReplyToDTO | null;
}

export class LastMessageOwnerDTO {
  _id?: string | null;
  username?: string | null;
  avatarKey?: string | null;
  profilePhotoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface GroupMessageDocument extends GroupMessage, Document {
  minify(): unknown;
}

export const GroupMessageSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  text: { type: String, required: false, default: null },
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
  deletedForUserIds: { type: Array.of(String), required: false, default: [] },
  deletedForUserDate: { type: Date, required: false, default: null },
  groupChatId: { type: String, required: true },
  type: { type: Number, required: true },
});

GroupMessageSchema.index({ recordStatus: -1, groupChatId: -1, type: -1, deletedForUserIds: -1 });

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
    ownerId: this.ownerId,
    text: this.text,
    forwarded: this.forwarded,
    forwardedAt: this.forwardedAt,
    readed: this.readed,
    readedAt: this.readedAt,
    replyToId: this.replyToId,
    files: this.files,
    groupChatId: this.groupChatId,
    recordDeletionDate: this.recordDeletionDate,
    deletedForUserIds: this.deletedForUserIds,
    deletedForUserDate: this.deletedForUserDate,
    type: this.type,
    //ignore
    owner: null,
    replyTo: null
  };
  return response;
};