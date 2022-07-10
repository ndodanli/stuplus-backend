export enum RecordStatus {
   Deleted = 0,
   Active = 1,
}

export enum Role {
   Admin = 0,
   User = 1,
   ContentCreator = 2
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
export enum RedisAcquireEntityFilterOrder {
   ASC = 1,
   DESC = -1
}

export enum RedisMessagesNotFoundType {
   Reply = 0,
   Forward = 1,
   Read = 2
}