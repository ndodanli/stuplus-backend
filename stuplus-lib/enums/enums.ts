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

export enum RedisAcquireEntityFilterOrder {
   ASC = 1,
   DESC = -1
}