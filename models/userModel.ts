import { Document, Model, Types, Schema } from "mongoose";
import BaseModel, { Base } from "./BaseModel";

export const MODEL_REF = "User";

export interface User extends BaseModel {
  Email: string;
  Password: string;
  Role: Number;
  FirstName: string;
  LastName: string;
  PhoneNumber: string;
  SchoolId: string;
  ProfilePhotoUrl: string;
  ChatSettings: object,
  RoomIds: Array<String>,
  BlockedUserIds: Array<String>,
  InterestIds: Array<String>,
  FriendIds: Array<String>,
  TakenFriendRequestIds: Array<String>,
  SendedFriendRequestIds: Array<String>,
}
export interface UserDocument extends User, Document {
  minify(): unknown;
}

export interface UserModel extends Model<UserDocument> { }

export const UserSchema: Schema = new Schema({
  Email: { type: String, required: true },
  Password: { type: String, required: true },
  Role: { type: Number, required: true },
  FirstName: { type: String, required: false, default: null },
  LastName: { type: String, required: false, default: null },
  PhoneNumber: { type: String, required: false, default: null },
  SchoolId: { type: String, required: false, default: null },
  ProfilePhotoUrl: { type: String, required: false, default: null },
  ChatSettings: { type: Object, required: true, default: {} },
  RoomIds: { type: Array.of(String), required: true, default: [] },
  BlockedUserIds: { type: Array.of(String), required: true, default: [] },
  InterestIds: { type: Array.of(String), required: true, default: [] },
  FriendIds: { type: Array.of(String), required: true, default: [] },
  TakenFriendRequestIds: { type: Array.of(String), required: true, default: [] },
  SendedFriendRequestIds: { type: Array.of(String), required: true, default: [] },
});

// Just to prove that hooks are still functioning as expected
UserSchema.pre("save", function () {
  //
})

UserSchema.pre("deleteOne", function () {
  console.log("deleteOne", this);
});


// Add a method. In this case change the returned object
UserSchema.methods.minify = async function (
  this: UserDocument
) {
  const response: User & { _id: string } = {
    _id: this._id,
    Email: this.Email,
    Password: this.Password,
    Role: this.Role,
    FirstName: this.FirstName,
    LastName: this.LastName,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    Title: this.Title,
    PhoneNumber: this.PhoneNumber,
    SchoolId: this.SchoolId,
    ProfilePhotoUrl: this.ProfilePhotoUrl,
    ChatSettings: this.ChatSettings,
    RoomIds: this.RoomIds,
    BlockedUserIds: this.BlockedUserIds,
    InterestIds: this.InterestIds,
    FriendIds: this.FriendIds,
    TakenFriendRequestIds: this.TakenFriendRequestIds,
    SendedFriendRequestIds: this.SendedFriendRequestIds,
  };
  return response;
};


// This is the magic where we connect Typescript to the Mongoose inherited base model (discriminator)

export const UserModel = Base.discriminator<
  UserDocument,
  UserModel
>(MODEL_REF, UserSchema);