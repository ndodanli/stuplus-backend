export enum RecordStatus {
   Deleted = 0,
   Active = 1,
}

export enum Role {
   Admin = 0,
   User = 1,
   ContentCreator = 2,
   GroupGuard = 3,
}

export enum Gender {
   NotSpecified = 0,
   Male = 1,
   Female = 2,
   NotDefined = 3
}

export enum LikeType {
   Dislike = 0,
   Like = 1,
   None = 2
}

export enum FollowStatus {
   Cancelled = 0,
   Rejected = 1,
   Pending = 2,
   Accepted = 3,
   None = 4
}

export enum FollowLimitation {
   None = 0,
   ByRequest = 1
}

export enum MessageLimitation {
   None = 0,
   OnlyWhoUserFollows = 1
}
export enum RedisAcquireEntityFilterOrder {
   ASC = 1,
   DESC = -1
}

export enum RedisMessagesNotFoundType {
   Reply = 0,
   Forward = 1,
   Read = 2
}

export enum DeleteChatForType {
   Me = 0,
   Both = 1,
}

export enum SchoolType {
   OpenEducation = 0,
   Government = 1,
   Special = 2
}

export enum GroupChatUserRole {
   Member = 0,
   Admin = 1,
   Guard = 2,
   Owner = 3
}

export enum ReportType {
   JustDontLike = 0,
   BullyingOrHarassment = 1,
   FalseInformation = 2,
   Spam = 3,
   NudityOrSexualActivity = 4,
   HateSpeechOrSymbols = 5,
   ViolanceOrDangerousOrganizations = 6,
   ScamOrFraud = 7,
   IntellectualPropertyViolation = 8,
   SaleOfIllegalOrRegulatedGoods = 9,
   SuicideOrSelfInjury = 10,
   EatingDisorders = 11,
   Other = 12
}

export enum NotificationType {
   StartedFollowingYou = 0,
   FollowRequestAccepted = 1,
   AddedYouToGroupChat = 2,
}

export enum SearchedEntityType {
   User = 0,
   Group = 1,
   Hashtag = 2,
   Question = 3,
   Announcement = 4,
}