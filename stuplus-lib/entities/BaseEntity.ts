import { MongoosePluginModel } from "@imranbarbhuiya/mongoose-fuzzy-searching";
import { AcceptsDiscriminator, Model, model, Schema } from "mongoose";
import { RecordStatus, Role } from "../enums/enums";
import { AnnouncementCommentDocument, AnnouncementCommentSchema } from "./AnnouncementCommentEntity";
import { AnnouncementCommentLikeDocument, AnnouncementCommentLikeSchema } from "./AnnouncementCommentLikeEntity";
import { AnnouncementDocument, AnnouncementSchema } from "./AnnouncementEntity";
import { AnnouncementLikeDocument, AnnouncementLikeSchema } from "./AnnouncementLikeEntity";
import { ChatDocument, ChatSchema } from "./ChatEntity";
import { DepartmentDocument, DepartmentSchema } from "./DepartmentEntity";
import { DistrictDocument, DistrictSchema } from "./DistrictEntity";
import { CityDocument, CitySchema } from "./CityEntity";
import { FacultyDocument, FacultySchema } from "./FacultyEntity";
import { FollowDocument, FollowSchema } from "./FollowEntity";
import { FollowRequestDocument, FollowRequestSchema } from "./FollowRequestEntity";
import { GroupChatDocument, GroupChatSchema } from "./GroupChatEntity";
import { GroupChatUserDocument, GroupChatUserSchema } from "./GroupChatUserEntity";
import { GroupMessageDocument, GroupMessageSchema } from "./GroupMessageEntity";
import { GroupMessageForwardDocument, GroupMessageForwardSchema } from "./GroupMessageForwardEntity";
import { GroupMessageReadDocument, GroupMessageReadSchema } from "./GroupMessageReadEntity";
import { HashtagDocument, HashtagSchema } from "./HashtagEntity";
import { ImageStatisticDocument, ImageStatisticSchema } from "./ImageStatistic";
import { InterestDocument, InterestSchema } from "./InterestEntity";
import { MessageDocument, MessageSchema } from "./MessageEntity";
import { NeighborhoodDocument, NeighborhoodSchema } from "./NeighborhoodEntity";
import { NotificationDocument, NotificationSchema } from "./NotificationEntity";
import { QuestionCommentDocument, QuestionCommentSchema } from "./QuestionCommentEntity";
import { QuestionCommentLikeDocument, QuestionCommentLikeSchema } from "./QuestionCommentLikeEntity";
import { QuestionDocument, QuestionSchema } from "./QuestionEntity";
import { QuestionLikeDocument, QuestionLikeSchema } from "./QuestionLikeEntity";
import { ReportDocument, ReportSchema } from "./ReportEntity";
import { SchoolDocument, SchoolSchema } from "./SchoolEntity";
import { SearchHistoryDocument, SearchHistorySchema } from "./SearchHistoryEntity";
import { UserDocument, UserSchema } from "./UserEntity";
import { QuestionSubCommentDocument, QuestionSubCommentSchema } from "./QuestionSubCommentEntity";
import { QuestionSubCommentLikeDocument, QuestionSubCommentLikeSchema } from "./QuestionSubCommentLikeEntity";
import { DailyUserStatisticDocument, DailyUserStatisticSchema } from "./DailyUserStatistic";
import { AnnouncementSubCommentLikeDocument, AnnouncementSubCommentLikeSchema } from "./AnnouncementSubCommentLikeEntity";
import { AnnouncementSubCommentDocument, AnnouncementSubCommentSchema } from "./AnnouncementSubCommentEntity";

export default interface BaseEntity {
  [key: string]: any;
  recordStatus: RecordStatus;
  recordDeletionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const collections = ["User", "School", "Faculty", "Department", "Interest", "Announcement", "AnnouncementLike",
  "AnnouncementComment", "GroupChat", "GroupChatUser", "GroupMessage", "GroupMessageForward", "GroupMessageRead",
  "Message", "Chat", "AnnouncementCommentLike", "Follow", "FollowRequest", "Question", "QuestionLike", "QuestionComment",
  "QuestionCommentLike", "Report", "Notification", "ImageStatistic", "SearchHistory", "Hashtag", "City", "District",
  "Neighborhood", "QuestionSubComment", "QuestionSubCommentLike", "AnnouncementSubComment", "AnnouncementSubCommentLike",
  "DailyUserStatistic"];

const baseSpreadator: Record<string, AcceptsDiscriminator> = {};

collections.forEach((collectionName: string) => {
  baseSpreadator[collectionName] = model(collectionName + "Base", new Schema({
    recordStatus: { type: Number, required: false, default: RecordStatus.Active },
  }, { collection: collectionName, timestamps: true }));
})

registerHooks();

export const DailyUserStatisticEntity = baseSpreadator["DailyUserStatistic"].discriminator<
  DailyUserStatisticDocument,
  Model<DailyUserStatisticDocument>
>("DailyUserStatistic", DailyUserStatisticSchema);

export const QuestionSubCommentLikeEntity = baseSpreadator["QuestionSubCommentLike"].discriminator<
  QuestionSubCommentLikeDocument,
  Model<QuestionSubCommentLikeDocument>
>("QuestionSubCommentLike", QuestionSubCommentLikeSchema);

export const QuestionSubCommentEntity = baseSpreadator["QuestionSubComment"].discriminator<
  QuestionSubCommentDocument,
  Model<QuestionSubCommentDocument>
>("QuestionSubComment", QuestionSubCommentSchema);

export const AnnouncementSubCommentLikeEntity = baseSpreadator["AnnouncementSubCommentLike"].discriminator<
  AnnouncementSubCommentLikeDocument,
  Model<AnnouncementSubCommentLikeDocument>
>("AnnouncementSubCommentLike", AnnouncementSubCommentLikeSchema);

export const AnnouncementSubCommentEntity = baseSpreadator["AnnouncementSubComment"].discriminator<
  AnnouncementSubCommentDocument,
  Model<AnnouncementSubCommentDocument>
>("AnnouncementSubComment", AnnouncementSubCommentSchema);

export const CityEntity = baseSpreadator["City"].discriminator<
  CityDocument,
  Model<CityDocument>
>("City", CitySchema);

export const DistrictEntity = baseSpreadator["District"].discriminator<
  DistrictDocument,
  Model<DistrictDocument>
>("District", DistrictSchema);

export const NeighborhoodEntity = baseSpreadator["Neighborhood"].discriminator<
  NeighborhoodDocument,
  Model<NeighborhoodDocument>
>("Neighborhood", NeighborhoodSchema);

export const HashtagEntity = baseSpreadator["Hashtag"].discriminator<
  HashtagDocument,
  Model<HashtagDocument>
>("Hashtag", HashtagSchema);

export const SearchHistoryEntity = baseSpreadator["SearchHistory"].discriminator<
  SearchHistoryDocument,
  Model<SearchHistoryDocument>
>("SearchHistory", SearchHistorySchema);

export const ImageStatisticEntity = baseSpreadator["ImageStatistic"].discriminator<
  ImageStatisticDocument,
  Model<ImageStatisticDocument>
>("ImageStatistic", ImageStatisticSchema);

export const NotificationEntity = baseSpreadator["Notification"].discriminator<
  NotificationDocument,
  Model<NotificationDocument>
>("Notification", NotificationSchema);

export const ReportEntity = baseSpreadator["Report"].discriminator<
  ReportDocument,
  Model<ReportDocument>
>("Report", ReportSchema);

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
  MongoosePluginModel<UserDocument>
>("User", UserSchema);

export const InterestEntity = baseSpreadator["Interest"].discriminator<
  InterestDocument,
  Model<InterestDocument>
>("Interest", InterestSchema);

export const AnnouncementEntity = baseSpreadator["Announcement"].discriminator<
  AnnouncementDocument,
  MongoosePluginModel<AnnouncementDocument>
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

export const QuestionEntity = baseSpreadator["Question"].discriminator<
  QuestionDocument,
  MongoosePluginModel<QuestionDocument>
>("Question", QuestionSchema);

export const QuestionLikeEntity = baseSpreadator["QuestionLike"].discriminator<
  QuestionLikeDocument,
  Model<QuestionLikeDocument>
>("QuestionLike", QuestionLikeSchema);

export const QuestionCommentEntity = baseSpreadator["QuestionComment"].discriminator<
  QuestionCommentDocument,
  Model<QuestionCommentDocument>
>("QuestionComment", QuestionCommentSchema);

export const QuestionCommentLikeEntity = baseSpreadator["QuestionCommentLike"].discriminator<
  QuestionCommentLikeDocument,
  Model<QuestionCommentLikeDocument>
>("QuestionCommentLike", QuestionCommentLikeSchema);

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
  MongoosePluginModel<GroupChatDocument>
>("GroupChat", GroupChatSchema);

export const FollowEntity = baseSpreadator["Follow"].discriminator<
  FollowDocument,
  Model<FollowDocument>
>("Follow", FollowSchema);

export const FollowRequestEntity = baseSpreadator["FollowRequest"].discriminator<
  FollowRequestDocument,
  Model<FollowRequestDocument>
>("FollowRequest", FollowRequestSchema);

function registerHooks(): void {
  DailyUserStatisticSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  DailyUserStatisticSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  DailyUserStatisticSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  DailyUserStatisticSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionSubCommentLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionSubCommentLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionSubCommentLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionSubCommentLikeSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionSubCommentSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionSubCommentSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionSubCommentSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionSubCommentSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementSubCommentLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementSubCommentLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementSubCommentLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementSubCommentLikeSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementSubCommentSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementSubCommentSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementSubCommentSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementSubCommentSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  CitySchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  CitySchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  CitySchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  CitySchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  DistrictSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  DistrictSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  DistrictSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  DistrictSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  NeighborhoodSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  NeighborhoodSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  NeighborhoodSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  NeighborhoodSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  HashtagSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  HashtagSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  HashtagSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  HashtagSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  SearchHistorySchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  SearchHistorySchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  SearchHistorySchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  SearchHistorySchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  ImageStatisticSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  ImageStatisticSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  ImageStatisticSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  ImageStatisticSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  NotificationSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  NotificationSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  NotificationSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  NotificationSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  ReportSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  ReportSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  ReportSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  ReportSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionCommentLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionCommentLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionCommentLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionCommentLikeSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionCommentSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionCommentSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionCommentSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionCommentSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  QuestionLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionLikeSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  QuestionSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  })
  QuestionSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  })
  QuestionSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  });
  QuestionSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  });
  FollowRequestSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  FollowRequestSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  FollowRequestSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  FollowRequestSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  FollowSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  FollowSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  FollowSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  FollowSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementCommentLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementCommentLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementCommentLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementCommentLikeSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  DepartmentSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  DepartmentSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  DepartmentSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  DepartmentSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  FacultySchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  FacultySchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  FacultySchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  FacultySchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  InterestSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  InterestSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  InterestSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  InterestSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  })
  AnnouncementSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  })
  AnnouncementSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  });
  AnnouncementSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    this.select({ __v: 0, titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  });
  AnnouncementLikeSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementLikeSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementLikeSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementLikeSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementCommentSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementCommentSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  AnnouncementCommentSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  AnnouncementCommentSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  ChatSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  ChatSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  ChatSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  ChatSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupChatUserSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupChatUserSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupChatUserSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupChatUserSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupMessageForwardSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupMessageForwardSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupMessageForwardSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupMessageForwardSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupMessageSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupMessageSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupMessageSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupMessageSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupMessageReadSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupMessageReadSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  GroupMessageReadSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupMessageReadSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  MessageSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  MessageSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  MessageSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  MessageSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  UserSchema.pre("find", function (next) {
    // this.where({ recordStatus: RecordStatus.Active, role: { $ne: Role.Admin } });
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    // this.select({ firstName_fuzzy: 0, lastName_fuzzy: 0, username_fuzzy: 0 });
    next();
  })
  UserSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    // this.select({ firstName_fuzzy: 0, lastName_fuzzy: 0, username_fuzzy: 0 });
    next();
  })
  UserSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    // this.select({ firstName_fuzzy: 0, lastName_fuzzy: 0, username_fuzzy: 0 });
    next();
  });
  UserSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  GroupChatSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    // this.select({ titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  })
  GroupChatSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    // this.select({ titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  })
  GroupChatSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    // this.select({ titlesch_fuzzy: 0, hashTags_fuzzy: 0 });
    next();
  });
  GroupChatSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  SchoolSchema.pre("find", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  SchoolSchema.pre("findOne", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  })
  SchoolSchema.pre("findOneAndUpdate", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
  SchoolSchema.pre("countDocuments", function (next) {
    this.where({ recordStatus: RecordStatus.Active });
    // this.select({ __v: 0 });
    next();
  });
};