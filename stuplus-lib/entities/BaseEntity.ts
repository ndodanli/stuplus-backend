import { AcceptsDiscriminator, Model, model, Schema } from "mongoose";
import { AnnouncementCommentDocument, AnnouncementCommentSchema } from "./AnnouncementCommentEntity";
import { AnnouncementDocument, AnnouncementSchema } from "./AnnouncementEntity";
import { AnnouncementLikeDocument, AnnouncementLikeSchema } from "./AnnouncementLikeEntity";
import { ChatDocument, ChatSchema } from "./ChatEntity";
import { DepartmentDocument, DepartmentSchema } from "./DepartmentEntity";
import { FacultyDocument, FacultySchema } from "./FacultyEntity";
import { GroupChatDocument, GroupChatSchema } from "./GroupChatEntity";
import { GroupChatUserDocument, GroupChatUserSchema } from "./GroupChatUserEntity";
import { GroupMessageDocument, GroupMessageSchema } from "./GroupMessageEntity";
import { GroupMessageForwardDocument, GroupMessageForwardSchema } from "./GroupMessageForwardEntity";
import { GroupMessageReadDocument, GroupMessageReadSchema } from "./GroupMessageReadEntity";
import { InterestDocument, InterestSchema } from "./InterestEntity";
import { MessageDocument, MessageSchema } from "./MessageEntity";
import { SchoolDocument, SchoolSchema } from "./SchoolEntity";
import { UserDocument, UserSchema } from "./UserEntity";

export default interface BaseEntity {
  createdAt: Date;
  updatedAt: Date;
}

const collections = ["User", "School", "Faculty", "Department", "Interest", "Announcement", "AnnouncementLike", "AnnouncementComment", "GroupChat", "GroupChatUser", "GroupMessage", "GroupMessageForward", "GroupMessageRead", "Message", "Chat"];

const baseSpreadator: Record<string, AcceptsDiscriminator> = {};

collections.forEach((collectionName: string) => {
  baseSpreadator[collectionName] = model(collectionName + "Base", new Schema({
    // title: { type: String, required: false, default: null },
  }, { collection: collectionName, timestamps: true }))
})

export const SchoolEntity = baseSpreadator["School"].discriminator<
  SchoolDocument,
  Model<SchoolDocument>
>("School", SchoolSchema);

export const DepartmentEntity = baseSpreadator["Department"].discriminator<
  DepartmentDocument,
  Model<DepartmentDocument>
>("Department", DepartmentSchema);

export const FacultyEntity = baseSpreadator["Faculty"].discriminator<
  FacultyDocument,
  Model<FacultyDocument>
>("Faculty", FacultySchema);

export const UserEntity = baseSpreadator["User"].discriminator<
  UserDocument,
  Model<UserDocument>
>("User", UserSchema);

export const InterestEntity = baseSpreadator["Interest"].discriminator<
  InterestDocument,
  Model<InterestDocument>
>("Interest", InterestSchema);

export const AnnouncementEntity = baseSpreadator["Announcement"].discriminator<
  AnnouncementDocument,
  Model<AnnouncementDocument>
>("Announcement", AnnouncementSchema);

export const AnnouncementLikeEntity = baseSpreadator["AnnouncementLike"].discriminator<
  AnnouncementLikeDocument,
  Model<AnnouncementLikeDocument>
>("AnnouncementLike", AnnouncementLikeSchema);

export const AnnouncementCommentEntity = baseSpreadator["AnnouncementComment"].discriminator<
  AnnouncementCommentDocument,
  Model<AnnouncementCommentDocument>
>("AnnouncementComment", AnnouncementCommentSchema);

export const ChatEntity = baseSpreadator["Chat"].discriminator<
  ChatDocument,
  Model<ChatDocument>
>("Chat", ChatSchema);

export const GroupChatUserEntity = baseSpreadator["GroupChatUser"].discriminator<
  GroupChatUserDocument,
  Model<GroupChatUserDocument>
>("GroupChatUser", GroupChatUserSchema);

export const GroupMessageForwardEntity = baseSpreadator["GroupMessageForward"].discriminator<
  GroupMessageForwardDocument,
  Model<GroupMessageForwardDocument>
>("GroupMessageForward", GroupMessageForwardSchema);

export const GroupMessageEntity = baseSpreadator["GroupMessage"].discriminator<
  GroupMessageDocument,
  Model<GroupMessageDocument>
>("GroupMessage", GroupMessageSchema);

export const GroupMessageReadEntity = baseSpreadator["GroupMessageRead"].discriminator<
  GroupMessageReadDocument,
  Model<GroupMessageReadDocument>
>("GroupMessageRead", GroupMessageReadSchema);

export const MessageEntity = baseSpreadator["Message"].discriminator<
  MessageDocument,
  Model<MessageDocument>
>("Message", MessageSchema);

export const GroupChatEntity = baseSpreadator["GroupChat"].discriminator<
  GroupChatDocument,
  Model<GroupChatDocument>
>("GroupChat", GroupChatSchema);