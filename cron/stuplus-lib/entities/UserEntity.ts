import { Document, Schema } from "mongoose";
import { FollowLimitation, Gender, RecordStatus } from "../enums/enums";
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
  schoolId: string | null;
  facultyId: string | null;
  departmentId: string | null;
  isAccEmailConfirmed: Boolean;
  isSchoolEmailConfirmed: Boolean;
  accEmailConfirmation: EmailConfirmation;
  schoolEmailConfirmation: EmailConfirmation;
  fpEmailConfirmation: EmailConfirmation;
  grade: Number;
  profilePhotoUrl: string;
  gender: Gender;
  chatSettings: object;
  notificationSettings: NotificationSettings;
  blockedUserIds: Array<string>;
  interestIds: Array<string>;
  externalLogins: Array<ExternalLogin>;
  relatedSchoolIds: Array<string>;
  avatarKey: string;
  about: string;
  privacySettings: PrivacySettings;
  //ignore
  schoolName: string | null; //ignore
  facultyName: string | null; //ignore
  departmentName: string | null; //ignore
  followerCount: number; //ignore
  followingCount: number; //ignore
}

export class PrivacySettings {
  followLimitation: FollowLimitation = FollowLimitation.None;
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
  gender: { type: Number, required: true },
  chatSettings: { type: Object, required: false, default: {} },
  notificationSettings: { type: Object, required: false, default: {} },
  isAccEmailConfirmed: { type: Boolean, required: false, default: false },
  isSchoolEmailConfirmed: { type: Boolean, required: false, default: false },
  accEmailConfirmation: {
    type: new Schema({
      code: { type: Number, required: false, default: null },
      expiresAt: { type: Date, required: false, default: null },
    }, { _id: false }), required: false, default: { code: null, expiresAt: null }
  },
  schoolEmailConfirmation: {
    type: new Schema({
      code: { type: Number, required: false, default: null },
      expiresAt: { type: Date, required: false, default: null },
    }, { _id: false }), required: false, default: { code: null, expiresAt: null }
  },
  fpEmailConfirmation: {
    type: new Schema({
      code: { type: Number, required: false, default: null },
      expiresAt: { type: Date, required: false, default: null },
    }, { _id: false }), required: false, default: { code: null, expiresAt: null }
  },
  blockedUserIds: { type: Array.of(String), required: false, default: [] },
  interestIds: { type: Array.of(String), required: false, default: [] },
  externalLogins: {
    type: Array.of(new Schema({
      providerId: { type: String, required: true },
      providerName: { type: String, required: true },
      firstName: { type: String, required: false, default: null },
      lastName: { type: String, required: false, default: null },
    })), required: false, default: []
  },
  relatedSchoolIds: { type: Array.of(String), required: false, default: [] },
  avatarKey: { type: String, required: false, default: null },
  about: { type: String, required: false, default: null },
  privacySettings: {
    type: new Schema({
      followLimitation: { type: Number, required: false, default: null },
    },
      { _id: false }),
    required: false,
    default: { followLimitation: FollowLimitation.None }
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
    recordStatus: this.recordStatus,
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
    facultyId: this.facultyId,
    departmentId: this.departmentId,
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
    blockedUserIds: this.blockedUserIds,
    interestIds: this.interestIds,
    externalLogins: this.externalLogins,
    relatedSchoolIds: this.relatedSchoolIds,
    avatarKey: this.avatarKey,
    about: this.about,
    privacySettings: this.privacySettings,
    //ignore
    schoolName: null, //ignore
    facultyName: null, //ignore
    departmentName: null, //ignore
    followerCount: 0, //ignore
    followingCount: 0, //ignore
  };
  return response;
};