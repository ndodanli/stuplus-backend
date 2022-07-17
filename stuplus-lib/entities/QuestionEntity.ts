import { Document, Schema } from "mongoose";
import { LikeType } from "../enums/enums";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";
import mongoose_fuzzy_searching from "@imranbarbhuiya/mongoose-fuzzy-searching";

export interface Question extends BaseEntity {
  ownerId: string; //user id
  coverImageUrl: string;
  title: string;
  titlesch: string;
  relatedSchoolIds: Array<string>;
  text: string;
  isActive: boolean;
  fromDate: Date | null;
  toDate: Date | null;
  score: number;
  hashTags: string[];
  //ignore
  owner?: User | null; // ignore
  relatedSchools: object[] | null; // ignore
  likeCount: number; // ignore
  likeType: LikeType; // ignore
  commentCount: number; // ignore
  comments: object[]; // ignore
}

export interface QuestionDocument extends Question, Document {
  minify(): unknown;
}

export const QuestionSchema: Schema = new Schema({
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
});

QuestionSchema.plugin(mongoose_fuzzy_searching,
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

QuestionSchema.pre("save", function (next) {
  //
  next()
})

QuestionSchema.pre("findOne", function (next) {
  console.log("pre findOne");
  next()


})

QuestionSchema.pre("deleteOne", function (next) {
  //
  next()
});

QuestionSchema.methods.minify = async function (
  this: QuestionDocument
) {
  const response: Question & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    ownerId: this.ownerId,
    coverImageUrl: this.coverImageUrl,
    title: this.title,
    titlesch: this.titlesch,
    relatedSchoolIds: this.relatedSchoolIds,
    text: this.text,
    isActive: this.isActive,
    fromDate: this.fromDate,
    toDate: this.toDate,
    score: this.score,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    recordDeletionDate: this.recordDeletionDate,
    hashTags: this.hashTags,
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