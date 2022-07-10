import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { Message, MessageDocument } from "./MessageEntity";
import { User, UserDocument } from "./UserEntity";
export interface Chat extends BaseEntity {
  ownerId: string; //user id
  participantId: string;
  //ignore
  owner?: UserDocument | null; //ignore
  participant?: UserDocument | null; //ignore
  unreadMessageCount: number;
  lastMessage?: MessageDocument | null;
}

export interface ChatDocument extends Chat, Document {
  minify(): unknown;
}

export const ChatSchema: Schema = new Schema({
  ownerId: { type: String, required: true }, //user id
  participantId: { type: String, required: true },
});

ChatSchema.pre("save", function (next) {
  //
  next()
})

ChatSchema.pre("deleteOne", function (next) {
  //
  next()
});

ChatSchema.methods.minify = async function (
  this: ChatDocument
) {
  const response: Chat & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ownerId: this.ownerId,
    participantId: this.participantId, //ignore
    //ignore
    owner: null, //ignore
    participant: null, //ignore
    unreadMessageCount: 0, //ignore
    lastMessage: null, //ignore
  };
  return response;
};