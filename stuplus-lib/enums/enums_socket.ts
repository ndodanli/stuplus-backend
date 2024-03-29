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

export enum GroupChatType {
   Public = 0,
   Private = 1
}

export enum RedisPMOperationType {
   InsertMessage = 0,
   UpdateReaded = 1,
   UpdateForwarded = 2,
   UpdateSendFileMessage = 3
}

export enum RedisGMOperationType {
   InsertMessage = 0,
   UpdateReaded = 1,
   UpdateForwarded = 2,
   UpdateSendFileMessage = 3
}
export const RedisPrefixKeyType = {
   DBOperations: "d"
}
export const RedisSubKeyType = {
   FollowerCount: "0:",
   FollowingCount: "1:",
   GroupChatIds: "2:",
   PrivateChatIds: "3:",
   DailyLikeCount: "4:",
   DailyCommentCount: "5:",
   DailyNewPMCount: "6:",
   DailyFollowCount: "7:",
   GroupChatReadCounts: ":8",
   PrivateChatUnreadCounts: ":9",

}
export const RedisKeyType = {
   DBPrivateMessage: "d0:",
   DBGroupMessage: "d1:",
   DBAnnouncementLike: "d2:",
   DBAnnouncementDislike: "d3:",
   DBAnnouncementComment: "d4:",
   DBAnnouncementCommentLike: "d5:",
   DBAnnouncementCommentDislike: "d6:",
   User: "7:",
   Schools: "8:",
   AnnouncementCommentLikeCount: "9:",
   AnnouncementCommentDislikeCount: "10:",
   AnnouncementLikeCount: "11:",
   AnnouncementDislikeCount: "12:",
   AnnouncementCommentCount: "13:",
   Interests: "14:",
   DBQuestionLike: "d15:",
   DBQuestionDislike: "d16:",
   QuestionLikeCount: "17:",
   QuestionCommentCount: "18:",
   DBQuestionComment: "d19:",
   DBQuestionCommentLike: "d20:",
   DBQuestionCommentDislike: "d21:",
   QuestionCommentLikeCount: "22:",
   DBSearchHistory: "d23:",
   DBHashtagEntity: "d24:",
   DBHashtagGroupPopularityIncr: "d25:",
   DBHashtagQuestionPopularityIncr: "d26:",
   DBHashtagAnnoPopularityIncr: "d27:",
   UserPlayerIds: "28:",
   UserFollowings: "29:",
   DBQuestionSubComment: "d30:",
   DBQuestionSubCommentLike: "d31:",
   DBQuestionSubCommentDislike: "d32:",
   QuestionSubCommentCount: "33:",
   QuestionSubCommentLikeCount: "34:",
   DailyLikeLimit: "l35:likeCount:",
   DailyCommentLimit: "l36:commentCount:",
   DailyNewPMLimit: "l37:pmCount:",
   DailyFollowLimit: "l38:followCount:",
   GroupChat: "39:",
   AllGroupChats: "40:agc",
   DBAnnouncementSubComment: "d41:",
   DBAnnouncementSubCommentLike: "d42:",
   DBAnnouncementSubCommentDislike: "d43:",
   AnnouncementSubCommentCount: "44:",
   AnnouncementSubCommentLikeCount: "45:",
   AllPrivateChats: "46:apc",
   AllGroupChatMemberCounts: "47:agcmc",
   MutedUsers: "48:",
}

export const SocketRoomTypes = {
   WatchRoom: "w",
}

export enum WatchRoomTypes {
   UserOnline = 0,
   UserOffline = 1,
   UserPPChanged = 3,
   UserProfileChanged = 4,
}