import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface GroupMessageForward extends BaseEntity {
  messageId: string;
  forwardedTo: String; //user id
}

export interface GroupMessageForwardDocument extends GroupMessageForward, Document {
  minify(): unknown;
}

export const GroupMessageForwardSchema: Schema = new Schema({
  messageId: { type: String, required: true },
  forwardedTo: { type: String, required: true }
});

GroupMessageForwardSchema.pre("save", function (next) {
  //
  next()
})

GroupMessageForwardSchema.pre("deleteOne", function (next) {
  //
  next()
});

GroupMessageForwardSchema.methods.minify = async function (
  this: GroupMessageForwardDocument
) {
  const response: GroupMessageForward & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    messageId: this.messageId,
    forwardedTo: this.forwardedTo,
  };
  return response;
};