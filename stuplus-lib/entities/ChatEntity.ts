import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
export interface Chat extends BaseEntity {
  ownerId: string; //user id
  participant: String;
}

export interface ChatDocument extends Chat, Document {
  minify(): unknown;
}

export const ChatSchema: Schema = new Schema({
  ownerId: { type: String, required: true }, //user id
  participant: { type: String, required: true },
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
    participant: this.participant,
  };
  return response;
};