import { Document, Model, Schema } from "mongoose";
import BaseModel from "./BaseModel";

export interface User extends BaseModel {
  email: string;
  password: string;
  role: Number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  schoolId: String;
  schoolName: String | null; //ignore
  facultyId: String;
  facultyName: String | null; //ignore
  departmentId: String;
  departmentName: String | null; //ignore
  emailConfirmation: EmailConfirmation;
  grade: Number;
  profilePhotoUrl: string;
  chatSettings: object,
  notificationSettings: NotificationSettings,
  roomIds: Array<String>,
  blockedUserIds: Array<String>,
  interestIds: Array<String>,
  friendIds: Array<String>,
  takenFriendRequestIds: Array<String>,
  sendedFriendRequestIds: Array<String>,
}

export class EmailConfirmation {
  code: Number | null;
  expiresAt: Date | null;
  constructor() {
    this.code = null;
    this.expiresAt = null;
  }
}

export class NotificationSettings {
  test1: Boolean | null;
  test2: Boolean | null;
  constructor() {
    this.test1 = null;
    this.test2 = null;
  }
}
export interface UserDocument extends User, Document {
  minify(): unknown;
}

export const UserSchema: Schema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Number, required: true },
  schoolId: { type: String, required: true },
  facultyId: { type: String, required: true },
  departmentId: { type: String, required: true },
  grade: { type: Number, required: true },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  phoneNumber: { type: String, required: false },
  profilePhotoUrl: { type: String, required: false },
  chatSettings: { type: Object, required: true, default: {} },
  notificationSettings: { type: Object, required: true, default: {} },
  emailConfirmation: { type: Object, required: true, default: { code: null, expiresAt: null } },
  roomIds: { type: Array.of(String), required: true, default: [] },
  blockedUserIds: { type: Array.of(String), required: true, default: [] },
  interestIds: { type: Array.of(String), required: true, default: [] },
  friendIds: { type: Array.of(String), required: true, default: [] },
  takenFriendRequestIds: { type: Array.of(String), required: true, default: [] },
  sendedFriendRequestIds: { type: Array.of(String), required: true, default: [] },
});

// Just to prove that hooks are still functioning as expected
UserSchema.pre("save", function (next) {
  //
  next()
})

UserSchema.pre("deleteOne", function (next) {
  //
  next()
});


// Add a method. In this case change the returned object
UserSchema.methods.minify = async function (
  this: UserDocument
) {
  const response: User & { _id: string } = {
    _id: this._id,
    email: this.email,
    password: this.password,
    role: this.role,
    firstName: this.firstName,
    lastName: this.lastName,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    title: this.title,
    phoneNumber: this.phoneNumber,
    schoolId: this.schoolId,
    schoolName: null,
    facultyId: this.facultyId,
    facultyName: null,
    departmentId: this.departmentId,
    departmentName: null,
    emailConfirmation: this.emailConfirmation,
    notificationSettings: this.notificationSettings,
    grade: this.grade,
    profilePhotoUrl: this.profilePhotoUrl,
    chatSettings: this.chatSettings,
    roomIds: this.roomIds,
    blockedUserIds: this.blockedUserIds,
    interestIds: this.interestIds,
    friendIds: this.friendIds,
    takenFriendRequestIds: this.takenFriendRequestIds,
    sendedFriendRequestIds: this.sendedFriendRequestIds,
  };
  return response;
};