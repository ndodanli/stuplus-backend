import { Document, Schema } from "mongoose";
import { ReportType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
export interface Report extends BaseEntity {
  ownerId: string; //user id
  reportType: ReportType[];
  details: string;
  userId: string;
  messageId: string;
  messageText: string;
  commentId: string;
  commentText: string;
  questionId: string;
  questionText: string;
  announcementId: string;
  announcementText: string;
  imageUrls: string[];
}

export interface ReportDocument extends Report, Document {
  minify(): unknown;
}

export const ReportSchema: Schema = new Schema({
  ownerId: { type: String, required: true }, //user id
  reportType: { type: Array.of(String), required: true },
  details: { type: String, required: false, default: null },
  userId: { type: String, required: false, default: null },
  messageId: { type: String, required: false, default: null },
  messageText: { type: String, required: false, default: null },
  commentId: { type: String, required: false, default: null },
  commentText: { type: String, required: false, default: null },
  announcementId: { type: String, required: false, default: null },
  announcementText: { type: String, required: false, default: null },
  questionId: { type: String, required: false, default: null },
  questionText: { type: String, required: false, default: null },
  imageUrls: { type: Array.of(String), required: false, default: null },
});

// ReportSchema.index({ recordStatus: -1 });

ReportSchema.pre("save", function (next) {
  //
  next()
})

ReportSchema.pre("deleteOne", function (next) {
  //
  next()
});

ReportSchema.methods.minify = async function (
  this: ReportDocument
) {
  const response: Report & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ownerId: this.ownerId,
    reportType: this.reportType,
    details: this.details,
    userId: this.userId,
    messageId: this.messageId,
    messageText: this.messageText,
    commentId: this.commentId,
    commentText: this.commentText,
    questionId: this.questionId,
    questionText: this.questionText,
    announcementId: this.announcementId,
    announcementText: this.announcementText,
    recordDeletionDate: this.recordDeletionDate,
    imageUrls: this.imageUrls,
  };
  return response;
};