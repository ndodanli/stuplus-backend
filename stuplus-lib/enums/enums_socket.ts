export enum Role {
   Admin,
   User
}

export enum Gender {
   NotSpecified = 0,
   Male = 1,
   Female = 2,
   NotDefined = 3
}

export enum GroupChatType {
   Public = 0,
   Private = 1
}

export enum RedisPMOperationType {
   InsertMessage = 0,
   UpdateReaded = 1,
   UpdateForwarded = 2
}

export enum RedisGMOperationType {
   InsertMessage = 0,
   InsertReaded = 1,
   InsertForwarded = 2
}

export const RedisKeyType = {
   DBPrivateMessage: "0:",
   DBGroupMessage: "1:",
   DBAnnouncementLike: "2:",
   DBAnnouncementDislike: "3:",
   DBAnnouncementComment: "4:",
   DBAnnouncementCommentLike: "5:",
   DBAnnouncementCommentDislike: "6:",
   User: "7:",
   Schools: "8:",
   AnnouncementCommentLikeCount: "9:",
   AnnouncementCommentDislikeCount: "10:",
   AnnouncementLikeCount: "11:",
   AnnouncementDislikeCount: "12:",
   AnnouncementCommentCount: "13:",
}

export const SocketRoomTypes = {
   WatchRoom: "w",
}

export enum WatchRoomTypes {
   UserOnline = 0,
   UserOffline = 1
}