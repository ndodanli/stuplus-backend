import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";
import mongoose_fuzzy_searching from "@imranbarbhuiya/mongoose-fuzzy-searching";
import { ImageFiles } from "./QuestionEntity";

export interface Announcement extends BaseEntity {
  ownerId: string; //user id
  title: string;
  relatedSchoolIds: Array<string>;
  text: string;
  isActive: boolean;
  fromDate: Date | null;
  toDate: Date | null;
  score: number;
  hashTags: string[];
  titlesch: string;
  images: ImageFiles[];
  //ignore
  owner?: User | null; // ignore
  relatedSchools: object[] | null; // ignore
  likeCount: number; // ignore
  likeType: LikeType; // ignore
  commentCount: number; // ignore
  comments: object[]; // ignore
}

export interface AnnouncementDocument extends Announcement, Document {
  minify(): unknown;
}

export const AnnouncementSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  coverImageUrl: { type: String, required: false, default: null },
  title: { type: String, required: true },
  titlesch: { type: String, required: true },
  relatedSchoolIds: { type: Array.of(String), required: false, default: [] },
  text: { type: String, required: true },
  isActive: { type: Boolean, required: false, default: true },
  fromDate: { type: Date, required: false, default: null },
  toDate: { type: Date, required: false, default: null },
  score: { type: Number, required: false, default: 0 },
  hashTags: { type: Array.of(String), required: false, default: [] },
  images: {
    type: Array.of(new Schema({
      url: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
      isCompressed: { type: Boolean, required: true },
    })), required: false, default: []
  },
});

AnnouncementSchema.index({ recordStatus: 1, createdAt: -1 });

AnnouncementSchema.plugin(mongoose_fuzzy_searching,
  {
    fields: [
      {
        name: 'hashTags',
        minSize: 4,
        weight: 3,
      },
      {
        name: 'titlesch',
        minSize: 4,
        weight: 2,
      }
    ]
  });

AnnouncementSchema.pre("save", function (next) {
  //
  next()
})

AnnouncementSchema.pre("findOne", function (next) {
  console.log("pre findOne");
  next()


})

AnnouncementSchema.pre("deleteOne", function (next) {
  //
  next()
});

AnnouncementSchema.methods.minify = async function (
  this: AnnouncementDocument
) {
  const response: Announcement & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    coverImageUrl: this.coverImageUrl,
    title: this.title,
    relatedSchoolIds: this.relatedSchoolIds,
    text: this.text,
    isActive: this.isActive,
    fromDate: this.fromDate,
    toDate: this.toDate,
    score: this.score,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    hashTags: this.hashTags,
    titlesch: this.titlesch,
    images: this.images,
    //ignore
    owner: null, // ignore
    relatedSchools: null, // ignore
    likeCount: 0, // ignore
    likeType: LikeType.None, // ignore
    commentCount: 0, // ignore
    comments: [], // ignore
  };
  return response;
};