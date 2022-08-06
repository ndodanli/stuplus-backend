import { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementEntity, AnnouncementLikeEntity, AnnouncementSubCommentEntity, AnnouncementSubCommentLikeEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { Announcement, AnnouncementDocument } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AnnouncementAddDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementLikeDislikeDTO, AnnouncementGetMultipleDTO, AnnouncementGetCommentsDTO, AnnouncementSubCommenLikeDisliketDTO, AnnouncementSubCommentDTO, AnnouncementGetSubCommentsDTO } from "../dtos/AnnouncementDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import RedisService from "../../stuplus-lib/services/redisService";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import { searchable, searchableWithSpaces, stringify } from "../../stuplus-lib/utils/general";
import { LikeType, RecordStatus } from "../../stuplus-lib/enums/enums";
import { AnnouncementCommentDocument } from "../../stuplus-lib/entities/AnnouncementCommentEntity";
import sanitizeHtml from 'sanitize-html';
import { AnnouncementSubCommentDocument } from "../../stuplus-lib/entities/AnnouncementSubCommentEntity";

export class AnnouncementAccess {
    public static async addAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementAddDTO, currentUserId: string): Promise<Announcement> {
        const user = await UserEntity.findOne({ _id: currentUserId }, ["relatedSchoolIds"], { lean: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (typeof payload.relatedSchoolIds === "string")
            payload.relatedSchoolIds = payload.relatedSchoolIds.split(",");

        if (!payload.relatedSchoolIds?.every(x => user.relatedSchoolIds.includes(x)))
            throw new NotValidError(getMessage("userNotAuthorized", acceptedLanguages));

        const redisOps: Promise<any>[] = [];
        if (payload.hashTags && payload.hashTags.length > 0) {
            payload.hashTags.forEach(async (x, index, arr) => {
                arr[index] = searchable(x);
                redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagEntity + `${arr[index]}`));
                redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagGroupPopularityIncr + `${arr[index]}:annoPopularity`));
            });
            await Promise.all(redisOps);
        }

        payload.text = sanitizeHtml(payload.text);

        const announcement = await AnnouncementEntity.create(new AnnouncementEntity({
            ...payload,
            titlesch: searchableWithSpaces(payload.title),
            ownerId: user._id.toString(),
        }));

        return announcement;
    }

    public static async getAnnouncements(acceptedLanguages: Array<string>, payload: AnnouncementGetMultipleDTO, currentUserId: string): Promise<Announcement[] | null> {
        let announcements: Announcement[] = [];
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

        if (payload.schoolSearch) {
            announcementsQuery = announcementsQuery.where({ ownerSchoolId: payload.ownerSchoolId });
        } else {
            announcementsQuery = announcementsQuery.where({ ownerSchoolId: { $ne: payload.ownerSchoolId } });
        }

        if (payload.lastRecordId)
            announcementsQuery.where({ _id: { $lt: payload.lastRecordId } });

        announcements = await announcementsQuery
            .sort({ _id: -1 })
            .limit(payload.take)
            .lean(true);


        if (payload.schoolSearch && announcements.length < payload.take) {
            let announcementsSecond = await AnnouncementEntity.find({
                ownerSchoolId: { $ne: payload.ownerSchoolId }, isActive: true, $and: [
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
            })
                .sort({ _id: -1 })
                .limit(payload.take - announcements.length)
                .lean(true);
            announcements = announcements.concat(announcementsSecond);
        }

        if (announcements.length) {
            let announcementIds = announcements.map(x => x._id);
            let announcementUserIds = [...new Set(announcements.map(x => x.ownerId))];
            let announcementUsers = await UserEntity.find({ _id: { $in: announcementUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            let likedDislikedAnnouncements = await AnnouncementLikeEntity.find({ announcementId: { $in: announcementIds }, ownerId: currentUserId }, { "_id": 0, "announcementId": 1, "type": 1 }, { lean: true });
            for (let i = 0; i < announcements.length; i++) {
                const announcement = announcements[i];
                //TODO:IMPROVEMENT: scan edilebilir
                announcement.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementLikeCount + announcement._id.toString(), 10, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.hLen(RedisKeyType.DBAnnouncementLike + announcement._id.toString());
                    likeCount += await AnnouncementLikeEntity.countDocuments({ announcementId: announcement._id, type: LikeType.Like })
                    return likeCount;
                });
                announcement.commentCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentCount + announcement._id, 10, async () => {
                    let commentCount = 0;
                    commentCount += await RedisService.client.hLen(RedisKeyType.DBAnnouncementComment + announcement._id.toString());
                    commentCount += await AnnouncementCommentEntity.countDocuments({ announcementId: announcement._id });
                    commentCount += await AnnouncementSubCommentEntity.countDocuments({ announcementId: announcement._id });
                    return commentCount;
                });
                announcement.owner = announcementUsers.find(y => y._id.toString() === announcement.ownerId);

                let likeType;
                likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementLike + announcement._id.toString(), currentUserId);
                if (!likeType) {
                    likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementDislike + announcement._id.toString(), currentUserId);
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
        let isFirstPage = !payload.lastRecordId;
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
                .hVals(RedisKeyType.DBAnnouncementComment + payload.announcementId).then(x => x.map(y => JSON.parse(y).e));

            payload.take -= redisComments.length
            let newComments: AnnouncementCommentDocument[] = [];
            if (payload.take > 0) {
                let newCommentsQuery = AnnouncementCommentEntity.find({
                    announcementId: payload.announcementId,
                    _id: { $nin: favoriteCommentIds },
                });

                if (redisComments.length > 0)
                    newCommentsQuery = newCommentsQuery.where({ _id: { $lt: redisComments[0]._id } });

                newComments = await newCommentsQuery.sort({ _id: -1 }).limit(payload.take).lean(true);;
            }
            for (let i = redisComments.length - 1; i >= 0; i--)
                comments.push(redisComments[i]);

            for (let i = 0; i < newComments.length; i++)
                comments.push(newComments[i]);
        } else {
            comments = await AnnouncementCommentEntity.find({
                announcementId: payload.announcementId,
                _id: { $lt: payload.lastRecordId }
            }).sort({ _id: -1 }).limit(payload.take).lean(true);
        }
        if (comments.length) {
            const commentIds = comments.map(x => x._id);
            const likedDislikedComments = await AnnouncementCommentLikeEntity.find({ commentId: { $in: commentIds }, ownerId: currentUserId }, { "_id": 0, "commentId": 1, "type": 1 }).lean(true);
            let commentUserIds = [...new Set(comments.map(x => x.ownerId))];
            let commentUsers = await UserEntity.find({ _id: { $in: commentUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                comment.owner = commentUsers.find(y => y._id.toString() === comment.ownerId);
                comment.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentLikeCount + comment._id, 20, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.hLen(RedisKeyType.DBAnnouncementCommentLike + comment._id.toString());
                    likeCount += await AnnouncementCommentLikeEntity.countDocuments({ commentId: comment._id, type: LikeType.Like });
                    return likeCount;
                });
                comment.subCommentCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementSubCommentCount + comment._id.toString(), 10, async () => {
                    let subCommentCount = 0;
                    subCommentCount += await RedisService.client.hLen(RedisKeyType.DBAnnouncementSubComment + comment._id.toString());
                    subCommentCount += await AnnouncementSubCommentEntity.countDocuments({ commentId: comment._id });
                    return subCommentCount;
                });
                let likeType;
                likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementCommentLike + comment._id.toString(), currentUserId);
                if (!likeType) {
                    likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementCommentDislike + comment._id.toString(), currentUserId);
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
        if (payload.beforeType == LikeType.Like) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBAnnouncementLike + payload.announcementId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await AnnouncementLikeEntity.findOneAndUpdate({ announcementId: payload.announcementId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBAnnouncementDislike + payload.announcementId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await AnnouncementLikeEntity.findOneAndUpdate({ announcementId: payload.announcementId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBAnnouncementLike + payload.announcementId, currentUserId);
        else
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBAnnouncementDislike + payload.announcementId, currentUserId);

        if (!likeDislikeBefore)
            likeDislikeBefore = await AnnouncementLikeEntity.exists({ announcementId: payload.announcementId, ownerId: currentUserId, recordStatus: RecordStatus.Active });

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
        await RedisService.client.hSet(redisKey, currentUserId, stringify(announcementLikeDislikeData));
        return { beforeType: payload.type };
    }

    public static async getAnnouncement(acceptedLanguages: Array<string>, announcementId: string, currentUserId: string): Promise<AnnouncementDocument | null> {
        const now = new Date();
        const announcement = await AnnouncementEntity.findOne({ _id: announcementId, }, {}, { lean: true });

        if (!announcement) throw new NotValidError(getMessage("announcementNotFound", acceptedLanguages));
        if (!announcement.isActive || ((announcement.fromDate && announcement.fromDate > now)
            || (announcement.toDate && announcement.toDate < now))) throw new NotValidError(getMessage("announcementNotAvailable", acceptedLanguages));

        announcement.owner = await UserEntity.findOne({ _id: announcement.ownerId }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });

        announcement.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementLikeCount + announcement._id.toString(), 30, async () => {
            let likeCount = 0;
            likeCount += await RedisService.client.hLen(RedisKeyType.DBAnnouncementLike + announcement._id.toString());
            likeCount += await AnnouncementLikeEntity.countDocuments({ announcementId: announcement._id, type: LikeType.Like });
            return likeCount;
        });
        announcement.commentCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementCommentCount + announcement._id.toString(), 30, async () => {
            let commentCount = 0;
            commentCount += await RedisService.client.hLen(RedisKeyType.DBAnnouncementComment + announcement._id.toString());
            commentCount += await AnnouncementCommentEntity.countDocuments({ announcementId: announcement._id });
            commentCount += await AnnouncementSubCommentEntity.countDocuments({ announcementId: announcement._id });
            return commentCount;
        });
        let likeType;
        likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementLike + announcement._id.toString(), currentUserId);
        if (!likeType) {
            likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementDislike + announcement._id.toString(), currentUserId);
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
        const announcementCommentData: any = {
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
        await RedisService.client.hSet(RedisKeyType.DBAnnouncementComment + payload.announcementId, announcementCommentData.id, stringify(announcementCommentData));

        return true;
    }

    public static async commentLikeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementCommenLikeDisliketDTO, currentUserId: string): Promise<object> {
        if (payload.beforeType == LikeType.Like) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBAnnouncementCommentLike + payload.commentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await AnnouncementCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBAnnouncementCommentDislike + payload.commentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await AnnouncementCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        }


        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBAnnouncementCommentLike + payload.commentId, currentUserId);
        else
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBAnnouncementCommentDislike + payload.commentId, currentUserId);

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
        await RedisService.client.hSet(redisKey, currentUserId, stringify(announcementCommentLikeDislikeData));
        return { beforeType: payload.type };
    }

    public static async getSubComments(acceptedLanguages: Array<string>, payload: AnnouncementGetSubCommentsDTO, currentUserId: string): Promise<AnnouncementSubCommentDocument[]> {
        let subComments: AnnouncementSubCommentDocument[] = [];
        let isFirstPage = !payload.lastRecordId;
        // const redisMaxCommentCount = -30;

        if (isFirstPage) {
            const redisSubComments = await RedisService.client
                .hVals(RedisKeyType.DBAnnouncementSubComment + payload.commentId).then(x => x.map(y => JSON.parse(y).e));

            payload.take -= redisSubComments.length
            let newSubComments: AnnouncementSubCommentDocument[] = [];
            if (payload.take > 0) {
                let newSubCommentsQuery = AnnouncementSubCommentEntity.find({
                    commentId: payload.commentId,
                });

                if (redisSubComments.length > 0)
                    newSubCommentsQuery = newSubCommentsQuery.where({ _id: { $lt: redisSubComments[0]._id } });

                newSubComments = await newSubCommentsQuery.sort({ _id: 1 }).limit(payload.take).lean(true);
            }

            for (let i = 0; i < newSubComments.length; i++)
                subComments.push(newSubComments[i]);

            for (let i = 0; i < redisSubComments.length; i++)
                subComments.push(redisSubComments[i]);


        } else {
            subComments = await AnnouncementSubCommentEntity.find({
                commentId: payload.commentId,
                _id: { $gt: payload.lastRecordId }
            }).sort({ _id: 1 }).limit(payload.take).lean(true);
        }

        if (subComments.length) {
            const subCommentIds = subComments.map(x => x._id);
            const likedDislikedSubComments = await AnnouncementSubCommentLikeEntity.find({ subCommentId: { $in: subCommentIds }, ownerId: currentUserId }, { "_id": 0, "subCommentId": 1, "type": 1 }).lean(true);
            let subCommentUserIds = [...new Set(subComments.map(x => x.ownerId))];
            let subCommentUsers = await UserEntity.find({ _id: { $in: subCommentUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            for (let i = 0; i < subComments.length; i++) {
                const subComment = subComments[i];
                subComment.owner = subCommentUsers.find(y => y._id.toString() === subComment.ownerId);
                subComment.likeCount = await RedisService.acquire<number>(RedisKeyType.AnnouncementSubCommentLikeCount + subComment._id, 20, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.hLen(RedisKeyType.DBAnnouncementSubCommentLike + subComment._id.toString());
                    likeCount += await AnnouncementSubCommentLikeEntity.countDocuments({ subCommentId: subComment._id, type: LikeType.Like });
                    return likeCount;
                });
                let likeType;
                likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementSubCommentLike + subComment._id.toString(), currentUserId);
                if (!likeType) {
                    likeType = await RedisService.client.hExists(RedisKeyType.DBAnnouncementSubCommentDislike + subComment._id.toString(), currentUserId);
                    if (!likeType) {
                        likeType = likedDislikedSubComments.find(y => y.subCommentId === subComment._id.toString());
                        if (likeType) subComment.likeType = likeType.type;
                        else subComment.likeType = LikeType.None;
                    } else {
                        subComment.likeType = LikeType.Dislike;
                    }
                } else {
                    subComment.likeType = LikeType.Like;
                }
            }
        }
        return subComments;
    }

    public static async subCommentAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementSubCommentDTO, currentUserId: string): Promise<object> {
        if (await RedisService.isDailyCommentLimitExceeded(currentUserId))
            throw new NotValidError(getMessage("dailyCommentLimitExceeded", acceptedLanguages));
        let now = new Date();
        const announcementSubCommentEntity = new AnnouncementSubCommentEntity({});
        const announcementSubCommentData: any = {
            e: {
                _id: announcementSubCommentEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                commentId: payload.commentId,
                comment: payload.comment,
                popularity: 0,
                createdAt: now,
                updatedAt: now
            },
        }
        if (payload.replyToId)
            announcementSubCommentData.e.replyToId = payload.replyToId;

        await RedisService.client.hSet(RedisKeyType.DBAnnouncementSubComment + payload.commentId, announcementSubCommentEntity.id, stringify(announcementSubCommentData));

        await RedisService.incrementDailyCommentCount(currentUserId);
        return { _id: announcementSubCommentEntity.id.toString() };
    }

    public static async subCommentLikeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementSubCommenLikeDisliketDTO, currentUserId: string): Promise<object> {
        if (await RedisService.isDailyLikeLimitExceeded(currentUserId))
            throw new NotValidError(getMessage("dailyLikeLimitExceeded", acceptedLanguages));
        if (payload.beforeType == LikeType.Like) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBAnnouncementSubCommentLike + payload.subCommentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await AnnouncementSubCommentLikeEntity.findOneAndUpdate({ subCommentId: payload.subCommentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBAnnouncementSubCommentDislike + payload.subCommentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await AnnouncementSubCommentLikeEntity.findOneAndUpdate({ subCommentId: payload.subCommentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBAnnouncementSubCommentLike + payload.subCommentId, currentUserId);
        else if (payload.type == LikeType.Dislike)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBAnnouncementSubCommentDislike + payload.subCommentId, currentUserId);
        else
            throw new NotValidError(getMessage("likeDislikeTypeNotValid", acceptedLanguages));

        if (!likeDislikeBefore)
            likeDislikeBefore = await AnnouncementSubCommentLikeEntity.findOne({ subCommentId: payload.subCommentId, ownerId: currentUserId });

        if (likeDislikeBefore)
            throw new NotValidError(getMessage("alreadyLikedOrDisliked", acceptedLanguages));
        //TODO: bu tur hatalari socketten gonder, responseu hemen don.

        const now = new Date();
        const announcementSubCommentLikeEntity = new AnnouncementSubCommentLikeEntity({});
        const announcementSubCommentLikeDislikeData: object = {
            e: {
                _id: announcementSubCommentLikeEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                commentId: payload.commentId,
                subCommentId: payload.subCommentId,
                createdAt: now,
                updatedAt: now
            },
        }
        let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBAnnouncementSubCommentLike : RedisKeyType.DBAnnouncementSubCommentDislike;
        redisKey += payload.subCommentId;
        await RedisService.client.hSet(redisKey, currentUserId, stringify(announcementSubCommentLikeDislikeData));

        await RedisService.incrementDailyLikeCount(currentUserId);
        return { beforeType: payload.type };
    }
}