import { Document, Schema } from "mongoose";
import { GroupChatType } from "../../stuplus-lib/enums/enums_socket";
import BaseEntity from "./BaseEntity";
import { GroupMessage } from "./GroupMessageEntity";
import mongoose_fuzzy_searching from "@imranbarbhuiya/mongoose-fuzzy-searching";
import { Department } from "./DepartmentEntity";
import { School } from "./SchoolEntity";
export interface GroupChat extends BaseEntity {
  ownerId: string; //user id
  title: string;
  titlesch: string;
  type: GroupChatType;
  about: string;
  coverImageUrl: string;
  avatarKey: string;
  hashTags: string[];
  schoolId: string;
  departmentId: string;
  grade: number;
  secondaryEducation: boolean;
  popularity: number;
  //ignore
  lastMessage?: GroupMessage | null; //ignore
  school?: School | null;
  department?: Department | null;
}

export interface GroupChatDocument extends GroupChat, Document {
  minify(): unknown;
}

export const GroupChatSchema: Schema = new Schema({
  ownerId: { type: String, required: true }, //user id
  title: { type: String, required: true },
  titlesch: { type: String, required: true },
  type: { type: Number, required: true },
  coverImageUrl: { type: String, required: false, default: null },
  avatarKey: { type: String, required: false, default: null },
  about: { type: String, required: false, default: null },
  hashTags: { type: Array.of(String), required: false, default: [] },
  schoolId: { type: String, required: false, default: null },
  departmentId: { type: String, required: false, default: null },
  grade: { type: Number, required: false, default: null },
  secondaryEducation: { type: Boolean, required: false, default: null },
  popularity: { type: Number, required: false, default: 0 },
});

GroupChatSchema.index({ recordStatus: 1, popularity: -1 });

GroupChatSchema.plugin(mongoose_fuzzy_searching,
  {
    fields: [
      {
        name: 'hashTags',
        minSize: 3,
        weight: 3,
      },
      {
        name: 'titlesch',
        minSize: 3,
        weight: 1,
      }
    ]
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
    titlesch: this.titlesch,
    type: this.type,
    avatarKey: this.avatarKey,
    coverImageUrl: this.coverImageUrl,
    recordDeletionDate: this.recordDeletionDate,
    hashTags: this.hashTags,
    about: this.about,
    schoolId: this.schoolId,
    departmentId: this.departmentId,
    grade: this.grade,
    secondaryEducation: this.secondaryEducation,
    popularity: this.popularity,
    //ignore
    lastMessage: null, //ignore
    school: null,
    department: null,
  };
  return response;
};