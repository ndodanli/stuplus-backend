import { AcceptsDiscriminator, Model, model, Schema } from "mongoose";
import { RecordStatus } from "../enums/enums";
import { AnnouncementCommentDocument, AnnouncementCommentSchema } from "./AnnouncementCommentEntity";
import { AnnouncementCommentLikeDocument, AnnouncementCommentLikeSchema } from "./AnnouncementCommentLikeEntity";
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

const collections = ["User", "School", "Faculty", "Department", "Interest", "Announcement", "AnnouncementLike",
  "AnnouncementComment", "GroupChat", "GroupChatUser", "GroupMessage", "GroupMessageForward", "GroupMessageRead",
  "Message", "Chat", "AnnouncementCommentLike",
];

const baseSpreadator: Record<string, AcceptsDiscriminator> = {};

collections.forEach((collectionName: string) => {
  baseSpreadator[collectionName] = model(collectionName + "Base", new Schema({
    recordStatus: { type: Number, required: false, default: RecordStatus.Active },
  }, { collection: collectionName, timestamps: true }))
})

registerHooks();

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

export const AnnouncementCommentLikeEntity = baseSpreadator["AnnouncementCommentLike"].discriminator<
  AnnouncementCommentLikeDocument,
  Model<AnnouncementCommentLikeDocument>
>("AnnouncementCommentLike", AnnouncementCommentLikeSchema);

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

function registerHooks(): void {
  AnnouncementCommentLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementCommentLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementCommentLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  DepartmentSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  DepartmentSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  DepartmentSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  FacultySchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  FacultySchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  FacultySchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  InterestSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  InterestSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  InterestSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  AnnouncementSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  AnnouncementLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  AnnouncementCommentSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementCommentSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  AnnouncementCommentSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  ChatSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  ChatSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  ChatSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  GroupChatUserSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupChatUserSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupChatUserSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  GroupMessageForwardSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupMessageForwardSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupMessageForwardSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  GroupMessageSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupMessageSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupMessageSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  GroupMessageReadSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupMessageReadSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupMessageReadSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  MessageSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  MessageSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  MessageSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  UserSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  UserSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  UserSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  GroupChatSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupChatSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  GroupChatSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
  SchoolSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  SchoolSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  })
  SchoolSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    next()
  });
};