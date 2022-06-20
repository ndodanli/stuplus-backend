import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";
import { User } from "./UserEntity";

export interface Announcement extends BaseEntity {
  ownerId: string; //user id
  coverImageUrl: string;
  title: string;
  relatedSchoolIds: Array<string>;
  text: string;
  isActive: boolean;
  fromDate: Date | null;
  toDate: Date | null;
  //ignore
  owner?: User | null; // ignore
  relatedSchools: object[] | null; // ignore
  likeCount: number; // ignore
  commentCount: number; // ignore
}

export interface AnnouncementDocument extends Announcement, Document {
  minify(): unknown;
}

// export class AnnouncementEntityDTO implements Announcement {
//   ownerId: string;
//   coverImageUrl: string;
//   title: string;
//   relatedSchoolIds: string[];
//   text: string;
//   isActive: boolean;
//   fromDate: Date | null;
//   toDate: Date | null;
//   createdAt: Date;
//   updatedAt: Date;

// }

export const AnnouncementSchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  coverImageUrl: { type: String, required: false, default: null },
  title: { type: String, required: true },
  relatedSchoolIds: { type: Array.of(String), required: false, default: null },
  text: { type: String, required: true },
  isActive: { type: Boolean, required: false, default: true },
  fromDate: { type: Date, required: false, default: null },
  toDate: { type: Date, required: false, default: null },

});

// Just to prove that hooks are still functioning as expected
AnnouncementSchema.pre("save", function (next) {
  //
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
    ownerId: this.ownerId,
    coverImageUrl: this.coverImageUrl,
    title: this.title,
    relatedSchoolIds: this.relatedSchoolIds,
    text: this.text,
    isActive: this.isActive,
    fromDate: this.fromDate,
    toDate: this.toDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    //ignore
    owner: null, // ignore
    relatedSchools: null, // ignore
    likeCount: 0, // ignore
    commentCount: 0, // ignore

  };
  return response;
};