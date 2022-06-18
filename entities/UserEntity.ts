import { Document, Schema } from "mongoose";
import { Gender } from "../enums/enums";
import BaseEntity from "./BaseEntity";

export interface User extends BaseEntity {
  email: string;
  password: string;
  username: string;
  role: Number;
  schoolEmail: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  schoolId: string;
  schoolName: string | null; //ignore
  facultyId: string;
  facultyName: string | null; //ignore
  departmentId: string;
  departmentName: string | null; //ignore
  isAccEmailConfirmed: Boolean;
  isSchoolEmailConfirmed: Boolean;
  accEmailConfirmation: EmailConfirmation;
  schoolEmailConfirmation: EmailConfirmation;
  fpEmailConfirmation: EmailConfirmation;
  grade: Number;
  profilePhotoUrl: string;
  gender: Gender;
  chatSettings: object,
  notificationSettings: NotificationSettings,
  roomIds: Array<string>,
  blockedUserIds: Array<string>,
  interestIds: Array<string>,
  friendIds: Array<string>,
  takenFriendRequestIds: Array<string>,
  sendedFriendRequestIds: Array<string>,
  externalLogins: Array<ExternalLogin>,
}

export class ExternalLogin {
  providerId: string | null;
  providerName: string | null;
  firstName: string | null;
  lastName: string | null;

  constructor() {
    this.providerId = null;
    this.providerName = null;
    this.firstName = null;
    this.lastName = null;
  }
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
  schoolEmail: { type: String, required: false, default: null },
  password: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: Number, required: true },
  schoolId: { type: String, required: false, default: null },
  facultyId: { type: String, required: false, default: null },
  departmentId: { type: String, required: false, default: null },
  grade: { type: Number, required: false, default: null },
  firstName: { type: String, required: false, default: null },
  lastName: { type: String, required: false, default: null },
  phoneNumber: { type: String, required: false, default: null },
  profilePhotoUrl: { type: String, required: false, default: null },
  gender: { type: Number, required: true, default: Gender.NotDefined },
  chatSettings: { type: Object, required: true, default: {} },
  notificationSettings: { type: Object, required: true, default: {} },
  isAccEmailConfirmed: { type: Boolean, required: true, default: false },
  isSchoolEmailConfirmed: { type: Boolean, required: true, default: false },
  accEmailConfirmation: { type: Object, required: true, default: { code: null, expiresAt: null } },
  schoolEmailConfirmation: { type: Object, required: true, default: { code: null, expiresAt: null } },
  fpEmailConfirmation: { type: Object, required: true, default: { code: null, expiresAt: null } },
  roomIds: { type: Array.of(String), required: true, default: [] },
  blockedUserIds: { type: Array.of(String), required: true, default: [] },
  interestIds: { type: Array.of(String), required: true, default: [] },
  friendIds: { type: Array.of(String), required: true, default: [] },
  takenFriendRequestIds: { type: Array.of(String), required: true, default: [] },
  sendedFriendRequestIds: { type: Array.of(String), required: true, default: [] },
  externalLogins: {
    type: Array.of(new Schema({
      providerId: String,
      providerName: String,
      firstName: String,
      lastName: String
    })), required: true, default: []
  },
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
    username: this.username,
    role: this.role,
    schoolEmail: this.schoolEmail,
    firstName: this.firstName,
    lastName: this.lastName,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    phoneNumber: this.phoneNumber,
    schoolId: this.schoolId,
    schoolName: null,
    facultyId: this.facultyId,
    facultyName: null,
    departmentId: this.departmentId,
    departmentName: null,
    isAccEmailConfirmed: this.isAccEmailConfirmed,
    isSchoolEmailConfirmed: this.isSchoolEmailConfirmed,
    fpEmailConfirmation: this.fpEmailConfirmation,
    accEmailConfirmation: this.accEmailConfirmation,
    schoolEmailConfirmation: this.schoolEmailConfirmation,
    notificationSettings: this.notificationSettings,
    grade: this.grade,
    profilePhotoUrl: this.profilePhotoUrl,
    gender: this.gender,
    chatSettings: this.chatSettings,
    roomIds: this.roomIds,
    blockedUserIds: this.blockedUserIds,
    interestIds: this.interestIds,
    friendIds: this.friendIds,
    takenFriendRequestIds: this.takenFriendRequestIds,
    sendedFriendRequestIds: this.sendedFriendRequestIds,
    externalLogins: this.externalLogins,
  };
  return response;
};