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

export const RedisOperationType = {
   PrivateMessage: "0",
   GroupMessage: "1",
   AnnouncementLikeDislike: "3",
   AnnouncementComment: "4",
   AnnouncementCommentLikeDislike: "5",
}

export const SocketRoomTypes = {
   WatchRoom: "w",
}

export enum WatchRoomTypes {
   UserOnline = 0,
   UserOffline = 1
}