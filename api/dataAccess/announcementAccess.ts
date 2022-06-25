import BaseEntity, { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementEntity, AnnouncementLikeEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { AnnouncementDocument } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AnnouncementAddDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementGetSingleDTO, AnnouncementLikeDislikeDTO, AnnouncementGetMultipleDTO, AnnouncementGetCommentsDTO } from "../dtos/AnnouncementDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import RedisService from "../../stuplus-lib/services/redisService";
import { SchoolDocument } from "../../stuplus-lib/entities/SchoolEntity";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import { stringify } from "../../stuplus-lib/utils/general";
import { LikeType, RedisAcquireEntityFilterOrder } from "../../stuplus-lib/enums/enums";
import { AnnouncementCommentDocument } from "../../stuplus-lib/entities/AnnouncementCommentEntity";

export class AnnouncementAccess {
    public static async addAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementAddDTO, currentUserId: string): Promise<Boolean> {
        const user = await UserEntity.findOne({ _id: currentUserId }, {}, { lean: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (typeof payload.relatedSchoolIds === "string")
            payload.relatedSchoolIds = payload.relatedSchoolIds.split(",");

        if (!payload.relatedSchoolIds?.every(x => user.relatedSchoolIds.includes(x)))
            throw new NotValidError(getMessage("userNotAuthorized", acceptedLanguages));

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
            announcementsQuery = announcementsQuery.where({ relatedSchoolIds: { $in: payload.schoolIds } });
        } else {
            var user = await RedisService.acquireUser(currentUserId);
            if (user?.schoolId) {
                announcementsQuery = announcementsQuery.where({ relatedSchoolIds: { $in: [user.schoolId] } });
            }
        };
        const announcements = await announcementsQuery.sort({ score: -1 }).skip(payload.skip).limit(payload.take).lean(true);

        if (announcements.length) {
            let announcementUserIds = [...new Set(announcements.map(x => x.ownerId))];
            let announcementUsers = await UserEntity.find({ _id: { $in: announcementUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1 }, { lean: true });
            let schools = await RedisService.acquire<SchoolDocument[]>(RedisKeyType.Schools + "schools", 60 * 60 * 2, async () => await SchoolEntity.find({}, ["_id", "title"], { lean: true }));
            for (let i = 0; i < announcements.length; i++) {
                const announcement = announcements[i];
                announcement.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementLikeCount + announcement._id, 10, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.lLen(RedisKeyType.DBAnnouncementLike + announcement._id.toString());
                    likeCount += await AnnouncementLikeEntity.countDocuments({ announcementId: announcement._id, type: LikeType.Like })
                    return likeCount;
                });
                announcement.commentCount += await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentCount + announcement._id, 30, async () => await AnnouncementCommentEntity.countDocuments({ announcementId: announcement._id }));
                announcement.owner = announcementUsers.find(y => y._id.toString() === announcement.ownerId);
                announcement.relatedSchools = schools.filter(y => announcement.relatedSchoolIds.includes(y._id.toString()))
                    .map(x => {
                        return {
                            title: x.title,
                            schoolId: x._id.toString()
                        }
                    });
            }
        }
        return announcements;
    }

    public static async getComments(acceptedLanguages: Array<string>, payload: AnnouncementGetCommentsDTO, currentUserId: string): Promise<AnnouncementCommentDocument[] | null> {
        // let comments = await AnnouncementCommentEntity.find({
        //     announcementId: payload.announcementId
        // }).sort({ score: -1 }).skip(payload.skip).limit(payload.take).lean(true);

        let comments = await RedisService.acquireEntity<AnnouncementCommentDocument[]>(RedisKeyType.DBAnnouncementComment + payload.announcementId, async () => await AnnouncementCommentEntity.find({
            announcementId: payload.announcementId
        }).sort({ score: -1 }).skip(payload.skip).limit(payload.take).lean(true), { sort: { property: "score", order: RedisAcquireEntityFilterOrder.DESC }, limit: payload.take });

        if (comments.length) {
            let commentUserIds = [...new Set(comments.map(x => x.ownerId))];
            let commentUsers = await UserEntity.find({ _id: { $in: commentUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1 }, { lean: true });
            let schools = await RedisService.acquire<SchoolDocument[]>(RedisKeyType.Schools + "schools", 60 * 60 * 24, async () => await SchoolEntity.find({}, ["_id", "title"], { lean: true }));
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                comment.owner = commentUsers.find(y => y._id.toString() === comment.ownerId);
                comment.ownerSchool = schools.find(y => y._id.toString() === comment.owner?.schoolId);
                comment.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentLikeCount + comment._id, 10, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.lLen(RedisKeyType.DBAnnouncementCommentLike + comment._id);
                    likeCount += await AnnouncementCommentLikeEntity.countDocuments({ announcementId: payload.announcementId, commentId: comment._id, type: LikeType.Like });
                    return likeCount;
                });
            }
        }
        return comments;
    }

    public static async likeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementLikeDislikeDTO, currentUserId: string): Promise<Boolean> {
        if (await AnnouncementLikeEntity.exists({ announcementId: payload.announcementId, ownerId: currentUserId }))
            throw new NotValidError(getMessage("alreadyLiked", acceptedLanguages));
        const announcementLikeDislikeEntity = new AnnouncementLikeEntity({});
        const announcementLikeDislikeData: object = {
            e: {
                _id: announcementLikeDislikeEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
            },
        }
        let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBAnnouncementLike : RedisKeyType.DBAnnouncementDislike;
        redisKey += payload.announcementId;
        await RedisService.client.rPush(redisKey, stringify(announcementLikeDislikeData));
        return true;
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
        const requiredUsers = await UserEntity.find({ _id: { $in: requiredUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1 }, { lean: true });

        announcement.owner = requiredUsers.find(x => x._id.toString() === announcement.ownerId);
        const redisAnnouncementLikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementLike + announcement._id.toString(), 0, -1);
        announcement.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementLikeCount + announcement._id, 30, async () => {
            let likeCount = 0;
            likeCount += redisAnnouncementLikes.length;
            await AnnouncementLikeEntity.countDocuments({ announcementId: announcement._id, type: LikeType.Like })
        });
        announcement.liked = redisAnnouncementLikes.map(y => JSON.parse(y).ownerId).includes(currentUserId);

        if (!announcement.liked) {
            announcement.liked = await AnnouncementLikeEntity.exists({ announcementId: announcement._id, ownerId: currentUserId, type: LikeType.Like }) ? true : false;
        }
        let schools = await RedisService.acquire<SchoolDocument[]>(RedisKeyType.Schools, 60 * 60 * 2, async () => await SchoolEntity.find({}, ["_id", "title"], { lean: true }));
        announcement.relatedSchools = schools.filter(y => announcement.relatedSchoolIds.includes(y._id.toString())).map(x => {
            return {
                title: x.title,
                schoolId: x._id.toString()
            }
        });

        for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];
            const redisCommentLikes = await RedisService.client.lRange(RedisKeyType.DBAnnouncementCommentLike + comment._id.toString(), 0, -1);
            comment.owner = requiredUsers.find(x => x._id.toString() === comment.ownerId);
            comment.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentLikeCount + comment._id, 10, async () => {
                let likeCount = 0;
                likeCount += redisCommentLikes.length;
                likeCount += await AnnouncementCommentLikeEntity.countDocuments({ announcementId: announcement._id, commentId: comment._id, type: LikeType.Like });
                return likeCount;
            });
            comment.liked = redisCommentLikes.map(y => JSON.parse(y).ownerId).includes(currentUserId);

            if (!comment.liked) {
                comment.liked = await AnnouncementCommentLikeEntity.exists({ announcementId: announcement._id, commentId: comment._id, ownerId: currentUserId, type: LikeType.Like }) ? true : false;
            }

        }
        announcement.comments = comments;
        return announcement;
    }

    public static async commentAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementCommentDTO, currentUserId: string): Promise<Boolean> {
        const announcementCommentEntity = new AnnouncementCommentEntity({});
        const announcementCommentData: object = {
            e: {
                _id: announcementCommentEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                comment: payload.comment,
                score: 0
            },
        }
        await RedisService.client.rPush(RedisKeyType.DBAnnouncementComment + payload.announcementId, stringify(announcementCommentData));

        return true;
    }

    public static async commentLikeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementCommenLikeDisliketDTO, currentUserId: string): Promise<Boolean> {
        if (await AnnouncementCommentLikeEntity.exists({ announcementId: payload.announcementId, ownerId: currentUserId, commentId: payload.commentId }))
            throw new NotValidError(getMessage("alreadyLiked", acceptedLanguages));
        const announcementCommentEntity = new AnnouncementCommentLikeEntity({});
        const announcementCommentData: object = {
            e: {
                _id: announcementCommentEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                commentId: payload.commentId,
            },
        }
        let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBAnnouncementCommentLike : RedisKeyType.DBAnnouncementCommentDislike;
        redisKey += announcementCommentEntity.id
        await RedisService.client.rPush(redisKey, stringify(announcementCommentData));

        return true;
    }
}