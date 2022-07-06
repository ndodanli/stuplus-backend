import { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementEntity, AnnouncementLikeEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { AnnouncementDocument } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AnnouncementAddDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementLikeDislikeDTO, AnnouncementGetMultipleDTO, AnnouncementGetCommentsDTO } from "../dtos/AnnouncementDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import RedisService from "../../stuplus-lib/services/redisService";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import { stringify } from "../../stuplus-lib/utils/general";
import { LikeType, RecordStatus } from "../../stuplus-lib/enums/enums";
import { AnnouncementCommentDocument } from "../../stuplus-lib/entities/AnnouncementCommentEntity";
import sanitizeHtml from 'sanitize-html';

export class AnnouncementAccess {
    public static async addAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementAddDTO, currentUserId: string): Promise<Boolean> {
        const user = await UserEntity.findOne({ _id: currentUserId }, ["relatedSchoolIds"], { lean: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (typeof payload.relatedSchoolIds === "string")
            payload.relatedSchoolIds = payload.relatedSchoolIds.split(",");

        if (!payload.relatedSchoolIds?.every(x => user.relatedSchoolIds.includes(x)))
            throw new NotValidError(getMessage("userNotAuthorized", acceptedLanguages));

        payload.text = sanitizeHtml(payload.text);

        await AnnouncementEntity.create(new AnnouncementEntity({
            ...payload,
            ownerId: user._id.toString(),
        }));

        return true;
    }

    public static async getAnnouncements(acceptedLanguages: Array<string>, payload: AnnouncementGetMultipleDTO, currentUserId: string): Promise<AnnouncementDocument[] | null> {
        let now = new Date();
        let announcementsQuery = AnnouncementEntity.find({
            isActive: true, $and: [
                {
                    $or: [
                        { fromDate: null },
                        { fromDate: { $gte: now } },
                    ]
                },
                {
                    $or: [
                        { toDate: null },
                        { toDate: { $lte: now } },
                    ],
                }
            ]
        });
        if (payload.schoolIds && payload.schoolIds.length) {
            announcementsQuery = announcementsQuery.where({
                $or: [
                    { relatedSchoolIds: { $in: payload.schoolIds } },
                    { relatedSchoolIds: [] }
                ]
            });
        }

        if (payload.lastRecordDate)
            announcementsQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const announcements = await announcementsQuery
            .sort({ createdAt: -1 })
            .limit(payload.take)
            .lean(true);

        if (announcements.length) {
            let announcementIds = announcements.map(x => x._id);
            let announcementUserIds = [...new Set(announcements.map(x => x.ownerId))];
            let announcementUsers = await UserEntity.find({ _id: { $in: announcementUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            let likedDislikedAnnouncements = await AnnouncementLikeEntity.find({ announcementId: { $in: announcementIds }, ownerId: currentUserId }, { "_id": 0, "announcementId": 1, "type": 1 }, { lean: true });
            for (let i = 0; i < announcements.length; i++) {
                const announcement = announcements[i];
                //TODO:IMPROVEMENT: scan edilebilir
                const redisAnnouncementLikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementLike + announcement._id.toString(), 0, -1);
                const redisAnnouncementDislikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementDislike + announcement._id.toString(), 0, -1);
                announcement.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementLikeCount + announcement._id.toString(), 10, async () => {
                    let likeCount = 0;
                    likeCount += redisAnnouncementLikes.length;
                    likeCount += await AnnouncementLikeEntity.countDocuments({ announcementId: announcement._id, type: LikeType.Like })
                    return likeCount;
                });
                announcement.commentCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentCount + announcement._id, 30, async () => {
                    let commentCount = 0;
                    commentCount += await RedisService.client.lLen(RedisKeyType.DBAnnouncementComment + announcement._id.toString());
                    commentCount += await AnnouncementCommentEntity.countDocuments({ announcementId: announcement._id });
                    return commentCount;
                });
                announcement.owner = announcementUsers.find(y => y._id.toString() === announcement.ownerId);

                let likeType;
                likeType = redisAnnouncementLikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                if (!likeType) {
                    likeType = redisAnnouncementDislikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                    if (!likeType) {
                        likeType = likedDislikedAnnouncements.find(y => y.announcementId.toString() === announcement._id.toString());
                        if (likeType) announcement.likeType = likeType.type;
                        else announcement.likeType = LikeType.None;
                    } else {
                        announcement.likeType = LikeType.Dislike;
                    }
                } else {
                    announcement.likeType = LikeType.Like;
                }
            }
        }
        return announcements;
    }

    public static async getComments(acceptedLanguages: Array<string>, payload: AnnouncementGetCommentsDTO, currentUserId: string): Promise<AnnouncementCommentDocument[]> {
        let favoriteTake = 5;
        let comments: AnnouncementCommentDocument[] = [];
        let isFirstPage = !payload.lastRecordDate;
        // const redisMaxCommentCount = -30;

        if (isFirstPage) {
            let favoriteComments = await AnnouncementCommentEntity.find({
                announcementId: payload.announcementId
            }).sort({ score: -1, createdAt: -1 }).limit(favoriteTake).lean(true);
            if (favoriteComments.length < favoriteTake)
                payload.take = 0;

            for (let i = 0; i < favoriteComments.length; i++) {
                comments.push(favoriteComments[i]);
            }
            const favoriteCommentIds = comments.map(x => x._id);

            const redisComments = await RedisService.client
                .lRange(RedisKeyType.DBAnnouncementComment + payload.announcementId, 0, -1).then(x => x.map(y => JSON.parse(y).e));

            payload.take -= redisComments.length
            let newComments: AnnouncementCommentDocument[] = [];
            if (payload.take > 0) {
                let newCommentsQuery = AnnouncementCommentEntity.find({
                    announcementId: payload.announcementId,
                    _id: { $nin: favoriteCommentIds },
                });

                if (redisComments.length > 0)
                    newCommentsQuery = newCommentsQuery.where({ createdAt: { $lt: redisComments[0].createdAt } });

                newComments = await newCommentsQuery.sort({ createdAt: -1 }).limit(payload.take).lean(true);;
            }
            for (let i = redisComments.length - 1; i >= 0; i--)
                comments.push(redisComments[i]);

            for (let i = 0; i < newComments.length; i++)
                comments.push(newComments[i]);
        } else {
            comments = await AnnouncementCommentEntity.find({
                announcementId: payload.announcementId,
                createdAt: { $lt: payload.lastRecordDate }
            }).sort({ createdAt: -1 }).limit(payload.take).lean(true);
        }
        if (comments.length) {
            const commentIds = comments.map(x => x._id);
            const likedDislikedComments = await AnnouncementCommentLikeEntity.find({ commentId: { $in: commentIds }, ownerId: currentUserId }, { "_id": 0, "commentId": 1, "type": 1 }).lean(true);
            let commentUserIds = [...new Set(comments.map(x => x.ownerId))];
            let commentUsers = await UserEntity.find({ _id: { $in: commentUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                const redisCommentLikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementCommentLike + comment._id.toString(), 0, -1);
                const redisCommentDislikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementCommentDislike + comment._id.toString(), 0, -1);
                comment.owner = commentUsers.find(y => y._id.toString() === comment.ownerId);
                comment.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentLikeCount + comment._id, 20, async () => {
                    let likeCount = 0;
                    likeCount += redisCommentLikes.length;
                    likeCount += await AnnouncementCommentLikeEntity.countDocuments({ announcementId: payload.announcementId, commentId: comment._id, type: LikeType.Like });
                    return likeCount;
                });
                let likeType;
                likeType = redisCommentLikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                if (!likeType) {
                    likeType = redisCommentDislikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                    if (!likeType) {
                        likeType = likedDislikedComments.find(y => y.commentId === comment._id.toString());
                        if (likeType) comment.likeType = likeType.type;
                        else comment.likeType = LikeType.None;
                    } else {
                        comment.likeType = LikeType.Dislike;
                    }
                } else {
                    comment.likeType = LikeType.Like;
                }
            }
        }
        return comments;
    }

    public static async likeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementLikeDislikeDTO, currentUserId: string): Promise<object> {
        let redisAnnouncementLikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementLike + payload.announcementId, 0, -1);
        let redisAnnouncementDislikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementDislike + payload.announcementId, 0, -1);
        if (payload.beforeType == LikeType.Like) {
            let deleted = false;
            const redisLike = redisAnnouncementLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisLike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBAnnouncementLike + payload.announcementId, -1, redisLike) != 0 ? true : false;
                //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
                if (!deleted)
                    deleted = await AnnouncementLikeEntity.findOneAndUpdate({ announcementId: payload.announcementId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await AnnouncementLikeEntity.findOneAndUpdate({ announcementId: payload.announcementId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted = false;
            const redisDislike = redisAnnouncementDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisDislike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBAnnouncementDislike + payload.announcementId, -1, redisDislike) != 0 ? true : false;
                //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
                if (!deleted)
                    deleted = await AnnouncementLikeEntity.findOneAndUpdate({ announcementId: payload.announcementId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await AnnouncementLikeEntity.findOneAndUpdate({ announcementId: payload.announcementId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = redisAnnouncementLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
        else
            likeDislikeBefore = redisAnnouncementDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);

        if (!likeDislikeBefore)
            likeDislikeBefore = await AnnouncementLikeEntity.findOne({ announcementId: payload.announcementId, ownerId: currentUserId });

        if (likeDislikeBefore)
            throw new NotValidError(getMessage("alreadyLikedOrDisliked", acceptedLanguages));
        //TODO: bu tur hatalari socketten gonder, responseu hemen don.

        const now = new Date();
        const announcementLikeDislikeEntity = new AnnouncementLikeEntity({});
        const announcementLikeDislikeData: object = {
            e: {
                _id: announcementLikeDislikeEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                createdAt: now,
                updatedAt: now,
            },
        }
        let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBAnnouncementLike : RedisKeyType.DBAnnouncementDislike;
        redisKey += payload.announcementId;
        await RedisService.client.rPush(redisKey, stringify(announcementLikeDislikeData));
        return { beforeType: payload.type };
    }

    public static async getAnnouncement(acceptedLanguages: Array<string>, announcementId: string, currentUserId: string): Promise<AnnouncementDocument | null> {
        const now = new Date();
        const announcement = await AnnouncementEntity.findOne({ _id: announcementId, }, {}, { lean: true });

        if (!announcement) throw new NotValidError(getMessage("announcementNotFound", acceptedLanguages));
        if (!announcement.isActive || ((announcement.fromDate && announcement.fromDate > now)
            || (announcement.toDate && announcement.toDate < now))) throw new NotValidError(getMessage("announcementNotAvailable", acceptedLanguages));

        const comments = await AnnouncementCommentEntity.find({ announcementId: announcement._id }, { ownerId: 1, comment: 1 }, { lean: true, sort: { score: -1 }, limit: 20 });
        const requiredUserIds = comments.map(x => x.ownerId);
        requiredUserIds.push(announcement.ownerId);
        const requiredUsers = await UserEntity.find({ _id: { $in: requiredUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });

        announcement.owner = requiredUsers.find(x => x._id.toString() === announcement.ownerId);
        const redisAnnouncementLikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementLike + announcement._id.toString(), 0, -1);
        const redisAnnouncementDislikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementDislike + announcement._id.toString(), 0, -1);
        announcement.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementLikeCount + announcement._id.toString(), 30, async () => {
            let likeCount = 0;
            likeCount += redisAnnouncementLikes.length;
            likeCount += await AnnouncementLikeEntity.countDocuments({ announcementId: announcement._id, type: LikeType.Like });
            return likeCount;
        });
        let likeType;
        likeType = redisAnnouncementLikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
        if (!likeType) {
            likeType = redisAnnouncementDislikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
            if (!likeType) {
                likeType = await AnnouncementLikeEntity.findOne({ announcementId: announcement._id, ownerId: currentUserId }, { "_id": 0, "type": 1 });
                if (likeType) announcement.likeType = likeType.type;
                else announcement.likeType = LikeType.None;
            } else {
                announcement.likeType = LikeType.Dislike;
            }
        } else {
            announcement.likeType = LikeType.Like;
        }

        let announcementCommentGetDTO = new AnnouncementGetCommentsDTO({
            announcementId: announcement._id.toString(),
            take: 20,
        });
        announcement.comments = await AnnouncementAccess.getComments(acceptedLanguages, announcementCommentGetDTO, currentUserId);
        return announcement;
    }

    public static async commentAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementCommentDTO, currentUserId: string): Promise<Boolean> {
        let now = new Date();
        const announcementCommentEntity = new AnnouncementCommentEntity({});
        const announcementCommentData: object = {
            e: {
                _id: announcementCommentEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                comment: payload.comment,
                score: 0,
                createdAt: now,
                updatedAt: now
            },
        }
        await RedisService.client.rPush(RedisKeyType.DBAnnouncementComment + payload.announcementId, stringify(announcementCommentData));

        return true;
    }

    public static async commentLikeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementCommenLikeDisliketDTO, currentUserId: string): Promise<object> {
        let redisAnnouncementCommentLikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementCommentLike + payload.commentId, 0, -1);
        let redisAnnouncementCommentDislikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementCommentDislike + payload.commentId, 0, -1);
        if (payload.beforeType == LikeType.Like) {
            let deleted = false;
            const redisLike = redisAnnouncementCommentLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisLike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBAnnouncementCommentLike + payload.commentId, -1, redisLike) != 0 ? true : false;
                if (!deleted)
                    deleted = await AnnouncementCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await AnnouncementCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted = false;
            const redisDislike = redisAnnouncementCommentDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisDislike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBAnnouncementCommentDislike + payload.commentId, -1, redisDislike) != 0 ? true : false;
                if (!deleted)
                    deleted = await AnnouncementCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await AnnouncementCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = redisAnnouncementCommentLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
        else
            likeDislikeBefore = redisAnnouncementCommentDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);

        if (!likeDislikeBefore)
            likeDislikeBefore = await AnnouncementCommentLikeEntity.findOne({ commentId: payload.commentId, ownerId: currentUserId });

        if (likeDislikeBefore)
            throw new NotValidError(getMessage("alreadyLikedOrDisliked", acceptedLanguages));
        //TODO: bu tur hatalari socketten gonder, responseu hemen don.

        const now = new Date();
        const announcementCommentLikeEntity = new AnnouncementCommentLikeEntity({});
        const announcementCommentLikeDislikeData: object = {
            e: {
                _id: announcementCommentLikeEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                commentId: payload.commentId,
                createdAt: now,
                updatedAt: now
            },
        }
        let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBAnnouncementCommentLike : RedisKeyType.DBAnnouncementCommentDislike;
        redisKey += payload.commentId;
        await RedisService.client.rPush(redisKey, stringify(announcementCommentLikeDislikeData));
        return { beforeType: payload.type };
    }
}