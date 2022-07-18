import { Document, Schema } from "mongoose";
import { NotificationType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";
export interface Notification extends BaseEntity {
  ownerId: string; //owner user id
  relatedUserId: string; //sender user id
  groupChatId?: string | null; //group chat id
  readed: boolean; //is readed
  type: NotificationType;
  //ignore
  relatedUser?: User | null; //ignore

}

export interface NotificationDocument extends Notification, Document {
  minify(): unknown;
}

export const NotificationSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  relatedUserId: { type: String, required: false, default: null },
  groupChatId: { type: String, required: false, default: null },
  readed: { type: Boolean, required: false, default: false },
  type: { type: Number, required: true },
});

NotificationSchema.index({ recordStatus: 1 });

NotificationSchema.pre("save", function (next) {
  //
  next()
})

NotificationSchema.pre("deleteOne", function (next) {
  //
  next()
});

NotificationSchema.methods.minify = async function (
  this: NotificationDocument
) {
  const response: Notification & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    relatedUserId: this.relatedUserId,
    ownerId: this.ownerId,
    groupChatId: this.groupChatId,
    readed: this.readed,
    type: this.type,
    relatedUser: this.relatedUser,
  };
  return response;
};