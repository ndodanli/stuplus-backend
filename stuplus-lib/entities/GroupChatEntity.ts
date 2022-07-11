import { Document, Schema } from "mongoose";
import { GroupChatType } from "../../stuplus-lib/enums/enums_socket";
import BaseEntity from "./BaseEntity";
import { GroupMessage } from "./GroupMessageEntity";
export interface GroupChat extends BaseEntity {
  ownerId: string; //user id
  title: string;
  type: GroupChatType;
  about: string;
  coverImageUrl: string;
  adminIds: string[];
  avatarKey: string;
  //ignore
  lastMessage?: GroupMessage | null; //ignore
}

export interface GroupChatDocument extends GroupChat, Document {
  minify(): unknown;
}

export const GroupChatSchema: Schema = new Schema({
  ownerId: { type: String, required: true }, //user id
  title: { type: String, required: true },
  type: { type: Number, required: true },
  coverImageUrl: { type: String, required: false, default: null },
  adminIds: { type: Array.of(String), required: false, default: [] },
  avatarKey: { type: String, required: false, default: null },
  about: { type: String, required: false, default: null },
});

GroupChatSchema.pre("save", function (next) {
  //
  next()
})

GroupChatSchema.pre("deleteOne", function (next) {
  //
  next()
});

GroupChatSchema.methods.minify = async function (
  this: GroupChatDocument
) {
  const response: GroupChat & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ownerId: this.ownerId,
    title: this.title,
    type: this.type,
    adminIds: this.adminIds,
    avatarKey: this.avatarKey,
    coverImageUrl: this.coverImageUrl,
    recordDeletionDate: this.recordDeletionDate,
    about: this.about,
    //ignore
    lastMessage: null, //ignore
  };
  return response;
};