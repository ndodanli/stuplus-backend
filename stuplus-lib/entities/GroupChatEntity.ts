import { Document, Schema } from "mongoose";
import { GroupChatType } from "../../stuplus-lib/enums/enums_socket";
import BaseEntity from "./BaseEntity";
export interface GroupChat extends BaseEntity {
  ownerId: string; //user id
  title: string;
  type: GroupChatType;
}

export interface GroupChatDocument extends GroupChat, Document {
  minify(): unknown;
}

export const GroupChatSchema: Schema = new Schema({
  ownerId: { type: String, required: true }, //user id
  title: { type: String, required: true },
  type: { type: Number, required: true },
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
  };
  return response;
};